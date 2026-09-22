import {
  WardrobeStats,
  type StatisticheArmadio,
} from "@/components/app/wardrobe-stats";
import { CATEGORIES, type Category } from "@/lib/ai/types";
import { CAPI_DEMO, PROPOSTE_DEMO } from "@/lib/demo/data";

/**
 * Le statistiche dell'armadio dimostrativo.
 *
 * Calcolate davvero dai dati della demo, non scritte a mano: se domani si
 * aggiunge un capo ai dati, questi numeri si aggiornano da soli invece di
 * restare fermi a raccontare un armadio che non esiste più.
 */
function calcola(): StatisticheArmadio {
  // Quante volte ogni capo compare nelle proposte di tutte le occasioni.
  const usi = new Map<string, number>();
  for (const proposte of Object.values(PROPOSTE_DEMO)) {
    for (const p of proposte) {
      for (const capo of p.items) {
        usi.set(capo.id, (usi.get(capo.id) ?? 0) + 1);
      }
    }
  }

  const maiUsati = CAPI_DEMO.filter((c) => !usi.has(c.id));

  let piuUsato: StatisticheArmadio["piuUsato"] = null;
  for (const capo of CAPI_DEMO) {
    const volte = usi.get(capo.id) ?? 0;
    if (volte > (piuUsato?.volte ?? 0)) piuUsato = { capo, volte };
  }

  const perCategoria = CATEGORIES.map((categoria: Category) => ({
    categoria,
    quanti: CAPI_DEMO.filter((c) => c.category === categoria).length,
  }));

  return {
    totale: CAPI_DEMO.length,
    perCategoria,
    maiUsati,
    piuUsato,
    outfitSalvati: 6,
  };
}

export default function DemoStatistiche() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Statistiche
        </h1>
        <p className="mt-1 text-muted-foreground text-pretty">
          Cosa c&apos;è nell&apos;armadio, e cosa non esce mai.
        </p>
      </header>

      <WardrobeStats s={calcola()} />

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        Nell&apos;app questi numeri si calcolano sui tuoi capi e sugli outfit
        che hai davvero salvato. È la schermata che dice se VESTA sta
        funzionando: se i capi mai usati calano, stai usando di più quello che
        hai già.
      </p>
    </div>
  );
}
