import Link from "next/link";
import { Camera, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CAPI_DEMO } from "@/lib/demo/data";

export default function DemoHome() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Ciao Demo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Hai {CAPI_DEMO.length} capi nell&apos;armadio.
        </p>
      </header>

      <div className="grid gap-4">
        <Button
          asChild
          size="lg"
          className="h-auto justify-start gap-4 px-6 py-5 text-left"
        >
          <Link href="/demo/outfit">
            <Sparkles className="size-6 shrink-0" aria-hidden strokeWidth={2} />
            <span>
              <span className="block text-base font-extrabold">
                Crea un outfit
              </span>
              <span className="block text-sm font-medium opacity-80">
                È qui che si capisce l&apos;idea
              </span>
            </span>
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-auto justify-start gap-4 border-2 bg-card px-6 py-5 text-left"
        >
          <Link href="/demo/armadio">
            <Camera className="size-6 shrink-0" aria-hidden strokeWidth={2} />
            <span>
              <span className="block text-base font-extrabold">
                Guarda l&apos;armadio
              </span>
              <span className="block text-sm font-medium text-muted-foreground">
                I capi già catalogati
              </span>
            </span>
          </Link>
        </Button>
      </div>

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        Nell&apos;app vera fotografi un capo e un modello lo riconosce da solo:
        categoria, colori, stagione, quanto copre. Tu correggi se sbaglia, e
        finisce nell&apos;armadio. Qui i capi sono già lì, così puoi andare
        dritto alla parte interessante.
      </p>
    </div>
  );
}
