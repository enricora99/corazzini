import type { Metadata } from "next";

import {
  OutfitCalendar,
  RigaStatistiche,
} from "@/components/app/outfit-calendar";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { getMesePianificato } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Calendario",
  robots: { index: false, follow: false },
};

export default async function CalendarioPage() {
  const { profilo } = await richiediUtenteMaggiorenne("/app/calendario");

  const adesso = new Date();
  const giorni = await getMesePianificato(
    profilo.id,
    adesso.getFullYear(),
    adesso.getMonth()
  );

  const capiCoinvolti = new Set(
    giorni.flatMap((g) => g.anteprime)
  ).size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Calendario
        </h1>
        <p className="mt-1 text-muted-foreground text-pretty">
          Decidi prima, così la mattina non decidi affatto.
        </p>
      </header>

      <OutfitCalendar
        anno={adesso.getFullYear()}
        mese={adesso.getMonth()}
        giorni={giorni}
        oggi={adesso.getDate()}
      />

      {giorni.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground text-pretty">
          Nessun outfit salvato questo mese. Quelli che salvi dalla schermata
          Outfit compaiono qui, sul giorno in cui li hai scelti.
        </p>
      ) : (
        <RigaStatistiche
          voci={[
            { etichetta: "Outfit nel mese", valore: String(giorni.length) },
            { etichetta: "Capi coinvolti", valore: String(capiCoinvolti) },
            {
              etichetta: "Giorni scoperti",
              valore: String(
                new Date(adesso.getFullYear(), adesso.getMonth() + 1, 0).getDate() -
                  giorni.length
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
