"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Bookmark, CloudSun, Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  METEO_DEMO,
  PROPOSTE_DEMO,
  type PropostaDemo,
} from "@/lib/demo/data";
import { OCCASIONS, OCCASION_LABELS, type Occasion } from "@/lib/schemas";

/**
 * La versione demo dello studio outfit.
 *
 * Stessa interfaccia di quella vera, ma le proposte sono già scritte: qui non
 * si chiama nessun modello. Costa zero e, soprattutto, davanti a una giuria
 * non può fallire per una chiave scaduta o una rete lenta.
 *
 * L'attesa finta di un secondo non è vezzo: senza, le proposte comparirebbero
 * prima ancora che il dito lasci il pulsante, e non si capirebbe che
 * nell'app vera lì dietro sta lavorando qualcosa.
 */
export function DemoOutfitStudio() {
  const [occasione, setOccasione] = useState<Occasion>("universita");
  const [caricamento, setCaricamento] = useState(false);
  const [proposte, setProposte] = useState<PropostaDemo[] | null>(null);

  function proponi() {
    setCaricamento(true);
    setProposte(null);
    setTimeout(() => {
      setProposte(PROPOSTE_DEMO[occasione]);
      setCaricamento(false);
    }, 900);
  }

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
                  setProposte(null);
                }}
                className={`rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
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
        <p className="flex items-center gap-2 text-sm font-medium">
          <CloudSun className="size-4 shrink-0" aria-hidden />
          {METEO_DEMO.description}, {METEO_DEMO.temperature}°
          <span className="text-muted-foreground">
            (percepiti {METEO_DEMO.apparent}°)
          </span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Nell&apos;app vera arriva dalla tua posizione, se gliela concedi.
        </p>
      </div>

      <Button
        onClick={proponi}
        disabled={caricamento}
        size="lg"
        className="h-13 w-full gap-2 text-base font-bold"
      >
        {caricamento ? (
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

      {proposte ? (
        <section aria-label="Proposte" className="space-y-5">
          <h2 className="font-heading text-lg font-extrabold">
            Tre idee per {OCCASION_LABELS[occasione].toLowerCase()}
          </h2>
          {proposte.map((proposta, indice) => (
            <SchedaDemo key={`${occasione}-${indice}`} proposta={proposta} />
          ))}

          <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
            Nell&apos;app vera queste tre proposte le scrive un modello
            guardando i tuoi capi e il meteo, e cambiano ogni volta. Al modello
            arrivano solo le caratteristiche dei capi — categoria, colore,
            stagione — mai le tue fotografie.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function SchedaDemo({ proposta }: { proposta: PropostaDemo }) {
  const [salvato, setSalvato] = useState(false);
  const inPrestito = proposta.items.filter((c) => c.ownerName);

  return (
    <article className="space-y-4 rounded-3xl border border-border bg-card p-4">
      <ul className="grid grid-cols-4 gap-2">
        {proposta.items.map((capo) => (
          <li key={capo.id} className="space-y-1">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <Image
                src={capo.photoUrl}
                alt={capo.label}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
            <p className="truncate text-center text-[10px] leading-tight text-muted-foreground">
              {capo.label}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed">{proposta.rationale}</p>

      {inPrestito.length > 0 ? (
        <p className="rounded-xl bg-accent p-3 text-sm font-medium text-accent-foreground">
          {inPrestito
            .map((c) => `${c.label} in prestito da ${c.ownerName}`)
            .join(" · ")}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          className="h-11 flex-1 gap-2 border-2 bg-background font-bold"
        >
          <Link href="/#lista">
            <Wand2 className="size-4" aria-hidden />
            Vedi l&apos;outfit
          </Link>
        </Button>
        <Button
          onClick={() => setSalvato(true)}
          disabled={salvato}
          className="h-11 flex-1 gap-2 font-bold"
        >
          <Bookmark
            className="size-4"
            aria-hidden
            fill={salvato ? "currentColor" : "none"}
          />
          {salvato ? "Salvato" : "Salva"}
        </Button>
      </div>

      {salvato ? (
        <p className="text-center text-xs text-muted-foreground">
          Per finta: nella demo non si salva niente.
        </p>
      ) : null}
    </article>
  );
}
