"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bookmark,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { ContextLine } from "@/components/app/context-line";
import { OutfitCarousel } from "@/components/app/outfit-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  METEO_DEMO,
  PROPOSTE_DEMO,
  RIFINITURE_DEMO,
  riconosciRifinitura,
  type PropostaDemo,
} from "@/lib/demo/data";
import { OCCASIONS, OCCASION_LABELS, type Occasion } from "@/lib/schemas";

/** Un giro di conversazione: cosa hai chiesto, cosa ha risposto, cosa propone. */
type Turno = {
  richiesta?: string;
  risposta?: string;
  titolo: string;
  proposte: PropostaDemo[];
};

const ATTESA_MS = 900;

/**
 * Lo studio outfit della demo, in forma di conversazione.
 *
 * La differenza con un pulsante che restituisce tre risultati è tutta qui:
 * puoi rispondere. «Rendilo più formale», «fa freddo» — e le proposte
 * cambiano tenendo conto di quello che hai detto.
 *
 * Nell'app vera ogni giro è una chiamata al modello con l'outfit precedente
 * più la tua richiesta. Qui le risposte sono scritte: costa zero e davanti
 * a una giuria non può fallire per una chiave scaduta o una rete lenta.
 */
export function DemoOutfitStudio({ chatSubito = false }: { chatSubito?: boolean }) {
  const [occasione, setOccasione] = useState<Occasion>("universita");
  const [turni, setTurni] = useState<Turno[]>([]);
  const [inCorso, setInCorso] = useState(false);
  const [testo, setTesto] = useState("");
  const fondo = useRef<HTMLDivElement>(null);

  // Se si arriva dalla scheda «Chiedi allo stilista», si parte già con una
  // proposta in pagina: aprire su una schermata vuota con un campo di testo
  // non spiega cosa si possa chiedere.
  useEffect(() => {
    if (chatSubito && turni.length === 0) proponi("universita");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSubito]);

  function proponi(perOccasione: Occasion = occasione) {
    setInCorso(true);
    setTurni([]);
    setTimeout(() => {
      setTurni([
        {
          titolo: `Tre idee per ${OCCASION_LABELS[perOccasione].toLowerCase()}`,
          proposte: PROPOSTE_DEMO[perOccasione],
        },
      ]);
      setInCorso(false);
    }, ATTESA_MS);
  }

  function rifinisci(richiesta: string) {
    const trovata = riconosciRifinitura(richiesta);
    setTesto("");
    setInCorso(true);

    setTimeout(() => {
      setTurni((precedenti) => [
        ...precedenti,
        trovata
          ? {
              richiesta,
              risposta: trovata.risposta,
              titolo: trovata.etichetta,
              proposte: trovata.proposte,
            }
          : {
              richiesta,
              // Non fingiamo di aver capito: nella demo le risposte sono
              // scritte, e dirlo è meglio che restituire qualcosa a caso.
              risposta:
                "In questa demo so rispondere a poche richieste: prova «più formale», «più caldo», «meno pezzi» o «cambia scarpe». Nell'app vera capisce qualsiasi cosa tu scriva.",
              titolo: "Non ho capito",
              proposte: [],
            },
      ]);
      setInCorso(false);
      requestAnimationFrame(() =>
        fondo.current?.scrollIntoView({ behavior: "smooth", block: "end" })
      );
    }, ATTESA_MS);
  }

  const iniziato = turni.length > 0;

  return (
    <div className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="font-heading text-base font-extrabold">
          Dove vai?
        </legend>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const attiva = occasione === o;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={attiva}
                onClick={() => {
                  setOccasione(o);
                  setTurni([]);
                }}
                className={`min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition-colors ${
                  attiva
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {OCCASION_LABELS[o]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-border bg-card p-4">
        <ContextLine meteo={METEO_DEMO} citta="Pescara" />
        <p className="mt-2 text-xs text-muted-foreground">
          Nell&apos;app il meteo arriva dalla tua posizione, se gliela concedi.
        </p>
      </div>

      {!iniziato ? (
        <Button
          onClick={() => proponi()}
          disabled={inCorso}
          size="lg"
          className="h-13 w-full gap-2 text-base font-bold"
        >
          {inCorso ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Sto pensando…
            </>
          ) : (
            <>
              <Sparkles className="size-5" aria-hidden strokeWidth={2} />
              Proponimi un outfit
            </>
          )}
        </Button>
      ) : null}

      {turni.map((turno, i) => (
        <section key={i} className="space-y-3">
          {turno.richiesta ? (
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              {turno.richiesta}
            </p>
          ) : null}

          {turno.risposta ? (
            <p className="max-w-[92%] text-sm leading-relaxed text-muted-foreground text-pretty">
              {turno.risposta}
            </p>
          ) : null}

          {turno.proposte.length > 0 ? (
            <>
              <h2 className="font-heading text-lg font-extrabold tracking-tight">
                {turno.titolo}
              </h2>
              <OutfitCarousel
                proposte={turno.proposte}
                azioni={(_, indice) => (
                  <AzioniProposta chiave={`${i}-${indice}`} />
                )}
              />
            </>
          ) : null}
        </section>
      ))}

      {inCorso && iniziato ? (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Sto ripensando…
        </p>
      ) : null}

      {iniziato ? (
        <div className="space-y-3">
          <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2">
              {RIFINITURE_DEMO.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={inCorso}
                  onClick={() => rifinisci(r.etichetta)}
                  className="min-h-11 shrink-0 rounded-full border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-primary disabled:opacity-50"
                >
                  {r.etichetta}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (testo.trim() && !inCorso) rifinisci(testo.trim());
            }}
            className="flex items-center gap-2 rounded-full border-2 border-border bg-card p-1.5 pl-4 focus-within:border-primary"
          >
            <Input
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Rendilo più formale?"
              aria-label="Chiedi una modifica all'outfit"
              className="h-11 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={inCorso || !testo.trim()}
              aria-label="Invia la richiesta"
              className="size-11 shrink-0 rounded-full"
            >
              <ArrowUp className="size-4" aria-hidden strokeWidth={2.5} />
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground text-pretty">
            Nell&apos;app vera questa richiesta torna al modello insieme
            all&apos;outfit di prima. Qui le risposte sono scritte.
          </p>
        </div>
      ) : null}

      <div ref={fondo} />
    </div>
  );
}

function AzioniProposta({ chiave }: { chiave: string }) {
  const [salvato, setSalvato] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        asChild
        variant="outline"
        className="h-10 flex-1 gap-1.5 border-2 bg-background text-xs font-bold"
      >
        <Link href="/#lista" aria-label={`Vedi l'outfit ${chiave}`}>
          <Wand2 className="size-3.5" aria-hidden />
          Vedi l&apos;outfit
        </Link>
      </Button>
      <Button
        onClick={() => setSalvato(true)}
        disabled={salvato}
        className="h-10 flex-1 gap-1.5 text-xs font-bold"
      >
        <Bookmark
          className="size-3.5"
          aria-hidden
          fill={salvato ? "currentColor" : "none"}
        />
        {salvato ? "Salvato" : "Salva"}
      </Button>
    </div>
  );
}
