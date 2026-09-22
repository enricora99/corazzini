import { Download, FileCode2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { conBase } from "@/lib/base-path";
import informazioni from "@/lib/pacchetto.json";

/**
 * Il pulsante per portarsi via il sorgente.
 *
 * Lo zip lo genera `scripts/build-package.mjs` prima di ogni build, quindi
 * quello che si scarica è sempre il codice che sta girando — non una copia
 * vecchia dimenticata nel repository.
 *
 * Peso e numero di file arrivano dal file scritto dallo stesso script: sono
 * i numeri veri di quel pacchetto, non una stima aggiornata a mano che prima
 * o poi smette di corrispondere.
 */
export function DownloadPackage({
  compatto = false,
}: {
  /** Versione ridotta, per le pagine dove non è l'azione principale. */
  compatto?: boolean;
}) {
  const mb = (informazioni.byte / 1024 / 1024).toFixed(1);
  const quando = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(informazioni.generatoIl));

  if (compatto) {
    return (
      <Button
        asChild
        variant="outline"
        className="h-11 w-full gap-2 border-2 bg-background font-bold"
      >
        <a href={conBase("/vesta-codice.zip")} download>
          <Download className="size-4" aria-hidden />
          Scarica il codice ({mb} MB)
        </a>
      </Button>
    );
  }

  return (
    <section className="space-y-3 rounded-3xl border-2 border-primary bg-accent p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary">
          <FileCode2
            className="size-6 text-primary-foreground"
            aria-hidden
            strokeWidth={2}
          />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-extrabold text-accent-foreground text-balance">
            Portati via il codice
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-accent-foreground/80 text-pretty">
            Il sorgente completo di VESTA, con dentro una guida che spiega
            com&apos;è fatto e perché. È il codice vero, quello che sta girando
            adesso.
          </p>
        </div>
      </div>

      <Button asChild size="lg" className="h-12 w-full gap-2 text-base font-bold">
        <a href={conBase("/vesta-codice.zip")} download>
          <Download className="size-5" aria-hidden strokeWidth={2} />
          Scarica il pacchetto
        </a>
      </Button>

      <p className="text-center text-xs text-accent-foreground/70">
        {informazioni.file} file · {mb} MB · aggiornato il {quando}
      </p>
    </section>
  );
}
