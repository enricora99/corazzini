import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entra",
  robots: { index: false, follow: false },
};

/** Solo percorsi interni, per non trasformare l'accesso in un
 *  reindirizzamento aperto verso un altro sito. */
function destinazioneSicura(prossima: string | string[] | undefined): string {
  if (typeof prossima !== "string") return "/app";
  if (!prossima.startsWith("/") || prossima.startsWith("//")) return "/app";
  return prossima;
}

const ERRORI: Record<string, string> = {
  link: "Quel link non è più valido. Chiedine uno nuovo: durano poco di proposito.",
  profilo:
    "Non siamo riusciti a leggere il tuo profilo. Prova a entrare di nuovo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const params = await searchParams;
  const prossima = destinazioneSicura(params.prossima);
  const errore = typeof params.errore === "string" ? ERRORI[params.errore] : undefined;

  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          Entra in VESTA
        </h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Il tuo armadio ti aspetta.
        </p>
      </div>

      {errore ? (
        <p
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errore}
        </p>
      ) : null}

      <LoginForm prossima={prossima} />
    </>
  );
}
