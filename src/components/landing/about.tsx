export function About() {
  return (
    <section
      id="chi-siamo"
      aria-labelledby="chi-siamo-titolo"
      className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="chi-siamo-titolo"
          className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          Chi siamo
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground text-pretty">
          VESTA è una startup fashion-tech nata all&apos;Università
          dell&apos;Aquila. Vogliamo farti usare di più i vestiti che hai già.
        </p>
      </div>
    </section>
  );
}
