import Link from "next/link";
import { Share2 } from "lucide-react";

import { ItemGrid } from "@/components/app/item-grid";
import { Button } from "@/components/ui/button";
import { AMICI_DEMO, CAPI_AMICI_DEMO } from "@/lib/demo/data";

export default function DemoAmici() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Amici
        </h1>
        <p className="mt-1 text-muted-foreground text-pretty">
          Vedi cosa puoi prendere in prestito prima di comprare qualcosa di
          nuovo.
        </p>
      </header>

      <Button
        asChild
        variant="outline"
        size="lg"
        className="h-13 w-full gap-2 border-2 border-dashed bg-card text-base font-bold"
      >
        <Link href="/#lista">
          <Share2 className="size-5" aria-hidden strokeWidth={2} />
          Nella demo non si invita nessuno
        </Link>
      </Button>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-extrabold">I tuoi amici</h2>
        <ul className="space-y-2">
          {AMICI_DEMO.map((amico) => (
            <li
              key={amico.nome}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-extrabold text-primary-foreground"
              >
                {amico.nome.charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">
                {amico.nome}
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {amico.capi} {amico.capi === 1 ? "capo" : "capi"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-extrabold">
          Il loro guardaroba
        </h2>
        <ItemGrid capi={CAPI_AMICI_DEMO} eliminabili={false} />
      </section>

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        In sola lettura, sempre: puoi guardare e chiedere in prestito, non
        modificare. Nell&apos;app vera è il database stesso a impedirlo, non
        solo l&apos;interfaccia.
      </p>
    </div>
  );
}
