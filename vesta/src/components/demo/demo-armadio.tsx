"use client";

import { useState } from "react";

import { ItemGrid } from "@/components/app/item-grid";
import { DemoAddItem } from "@/components/demo/demo-add-item";
import type { CapoConFoto } from "@/lib/items";

/**
 * L'armadio della demo, con lo stato dei capi aggiunti.
 *
 * Client component per un motivo solo: i capi che si aggiungono devono
 * comparire davvero nella griglia. Senza, il flusso «fotografa un capo»
 * finirebbe con un messaggio di conferma e nient'altro, che è esattamente
 * il punto in cui una demo smette di convincere.
 *
 * Lo stato vive in memoria: ricaricando la pagina si torna all'armadio di
 * partenza. È voluto — la demo non scrive niente da nessuna parte.
 */
export function DemoArmadio({
  iniziali,
  apriSubito = false,
}: {
  iniziali: CapoConFoto[];
  apriSubito?: boolean;
}) {
  const [capi, setCapi] = useState(iniziali);

  return (
    <>
      <p className="text-muted-foreground">
        {capi.length} capi. Filtra per categoria.
      </p>

      <DemoAddItem
        apriSubito={apriSubito}
        onAggiunto={(capo) =>
          // In cima: è quello appena aggiunto, deve vedersi senza scorrere.
          setCapi((precedenti) =>
            precedenti.some((c) => c.id === capo.id)
              ? precedenti
              : [capo, ...precedenti]
          )
        }
      />

      <ItemGrid capi={capi} eliminabili={false} />
    </>
  );
}
