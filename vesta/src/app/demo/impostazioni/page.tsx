import Link from "next/link";
import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DownloadPackage } from "@/components/demo/download-package";

export default function DemoImpostazioni() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Impostazioni
        </h1>
      </header>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-base font-extrabold">
            Il codice di VESTA
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Il sorgente completo, con la guida che spiega com&apos;è fatto.
          </p>
        </div>
        <DownloadPackage compatto />
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-base font-extrabold">I tuoi dati</h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Nell&apos;app vera scarichi tutto quello che abbiamo su di te in un
            file JSON: profilo, capi, outfit, amicizie. Senza chiedere niente a
            nessuno.
          </p>
        </div>
        <Button
          variant="outline"
          disabled
          className="h-11 w-full gap-2 border-2 bg-background font-bold"
        >
          <Download className="size-4" aria-hidden />
          Scarica i miei dati
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border-2 border-destructive/30 bg-card p-5">
        <div>
          <h2 className="font-heading text-base font-extrabold text-destructive">
            Cancella l&apos;account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Spariscono profilo, capi, outfit, amicizie e tutte le foto, da
            entrambi gli archivi. Non si torna indietro.
          </p>
        </div>
        <Button variant="destructive" disabled className="h-11 w-full gap-2 font-bold">
          <Trash2 className="size-4" aria-hidden />
          Cancella tutto
        </Button>
      </section>

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        Qui i due pulsanti sono spenti perché non c&apos;è nessun account da
        esportare o cancellare. Nell&apos;app vera funzionano davvero, ed è il
        motivo per cui sono in fondo e non nascosti in un modulo da compilare.
      </p>

      <nav aria-label="Note legali">
        <ul className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <li>
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/cookie" className="underline underline-offset-4">
              Cookie
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
