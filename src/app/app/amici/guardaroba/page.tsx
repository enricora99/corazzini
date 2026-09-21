import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { ItemGrid } from "@/components/app/item-grid";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { getCapiAmici } from "@/lib/items";

export const metadata: Metadata = {
  title: "Il guardaroba degli amici",
  robots: { index: false, follow: false },
};

export default async function GuardarobaAmiciPage() {
  const { profilo } = await richiediUtenteMaggiorenne("/app/amici/guardaroba");

  // Nessun filtro per amicizia qui: la policy di lettura su `items` usa
  // `are_friends()` e restituisce solo ciò che abbiamo il diritto di vedere.
  const capi = await getCapiAmici(profilo.id);

  return (
    <div className="space-y-6">
      <Link
        href="/app/amici"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Amici
      </Link>

      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Il guardaroba degli amici
        </h1>
        <p className="mt-1 text-muted-foreground">
          {capi.length === 0
            ? "I tuoi amici non hanno ancora caricato niente."
            : `${capi.length} capi che puoi chiedere in prestito.`}
        </p>
      </header>

      {capi.length > 0 ? <ItemGrid capi={capi} eliminabili={false} /> : null}
    </div>
  );
}
