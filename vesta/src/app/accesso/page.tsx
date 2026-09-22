import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AccessForm } from "@/components/access-form";
import { protezioneAttiva } from "@/lib/access";
import { conBase } from "@/lib/base-path";
import { PORTALE, portaleOspitato } from "@/lib/portal";

/**
 * Il titolo usa `absolute` per scavalcare il modello «%s · VESTA» del layout:
 * quando il portale porta il nome di chi ospita l'app, la scheda del browser
 * non deve annunciare un marchio diverso da quello sulla pagina.
 */
export function generateMetadata(): Metadata {
  return {
    title: { absolute: `Accesso riservato · ${PORTALE.nome}` },
    robots: { index: false, follow: false },
  };
}

/**
 * Valutata a ogni richiesta, non una volta sola al build.
 *
 * Altrimenti: se durante il build i codici non fossero leggibili, questa
 * pagina verrebbe generata nella sua forma «protezione spenta», cioè un
 * reindirizzamento alla home. Il cancello rimanderebbe indietro chiunque,
 * compreso chi il codice ce l'ha.
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
  // Senza codici configurati questa pagina non ha ragione di esistere:
  // meglio rimandare alla home che mostrare un cancello finto.
  if (!protezioneAttiva()) redirect("/");

  const params = await searchParams;
  const prossima = destinazioneSicura(params.prossima);
  const ospitato = portaleOspitato();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {PORTALE.logo ? (
            // Immagine semplice e non next/image: il segno di chi ospita
            // l'app sta sul suo dominio, non fra i file di questo progetto.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={PORTALE.logo}
              alt={PORTALE.nome}
              className="h-16 w-auto object-contain"
            />
          ) : (
            <Image
              src={conBase("/brand/vesta-logo-alpha.png")}
              alt={PORTALE.nome}
              width={64}
              height={64}
              priority
              className="h-16 w-16"
            />
          )}

          <h1 className="mt-5 font-heading text-2xl font-extrabold tracking-tight text-balance">
            {PORTALE.nome}
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            {PORTALE.sottotitolo}
          </p>
        </div>

        <div className="mt-8">
          <AccessForm prossima={prossima} />
        </div>

        {ospitato ? (
          <p className="mt-6 text-center text-sm text-muted-foreground text-pretty">
            Oltre il codice trovi i progetti in lavorazione, condivisi solo
            con chi è stato invitato a vederli.
          </p>
        ) : null}
      </div>
    </main>
  );
}
