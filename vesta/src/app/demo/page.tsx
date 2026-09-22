import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Plus, Settings } from "lucide-react";

import { ContextLine } from "@/components/app/context-line";
import { OutfitCarousel } from "@/components/app/outfit-carousel";
import { ToolGrid } from "@/components/app/tool-grid";
import { DownloadPackage } from "@/components/demo/download-package";
import { Button } from "@/components/ui/button";
import { CAPI_DEMO, METEO_DEMO, PROPOSTE_DEMO } from "@/lib/demo/data";

export default function DemoHome() {
  const proposte = PROPOSTE_DEMO.universita;
  const recenti = CAPI_DEMO.slice(0, 6);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">
            Ciao Sara
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {CAPI_DEMO.length} capi nell&apos;armadio
          </p>
        </div>
        <Link
          href="/demo/impostazioni"
          aria-label="Impostazioni"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      <ToolGrid base="/demo" />

      <section aria-labelledby="oggi-titolo" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2
              id="oggi-titolo"
              className="font-heading text-lg font-extrabold tracking-tight text-balance"
            >
              Per oggi, all&apos;università
            </h2>
            <div className="mt-1.5">
              <ContextLine meteo={METEO_DEMO} citta="Pescara" />
            </div>
          </div>
          <Link
            href="/demo/outfit"
            className="inline-flex min-h-11 min-w-11 items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground"
          >
            Altre
          </Link>
        </div>

        <OutfitCarousel proposte={proposte} />
      </section>

      <section aria-labelledby="recenti-titolo" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="recenti-titolo"
            className="font-heading text-lg font-extrabold tracking-tight"
          >
            Aggiunti di recente
          </h2>
          <Link
            href="/demo/armadio"
            aria-label="Vai all'armadio"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex gap-3">
            <li className="shrink-0">
              <Link
                href="/demo/armadio?aggiungi=1"
                aria-label="Aggiungi un capo"
                className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Plus className="size-6" aria-hidden strokeWidth={2} />
              </Link>
            </li>
            {recenti.map((capo) => (
              <li key={capo.id} className="shrink-0">
                <div className="relative size-20 overflow-hidden rounded-2xl border border-border bg-muted">
                  {capo.photoUrl ? (
                    <Image
                      src={capo.photoUrl}
                      alt={capo.subcategory ?? capo.category}
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Nell&apos;app fotografi un capo e un modello lo riconosce da solo:
          categoria, colori, stagione, quanto copre. Qui la foto la scegli fra
          tre già pronte, ma il resto del passaggio è identico.
        </p>
        <Button asChild className="mt-3 h-11 w-full font-bold">
          <Link href="/demo/armadio?aggiungi=1">Provalo</Link>
        </Button>
      </div>

      <DownloadPackage />
    </div>
  );
}
