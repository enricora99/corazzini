"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { RevisioneCapo, type Bozza } from "@/components/app/add-item-sheet";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { conBase } from "@/lib/base-path";
import {
  CAPI_DA_RICONOSCERE,
  DURATA_ANALISI_MS,
  type CapoDaRiconoscere,
} from "@/lib/demo/nuovi-capi";
import type { CapoConFoto } from "@/lib/items";

type Fase = "scelta" | "analisi" | "revisione";

/**
 * Il flusso «fotografa un capo», in versione dimostrativa.
 *
 * È la parte che racconta l'idea: la griglia piena non dice niente su come
 * ci sia finita. Qui si vede il passaggio che conta — la foto entra, il
 * capo esce catalogato, e tu puoi correggere prima di salvare.
 *
 * Il form di revisione è quello vero dell'app, importato da add-item-sheet:
 * così quello che la giuria guarda è l'interfaccia di produzione, non una
 * copia che col tempo diverge.
 */
export function DemoAddItem({
  onAggiunto,
}: {
  onAggiunto: (capo: CapoConFoto) => void;
}) {
  const [aperto, setAperto] = useState(false);
  const [fase, setFase] = useState<Fase>("scelta");
  const [bozza, setBozza] = useState<Bozza | null>(null);
  const idBase = useId();

  function chiudi(stato: boolean) {
    setAperto(stato);
    if (!stato) {
      setFase("scelta");
      setBozza(null);
    }
  }

  function fotografa(capo: CapoDaRiconoscere) {
    setFase("analisi");

    setTimeout(() => {
      const r = capo.riconosciuto;
      setBozza({
        id: `demo-nuovo-${capo.slug}`,
        photoPath: `demo/${capo.slug}.svg`,
        anteprima: conBase(`/demo/${capo.slug}.svg`),
        category: r.category,
        subcategory: r.subcategory,
        colors: r.colors.join(", "),
        seasons: r.seasons,
        style: r.style,
        warmth: String(r.warmth),
        aiClassified: true,
      });
      setFase("revisione");
    }, DURATA_ANALISI_MS);
  }

  function salva() {
    if (!bozza) return;

    onAggiunto({
      id: bozza.id,
      user_id: "demo-utente",
      photo_path: bozza.photoPath,
      photoUrl: bozza.anteprima,
      category: bozza.category,
      subcategory: bozza.subcategory || null,
      colors: bozza.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      seasons: bozza.seasons,
      style: bozza.style || null,
      warmth: bozza.warmth ? Number(bozza.warmth) : null,
      notes: null,
      created_at: new Date().toISOString(),
      ownerName: null,
    });

    toast.success("Capo aggiunto all'armadio.");
    chiudi(false);
  }

  // Non riproponiamo lo stesso capo due volte nella stessa sessione.
  const disponibili = CAPI_DA_RICONOSCERE;

  return (
    <>
      <Button
        onClick={() => setAperto(true)}
        size="lg"
        className="h-13 w-full gap-2 text-base font-bold"
      >
        <Camera className="size-5" aria-hidden strokeWidth={2} />
        Aggiungi un capo
      </Button>

      <Sheet open={aperto} onOpenChange={chiudi}>
        <SheetContent
          side="bottom"
          className="max-h-[92svh] overflow-y-auto rounded-t-3xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-xl font-extrabold">
              {fase === "revisione" ? "Controlla e salva" : "Aggiungi un capo"}
            </SheetTitle>
            <SheetDescription>
              {fase === "revisione"
                ? "Abbiamo compilato noi. Correggi quello che non torna."
                : "Nell'app scatti tu. Qui le foto sono già pronte: scegline una."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-8">
            {fase === "scelta" ? (
              <ul className="grid grid-cols-3 gap-3">
                {disponibili.map((capo) => (
                  <li key={capo.slug}>
                    <button
                      type="button"
                      onClick={() => fotografa(capo)}
                      className="w-full space-y-2 rounded-2xl border-2 border-border bg-card p-2 text-center transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="relative block aspect-square overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={conBase(`/demo/${capo.slug}.svg`)}
                          alt=""
                          fill
                          sizes="33vw"
                          className="object-cover"
                        />
                      </span>
                      <span className="block text-xs font-semibold">
                        {capo.etichetta}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {fase === "analisi" ? (
              <div
                role="status"
                className="flex flex-col items-center gap-3 py-12 text-center"
              >
                <Loader2
                  className="size-8 animate-spin text-muted-foreground"
                  aria-hidden
                />
                <p className="font-semibold">Stiamo guardando il capo…</p>
                <p className="max-w-xs text-sm text-muted-foreground text-pretty">
                  Nell&apos;app vera qui lavora un modello di visione:
                  riconosce categoria, colori, stagione e quanto copre.
                </p>
              </div>
            ) : null}

            {bozza && fase === "revisione" ? (
              <>
                <p className="flex items-start gap-2 rounded-xl bg-accent p-3 text-sm font-medium text-accent-foreground">
                  <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                  Questi campi li ha compilati il modello guardando la foto.
                  Cambia quello che non ti torna.
                </p>

                <RevisioneCapo
                  bozza={bozza}
                  setBozza={setBozza}
                  avviso={null}
                  idBase={idBase}
                  salvataggio={false}
                  onSalva={salva}
                />
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
