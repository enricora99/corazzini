import { OCCASION_LABELS } from "@/lib/schemas";
import type { ImageInput, ItemSummary, SuggestInput } from "./types";

/**
 * I testi che mandiamo ai modelli, in un posto solo.
 *
 * Stanno fuori dai fornitori perché il prompt dell'immagine è lo stesso per
 * Gemini, Seedream e Qwen: cambia chi lo esegue, non cosa gli si chiede.
 */

/** Righe compatte con i capi disponibili. Solo metadati: le fotografie non
 *  escono mai da qui, come promesso nell'informativa privacy. */
export function descriviCapi(items: ItemSummary[]): string {
  return items
    .map((capo) => {
      const pezzi = [
        `id=${capo.id}`,
        capo.category,
        capo.subcategory ?? null,
        capo.colors.length ? `colori: ${capo.colors.join("/")}` : null,
        capo.seasons.length ? `stagioni: ${capo.seasons.join("/")}` : null,
        capo.style ?? null,
        capo.warmth ? `calore ${capo.warmth}/5` : null,
        capo.ownerName ? `IN PRESTITO DA ${capo.ownerName}` : null,
      ].filter(Boolean);
      return `- ${pezzi.join(" · ")}`;
    })
    .join("\n");
}

function descriviMeteo(weather: SuggestInput["weather"]): string {
  if (!weather) {
    return "Meteo non disponibile: scegli capi che vadano bene in una giornata media di questa stagione.";
  }
  return [
    `Meteo${weather.city ? ` a ${weather.city}` : ""}: ${weather.description}.`,
    `Temperatura ${Math.round(weather.temperature)} gradi, percepiti ${Math.round(weather.apparent)}.`,
    weather.precipitation > 0
      ? `Precipitazioni previste: ${weather.precipitation} mm. Tienine conto.`
      : "Non piove.",
  ].join(" ");
}

export function promptProposte(input: SuggestInput): string {
  return [
    "Sei uno stilista che compone outfit usando SOLO i capi elencati qui sotto.",
    "",
    "CAPI DISPONIBILI:",
    descriviCapi(input.items),
    "",
    `OCCASIONE: ${OCCASION_LABELS[input.occasion]}`,
    descriviMeteo(input.weather),
    "",
    "Componi esattamente tre outfit diversi tra loro.",
    "",
    "Regole vincolanti:",
    "- Usa esclusivamente gli id che compaiono nell'elenco. Non inventarne altri.",
    "- Ogni outfit ha da due a sei capi e deve stare in piedi: qualcosa sopra, qualcosa sotto, le scarpe. Un vestito intero sostituisce sopra e sotto.",
    "- Non mettere due capi della stessa categoria nello stesso outfit, tranne le giacche sopra un top.",
    "- I tre outfit devono essere davvero diversi: non cambiare solo le scarpe.",
    "- Tieni conto del meteo: se fa freddo alza il calore complessivo, se piove evita scamosciato e tessuti leggeri.",
    "",
    "Per ogni outfit scrivi una sola riga di spiegazione (rationale):",
    "- in italiano, dando del tu",
    "- al massimo venti parole",
    "- dì perché funziona, non elencare i capi: quelli si vedono già",
    "- niente entusiasmo forzato, niente punti esclamativi",
    "- se usi un capo in prestito, dillo (per esempio: «la giacca te la fai prestare da Giulia»)",
  ].join("\n");
}

export function promptImmagine(input: ImageInput): string {
  const capi = input.items
    .map((capo) => {
      const pezzi = [
        capo.subcategory ?? capo.category,
        capo.colors.length ? `di colore ${capo.colors.join(" e ")}` : null,
      ].filter(Boolean);
      return `- ${pezzi.join(" ")}`;
    })
    .join("\n");

  return [
    "Fotografia still life di un outfit disposto in piano (flat lay), vista dall'alto.",
    "",
    "Capi da mostrare, tutti e soli questi:",
    capi,
    "",
    `Occasione: ${OCCASION_LABELS[input.occasion]}.`,
    "",
    "Stile dell'immagine:",
    "- sfondo uniforme color crema chiaro, quasi bianco",
    "- luce naturale morbida, ombre tenui",
    "- capi ordinati e ben distanziati, composizione pulita e centrata",
    "- resa fotografica realistica, come un catalogo di moda",
    "- formato quadrato",
    "",
    "NON includere: persone, volti, parti del corpo, manichini, testo, scritte, loghi, filigrane.",
  ].join("\n");
}
