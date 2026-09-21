import { Camera, CloudSun, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Camera,
    title: "Fotografa i tuoi vestiti",
  },
  {
    icon: CloudSun,
    title: "Dicci dove vai e che tempo fa",
  },
  {
    icon: Sparkles,
    title: "Ricevi l'outfit in pochi secondi",
  },
];

export function HowItWorks() {
  return (
    <section
      id="come-funziona"
      aria-labelledby="come-funziona-titolo"
      className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24"
    >
      <h2
        id="come-funziona-titolo"
        className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
      >
        Come funziona
      </h2>

      <ol className="mt-12 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-10 text-center"
          >
            {/* Il giallo come fondo, il numero in scuro sopra: 10,9:1. */}
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary">
              <step.icon
                className="size-7 text-primary-foreground"
                aria-hidden
                strokeWidth={2}
              />
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Passo {index + 1}
            </span>
            <h3 className="font-heading text-lg font-extrabold leading-snug text-balance">
              {step.title}
            </h3>
          </li>
        ))}
      </ol>
    </section>
  );
}
