import type { Metadata } from "next";

import { WardrobeStats } from "@/components/app/wardrobe-stats";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { getStatistiche } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Statistiche",
  robots: { index: false, follow: false },
};

export default async function StatistichePage() {
  const { profilo } = await richiediUtenteMaggiorenne("/app/statistiche");
  const s = await getStatistiche(profilo.id);

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

      {s.totale === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground text-pretty">
          Qui compariranno i numeri del tuo armadio: quanti capi hai, come sono
          divisi e — soprattutto — quali non metti mai. Serve qualche capo per
          cominciare.
        </p>
      ) : (
        <WardrobeStats s={s} />
      )}
    </div>
  );
}
