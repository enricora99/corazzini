import type { Metadata } from "next";
import { Shirt } from "lucide-react";

import { AddItemSheet } from "@/components/app/add-item-sheet";
import { ItemGrid } from "@/components/app/item-grid";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { getMieiCapi } from "@/lib/items";

export const metadata: Metadata = {
  title: "Armadio",
  robots: { index: false, follow: false },
};

export default async function ArmadioPage({
  searchParams,
}: PageProps<"/app/armadio">) {
  const { profilo } = await richiediUtenteMaggiorenne("/app/armadio");
  const params = await searchParams;
  const capi = await getMieiCapi(profilo.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Armadio
        </h1>
        <p className="mt-1 text-muted-foreground">
          {capi.length === 0
            ? "Ancora vuoto."
            : capi.length === 1
              ? "1 capo."
              : `${capi.length} capi.`}
        </p>
      </header>

      <AddItemSheet userId={profilo.id} apriSubito={params.aggiungi === "1"} />

      {capi.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <Shirt className="size-8 text-muted-foreground" aria-hidden strokeWidth={1.5} />
          <p className="font-heading text-lg font-extrabold">
            Comincia da un capo che metti spesso
          </p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            Bastano una decina di pezzi perché VESTA inizi a proporti qualcosa
            di sensato.
          </p>
        </div>
      ) : (
        <ItemGrid capi={capi} />
      )}
    </div>
  );
}
