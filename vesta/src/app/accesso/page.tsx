import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AccessForm } from "@/components/access-form";
import { conBase } from "@/lib/base-path";
import { codiceRichiesto } from "@/lib/access";

export const metadata: Metadata = {
  title: "Accesso riservato",
  robots: { index: false, follow: false },
};

/**
 * Deve essere valutata a ogni richiesta, non una volta sola al build.
 *
 * Altrimenti: se durante il build `ACCESS_CODE` non è leggibile — su Vercel
 * capita con le variabili marcate come sensibili — questa pagina viene
 * generata nella sua forma «protezione spenta», cioè un reindirizzamento
 * verso la home. Risultato: il cancello rimanda sempre indietro e nessuno
 * può più inserire il codice, nemmeno chi ce l'ha.
 */
export const dynamic = "force-dynamic";

function destinazioneSicura(prossima: string | string[] | undefined): string {
  if (typeof prossima !== "string") return "/";
  if (!prossima.startsWith("/") || prossima.startsWith("//")) return "/";
  if (prossima.startsWith("/accesso")) return "/";
  return prossima;
}

export default async function AccessoPage({
  searchParams,
}: PageProps<"/accesso">) {
  // Se la protezione è spenta questa pagina non ha ragione di esistere:
  // meglio rimandare alla home che mostrare un cancello finto.
  if (!codiceRichiesto()) redirect("/");

  const params = await searchParams;
  const prossima = destinazioneSicura(params.prossima);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Image
            src={conBase("/brand/vesta-logo-alpha.png")}
            alt="VESTA"
            width={64}
            height={64}
            priority
            className="h-16 w-16"
          />
          <h1 className="mt-5 font-heading text-2xl font-extrabold tracking-tight">
            VESTA non è ancora pubblica
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Se hai un codice d&apos;invito, mettilo qui sotto.
          </p>
        </div>

        <div className="mt-8">
          <AccessForm prossima={prossima} />
        </div>
      </div>
    </main>
  );
}
