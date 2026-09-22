import { TriangleAlert } from "lucide-react";

/** Segnaposto da completare prima del lancio. Si vede, ed è voluto. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-accent px-1.5 py-0.5 font-semibold text-accent-foreground">
      {children}
    </mark>
  );
}

export function LegalPage({
  title,
  updatedAt,
  draft = true,
  children,
}: {
  title: string;
  updatedAt: string;
  draft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Ultimo aggiornamento: {updatedAt}
      </p>

      {draft ? (
        <p
          role="note"
          className="mt-7 flex items-start gap-3 rounded-2xl border-2 border-primary bg-accent p-4 font-bold text-accent-foreground"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          Bozza da far verificare prima del lancio pubblico.
        </p>
      ) : null}

      <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}
