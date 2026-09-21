"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { ImageOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { eliminaCapo } from "@/app/actions/items";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORY_LABELS, type Category } from "@/lib/ai/types";
import type { CapoConFoto } from "@/lib/items";

export function ItemGrid({
  capi,
  eliminabili = true,
}: {
  capi: CapoConFoto[];
  eliminabili?: boolean;
}) {
  const [filtro, setFiltro] = useState<Category | "tutti">("tutti");
  const [daEliminare, setDaEliminare] = useState<CapoConFoto | null>(null);
  const [inCorso, startTransition] = useTransition();

  // Solo le categorie che l'utente ha davvero: un filtro "Gonna" su un
  // armadio senza gonne è una scheda che non fa niente.
  const categorie = useMemo(() => {
    const presenti = new Set(capi.map((c) => c.category));
    return (Object.keys(CATEGORY_LABELS) as Category[]).filter((c) =>
      presenti.has(c)
    );
  }, [capi]);

  const visibili = useMemo(
    () => (filtro === "tutti" ? capi : capi.filter((c) => c.category === filtro)),
    [capi, filtro]
  );

  function conferma() {
    if (!daEliminare) return;
    const capo = daEliminare;
    startTransition(async () => {
      const esito = await eliminaCapo(capo.id);
      if (esito.ok) {
        toast.success("Capo eliminato.");
        setDaEliminare(null);
      } else {
        toast.error(esito.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {categorie.length > 1 ? (
        <div
          role="group"
          aria-label="Filtra per categoria"
          // Scorre in orizzontale su telefono senza mandare in overflow la
          // pagina: il contenitore ha la sua barra, il body no.
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <FiltroChip
            attivo={filtro === "tutti"}
            onClick={() => setFiltro("tutti")}
          >
            Tutti
          </FiltroChip>
          {categorie.map((c) => (
            <FiltroChip
              key={c}
              attivo={filtro === c}
              onClick={() => setFiltro(c)}
            >
              {CATEGORY_LABELS[c]}
            </FiltroChip>
          ))}
        </div>
      ) : null}

      {visibili.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Niente in questa categoria.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibili.map((capo) => (
            <li key={capo.id}>
              <article className="group relative overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-square bg-muted">
                  {capo.photoUrl ? (
                    <Image
                      src={capo.photoUrl}
                      alt={capo.subcategory ?? CATEGORY_LABELS[capo.category]}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      // Il browser ha già prodotto un WebP a 1024px prima di
                      // caricarlo: rioptimizzare non guadagna nulla, e i
                      // collegamenti firmati cambiano a ogni richiesta,
                      // quindi la cache dell'ottimizzatore mancherebbe sempre.
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-6" aria-hidden />
                      <span className="sr-only">Foto non disponibile</span>
                    </div>
                  )}

                  {eliminabili ? (
                    <button
                      type="button"
                      onClick={() => setDaEliminare(capo)}
                      aria-label={`Elimina ${capo.subcategory ?? CATEGORY_LABELS[capo.category]}`}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-2 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-hover:opacity-100 max-sm:opacity-100"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </div>

                <div className="space-y-0.5 p-3">
                  <p className="truncate text-sm font-bold">
                    {capo.subcategory || CATEGORY_LABELS[capo.category]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {capo.ownerName
                      ? `di ${capo.ownerName}`
                      : capo.colors.join(", ") || CATEGORY_LABELS[capo.category]}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(daEliminare)}
        onOpenChange={(o) => !o && setDaEliminare(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">
              Eliminare questo capo?
            </DialogTitle>
            <DialogDescription>
              Sparisce dall&apos;armadio insieme alla sua foto. Non si torna
              indietro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDaEliminare(null)}
              disabled={inCorso}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={conferma}
              disabled={inCorso}
            >
              {inCorso ? "Elimino…" : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FiltroChip({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
        attivo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
