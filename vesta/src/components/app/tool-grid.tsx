import Link from "next/link";
import {
  CalendarDays,
  ChartNoAxesColumn,
  MessagesSquare,
  Shirt,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * La griglia degli strumenti, in cima alla home.
 *
 * Due riquadri larghi per le due cose che si fanno davvero ogni giorno, e
 * sotto quattro più piccoli per il resto. La gerarchia è il punto: se fossero
 * tutti uguali, chi apre l'app per la prima volta non saprebbe da dove
 * cominciare.
 */

type Strumento = {
  segmento: string;
  label: string;
  icona: LucideIcon;
  /** Solo per i due riquadri larghi. */
  descrizione?: string;
};

const PRINCIPALI: Strumento[] = [
  {
    segmento: "/outfit",
    label: "Proponi un outfit",
    icona: Sparkles,
    descrizione: "Dimmi dove vai",
  },
  {
    segmento: "/outfit?chat=1",
    label: "Chiedi allo stilista",
    icona: MessagesSquare,
    descrizione: "Più formale? Più caldo?",
  },
];

const SECONDARI: Strumento[] = [
  { segmento: "/armadio", label: "Armadio", icona: Shirt },
  { segmento: "/amici", label: "Amici", icona: Users },
  { segmento: "/calendario", label: "Calendario", icona: CalendarDays },
  { segmento: "/statistiche", label: "Statistiche", icona: ChartNoAxesColumn },
];

export function ToolGrid({ base = "/app" }: { base?: string }) {
  return (
    <section aria-labelledby="strumenti-titolo" className="space-y-3">
      <h2
        id="strumenti-titolo"
        className="font-heading text-lg font-extrabold tracking-tight"
      >
        Stilista VESTA
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {PRINCIPALI.map((s) => (
          <Link
            key={s.label}
            href={`${base}${s.segmento}`}
            className="group flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent">
              <s.icona
                className="size-6 text-accent-foreground"
                aria-hidden
                strokeWidth={2}
              />
            </span>
            <span>
              <span className="block text-sm font-extrabold leading-tight text-balance">
                {s.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {s.descrizione}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {SECONDARI.map((s) => (
          <Link
            key={s.label}
            href={`${base}${s.segmento}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-1 py-3 text-center transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <s.icona
                className="size-5 text-foreground"
                aria-hidden
                strokeWidth={2}
              />
            </span>
            <span className="text-[11px] font-semibold leading-tight">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
