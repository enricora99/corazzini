import { WaitlistForm } from "@/components/landing/waitlist-form";

export function WaitlistSection() {
  return (
    <section
      id="lista"
      aria-labelledby="lista-titolo"
      className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-xl">
        <h2
          id="lista-titolo"
          className="text-center font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl"
        >
          Entra in lista d&apos;attesa
        </h2>
        <p className="mt-4 text-center text-lg text-muted-foreground text-pretty">
          Ti avvisiamo appena VESTA è pronta. Niente altro.
        </p>

        <div className="mt-9">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
