import { Users } from "lucide-react";

export function Friends() {
  return (
    <section
      id="amici"
      aria-labelledby="amici-titolo"
      className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24"
    >
      {/* Blocco pieno di giallo con testo scuro sopra: è l'uso previsto dal
          brand per il colore primario. */}
      <div className="rounded-3xl bg-primary px-7 py-12 text-primary-foreground sm:px-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Users className="mx-auto size-10" aria-hidden strokeWidth={2} />
          <h2
            id="amici-titolo"
            className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl"
          >
            Il guardaroba degli amici
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-pretty sm:text-xl">
            Aggiungi gli amici e vedi cosa puoi prendere in prestito prima di
            comprare qualcosa di nuovo.
          </p>
        </div>
      </div>
    </section>
  );
}
