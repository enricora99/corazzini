import Link from "next/link";
import { Camera } from "lucide-react";

import { ItemGrid } from "@/components/app/item-grid";
import { Button } from "@/components/ui/button";
import { CAPI_DEMO } from "@/lib/demo/data";

export default function DemoArmadio() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Armadio
        </h1>
        <p className="mt-1 text-muted-foreground">
          {CAPI_DEMO.length} capi. Filtra per categoria.
        </p>
      </header>

      <Button
        asChild
        variant="outline"
        size="lg"
        className="h-13 w-full gap-2 border-2 border-dashed bg-card text-base font-bold"
      >
        <Link href="/#lista">
          <Camera className="size-5" aria-hidden strokeWidth={2} />
          Nella demo non si caricano foto
        </Link>
      </Button>

      {/* `eliminabili` a false: senza, comparirebbe un cestino che non può
          cancellare niente, e un pulsante che non fa nulla è peggio di un
          pulsante che non c'è. */}
      <ItemGrid capi={CAPI_DEMO} eliminabili={false} />

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        Le immagini sono disegni, non fotografie: le foto dei capi veri le
        carica chi usa l&apos;app. Categoria, colori e stagione sono i campi
        che il modello compila da solo guardando la foto.
      </p>
    </div>
  );
}
