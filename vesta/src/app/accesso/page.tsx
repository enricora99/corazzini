import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AccessForm } from "@/components/access-form";
import { protezioneAttiva } from "@/lib/access";
import { conBase } from "@/lib/base-path";
import { PORTALE, portaleOspitato, titoloPortale } from "@/lib/portal";

/**
 * Il titolo è solo il marchio, senza «Accesso riservato ·» davanti e senza
 * il modello «%s · VESTA» del layout: quando il cancello porta il nome di
 * chi ospita l'app, la scheda del browser non deve annunciare altro.
 *
 * Lo stesso vale per tutto il resto dell'intestazione. Il layout descrive
 * l'applicazione che sta dietro, con tanto di immagine di anteprima: chi
 * incollava l'indirizzo del cancello in una chat si vedeva comparire nome,
 * slogan e copertina di ciò che il codice dovrebbe tenere coperto. Qui
 * sopra ci passa gente che il codice non ce l'ha.
 */
export function generateMetadata(): Metadata {
  const marchio = titoloPortale();

  return {
    title: { absolute: marchio },
    description: PORTALE.sottotitolo,
    robots: { index: false, follow: false },
    applicationName: marchio,
    // Il manifesto porta il nome e le icone dell'applicazione: sul cancello
    // farebbe proporre al telefono di installare una cosa che non si è
    // ancora vista. `null` toglie la riga che il layout aveva messo.
    manifest: null,
    appleWebApp: { capable: true, title: marchio, statusBarStyle: "default" },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: marchio,
      title: marchio,
      description: PORTALE.sottotitolo,
      // Lista vuota, non assente: serve a scavalcare la copertina che Next
      // ricava da src/app/opengraph-image.png per tutte le pagine.
      images: [],
    },
    ...(PORTALE.favicon
      ? { icons: { icon: PORTALE.favicon, shortcut: PORTALE.favicon } }
      : {}),
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

  // I colori di chi ospita entrano come variabili CSS sul contenitore, così
  // valgono solo per questa pagina: il resto dell'applicazione resta con i
  // propri. Se non sono impostati, tutto ricade sui colori di VESTA.
  const tema = PORTALE.accento
    ? ({
        "--portale-accento": PORTALE.accento,
        "--portale-accento-scuro": PORTALE.accentoScuro || PORTALE.accento,
        "--portale-accento-testo": PORTALE.accentoTesto,
      } as React.CSSProperties)
    : undefined;

  return (
    <main
      style={tema}
      data-portale={ospitato ? "ospitato" : undefined}
      className="flex flex-1 flex-col items-center justify-center bg-white px-5 py-12 sm:py-20"
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {PORTALE.logo ? (
            // Immagine semplice e non next/image: il segno di chi ospita
            // l'app sta sul suo dominio, non fra i file di questo progetto.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={PORTALE.logo}
              alt=""
              className="h-14 w-auto object-contain"
            />
          ) : (
            <Image
              src={conBase("/brand/vesta-logo-alpha.png")}
              alt=""
              width={56}
              height={56}
              priority
              className="h-14 w-14"
            />
          )}

          {/* Il marchio: la parola principale con le grazie, sotto la parola
              piccola spaziata — lo stesso blocco delle altre sezioni del
              sito che ospita. */}
          <h1 className="mt-4 flex flex-col items-center gap-0.5">
            <span className="font-[Georgia,'Times_New_Roman',serif] text-2xl font-semibold tracking-tight text-[#16313F]">
              {PORTALE.nome}
            </span>
            {PORTALE.sottomarchio ? (
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--portale-accento,theme(colors.foreground))]">
                {PORTALE.sottomarchio}
              </span>
            ) : null}
          </h1>

          <p className="mt-3 text-[0.95rem] leading-relaxed text-[#607180] text-pretty">
            {PORTALE.sottotitolo}
          </p>
        </div>

        <div className="mt-8">
          <AccessForm prossima={prossima} />
        </div>

        {ospitato ? (
          <p className="mt-6 text-center text-sm text-[#8B9CA8] text-pretty">
            Oltre il codice trovi i progetti in lavorazione, condivisi solo con
            chi è stato invitato a vederli.
          </p>
        ) : null}
      </div>
    </main>
  );
}
