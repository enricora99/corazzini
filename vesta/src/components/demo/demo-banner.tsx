import Link from "next/link";
import { FlaskConical } from "lucide-react";

/**
 * Deve restare visibile su ogni schermata del demo.
 *
 * Chi arriva qui da un link non ha il contesto: senza questa riga potrebbe
 * credere di guardare un armadio vero, o di aver caricato qualcosa. Meglio
 * dirlo una volta di troppo che lasciare l'equivoco.
 */
export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 border-b border-primary/40 bg-accent">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-5 py-2.5">
        <FlaskConical
          className="size-4 shrink-0 text-accent-foreground"
          aria-hidden
          strokeWidth={2.5}
        />
        <p className="flex-1 text-xs font-semibold leading-snug text-accent-foreground">
          Stai sfogliando una <strong>demo</strong>: capi e proposte sono
          inventati e niente viene salvato.
        </p>
        <Link
          href="/#lista"
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          Lista d&apos;attesa
        </Link>
      </div>
    </div>
  );
}
