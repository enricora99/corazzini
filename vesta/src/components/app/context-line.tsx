import { CalendarDays, CloudSun, MapPin } from "lucide-react";

import type { WeatherSnapshot } from "@/lib/ai/types";

/**
 * Data, luogo e meteo su una riga sola, sopra le proposte.
 *
 * Serve a dire perché quell'outfit e non un altro: senza, tre proposte sono
 * tre accostamenti qualsiasi; con questa riga diventano tre risposte a una
 * giornata precisa.
 *
 * Il luogo compare solo se c'è. Non facciamo geocodifica inversa: mandare
 * le coordinate di qualcuno a un terzo servizio per scriverci sopra il nome
 * di una città è un prezzo che non vale il vantaggio.
 */
export function ContextLine({
  meteo,
  citta,
  data = new Date(),
}: {
  meteo: WeatherSnapshot | null;
  citta?: string | null;
  data?: Date;
}) {
  const giorno = new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(data);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-4 shrink-0" aria-hidden />
        <span className="capitalize">{giorno}</span>
      </span>

      {citta ? (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {citta}
        </span>
      ) : null}

      {meteo ? (
        <span className="inline-flex items-center gap-1.5">
          <CloudSun className="size-4 shrink-0" aria-hidden />
          <span>
            {meteo.description}, {Math.round(meteo.temperature)}°
          </span>
        </span>
      ) : null}
    </div>
  );
}
