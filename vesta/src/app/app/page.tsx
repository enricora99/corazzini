import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Plus, Settings } from "lucide-react";

import { ToolGrid } from "@/components/app/tool-grid";
import { Button } from "@/components/ui/button";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { getMieiCapi } from "@/lib/items";

export const metadata: Metadata = {
  title: "Il tuo armadio",
  robots: { index: false, follow: false },
};

export default async function AppHome() {
  const { profilo } = await richiediUtenteMaggiorenne();
  const capi = await getMieiCapi(profilo.id);
  const recenti = capi.slice(0, 6);

  const nome = profilo.display_name?.trim() || profilo.email.split("@")[0];

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-extrabold tracking-tight">
            Ciao {nome}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {capi.length === 0
              ? "L'armadio è ancora vuoto"
              : capi.length === 1
                ? "1 capo nell'armadio"
                : `${capi.length} capi nell'armadio`}
          </p>
        </div>
        <Link
          href="/app/impostazioni"
          aria-label="Impostazioni"
          className="inline-flex min-h-11 min-w-11 items-center justify-center shrink-0 rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      <ToolGrid base="/app" />

      <section aria-labelledby="recenti-titolo" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="recenti-titolo"
            className="font-heading text-lg font-extrabold tracking-tight"
          >
            {capi.length === 0 ? "Comincia da qui" : "Aggiunti di recente"}
          </h2>
          {capi.length > 0 ? (
            <Link
              href="/app/armadio"
              aria-label="Vai all'armadio"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          ) : null}
        </div>

        {capi.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-border p-5 text-center">
            <p className="text-sm text-muted-foreground text-pretty">
              Fotografa un capo che metti spesso. Ci pensiamo noi a
              catalogarlo, e da lì l&apos;armadio si riempie in fretta.
            </p>
            <Button asChild className="h-11 w-full font-bold">
              <Link href="/app/armadio?aggiungi=1">Aggiungi il primo capo</Link>
            </Button>
          </div>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex gap-3">
              <li className="shrink-0">
                <Link
                  href="/app/armadio?aggiungi=1"
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
        )}
      </section>
    </div>
  );
}
