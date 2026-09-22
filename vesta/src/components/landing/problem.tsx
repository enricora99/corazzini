export function Problem() {
  return (
    <section
      id="problema"
      aria-labelledby="problema-titolo"
      className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 sm:p-12">
        <h2
          id="problema-titolo"
          className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl"
        >
          Il problema
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
          Ogni mattina perdiamo tempo davanti all&apos;armadio. Troppe opzioni,
          dubbi, cambi all&apos;ultimo minuto. E alla fine la solita sensazione:{" "}
          <em className="font-semibold not-italic text-foreground">
            non ho niente da mettermi.
          </em>
        </p>
      </div>
    </section>
  );
}
