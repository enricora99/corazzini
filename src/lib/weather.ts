import type { WeatherSnapshot } from "@/lib/ai/types";

/**
 * Meteo da Open-Meteo.
 *
 * Nessuna chiave, nessun account, nessun tracciamento. Mandiamo la posizione
 * arrotondata a due decimali, circa un chilometro: per sapere se piove basta
 * e avanza, e non consegniamo a nessuno il civico di casa di un utente.
 */

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const TIMEOUT_MS = 8_000;

/** Codici meteo WMO, quelli che Open-Meteo restituisce. */
const DESCRIZIONI: Record<number, string> = {
  0: "sereno",
  1: "poco nuvoloso",
  2: "parzialmente nuvoloso",
  3: "coperto",
  45: "nebbia",
  48: "nebbia con brina",
  51: "pioviggine leggera",
  53: "pioviggine",
  55: "pioviggine intensa",
  56: "pioviggine gelata",
  57: "pioviggine gelata intensa",
  61: "pioggia leggera",
  63: "pioggia",
  65: "pioggia forte",
  66: "pioggia gelata",
  67: "pioggia gelata forte",
  71: "neve leggera",
  73: "neve",
  75: "neve abbondante",
  77: "granelli di neve",
  80: "rovesci leggeri",
  81: "rovesci",
  82: "rovesci violenti",
  85: "rovesci di neve",
  86: "rovesci di neve intensi",
  95: "temporale",
  96: "temporale con grandine",
  99: "temporale con grandine forte",
};

type RispostaOpenMeteo = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
  };
};

/** Arrotonda la posizione a ~1 km prima di mandarla fuori. */
export function arrotondaPosizione(valore: number): number {
  return Number(valore.toFixed(2));
}

export async function getMeteo(
  lat: number,
  lon: number
): Promise<WeatherSnapshot | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("latitude", String(arrotondaPosizione(lat)));
  url.searchParams.set("longitude", String(arrotondaPosizione(lon)));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,precipitation,weather_code"
  );
  url.searchParams.set("timezone", "auto");

  try {
    const risposta = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Un quarto d'ora: il meteo non cambia al minuto, e così due persone
      // nella stessa zona non fanno due chiamate.
      next: { revalidate: 900 },
    });

    if (!risposta.ok) return null;

    const dati = (await risposta.json()) as RispostaOpenMeteo;
    const adesso = dati.current;
    if (!adesso || adesso.temperature_2m === undefined) return null;

    return {
      temperature: adesso.temperature_2m,
      apparent: adesso.apparent_temperature ?? adesso.temperature_2m,
      precipitation: adesso.precipitation ?? 0,
      description: DESCRIZIONI[adesso.weather_code ?? 0] ?? "tempo variabile",
    };
  } catch (errore) {
    // Il meteo è un di più: se non arriva, si compone l'outfit lo stesso.
    console.error("[meteo] non disponibile:", errore);
    return null;
  }
}
