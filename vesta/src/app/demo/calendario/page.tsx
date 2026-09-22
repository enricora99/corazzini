import {
  OutfitCalendar,
  RigaStatistiche,
} from "@/components/app/outfit-calendar";
import { giorniDemo } from "@/lib/demo/data";

/**
 * Rigenerata ogni ora.
 *
 * Statica sarebbe più economica, ma il giorno di oggi resterebbe quello del
 * build: un calendario che evidenzia martedì mentre è venerdì è la cosa che
 * più in fretta fa capire a chi guarda che sta vedendo una finzione.
 */
export const revalidate = 3600;

export default function DemoCalendario() {
  const adesso = new Date();
  const giorni = giorniDemo(adesso.getFullYear(), adesso.getMonth());

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

      <RigaStatistiche
        voci={[
          { etichetta: "Outfit pianificati", valore: String(giorni.length) },
          { etichetta: "Questa settimana", valore: "5" },
          { etichetta: "Capi coinvolti", valore: "11" },
        ]}
      />

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        Nell&apos;app gli outfit che salvi finiscono qui, e puoi spostarli da
        un giorno all&apos;altro. Chi pianifica la settimana la domenica sera
        smette di aprire l&apos;armadio senza sapere cosa cerca.
      </p>
    </div>
  );
}
