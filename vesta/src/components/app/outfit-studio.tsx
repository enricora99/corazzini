"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Bookmark,
  CircleAlert,
  CloudSun,
  Loader2,
  MapPin,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { salvaOutfit } from "@/app/actions/outfits";
import { Button } from "@/components/ui/button";
import { conBase } from "@/lib/base-path";
import { OCCASIONS, OCCASION_LABELS, type Occasion } from "@/lib/schemas";
import type { WeatherSnapshot } from "@/lib/ai/types";

type CapoProposto = {
  id: string;
  label: string;
  photoUrl: string | null;
  ownerName: string | null;
};

type Proposta = {
  rationale: string;
  items: CapoProposto[];
};

export function OutfitStudio({ haAmici }: { haAmici: boolean }) {
  const [occasione, setOccasione] = useState<Occasion>("universita");
  const [conAmici, setConAmici] = useState(false);
  const [posizione, setPosizione] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [statoPosizione, setStatoPosizione] = useState<
    "idle" | "richiesta" | "ok" | "negata"
  >("idle");

  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [meteo, setMeteo] = useState<WeatherSnapshot | null>(null);
  const [proposte, setProposte] = useState<Proposta[] | null>(null);

  async function chiediPosizione() {
    if (!("geolocation" in navigator)) {
      setStatoPosizione("negata");
      return;
    }
    setStatoPosizione("richiesta");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosizione({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setStatoPosizione("ok");
      },
      () => {
        // Anche negata va bene: si compone l'outfit senza meteo.
        setStatoPosizione("negata");
      },
      { timeout: 8000, maximumAge: 600_000, enableHighAccuracy: false }
    );
  }

  async function proponi() {
    setCaricamento(true);
    setErrore(null);
    setProposte(null);

    try {
      const risposta = await fetch(conBase("/api/outfits/suggest"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occasione,
          includeFriends: conAmici,
          ...(posizione ?? {}),
        }),
      });

      const json = await risposta.json().catch(() => ({}));

      if (!risposta.ok) {
        setErrore(json.error ?? "Non siamo riusciti a comporre gli outfit.");
        return;
      }

      setMeteo(json.weather ?? null);
      setProposte(json.suggestions as Proposta[]);
    } catch {
      setErrore("Controlla la connessione e riprova.");
    } finally {
      setCaricamento(false);
    }
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
                onClick={() => setOccasione(o)}
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

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {statoPosizione === "ok" && meteo ? (
          <p className="flex items-center gap-2 text-sm font-medium">
            <CloudSun className="size-4 shrink-0" aria-hidden />
            {meteo.description}, {Math.round(meteo.temperature)}°
            <span className="text-muted-foreground">
              (percepiti {Math.round(meteo.apparent)}°)
            </span>
          </p>
        ) : statoPosizione === "ok" ? (
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 shrink-0" aria-hidden />
            Posizione presa. Il meteo arriva con le proposte.
          </p>
        ) : statoPosizione === "negata" ? (
          <p className="text-sm text-muted-foreground">
            Senza posizione compongo lo stesso, ma senza tenere conto del meteo.
          </p>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={chiediPosizione}
            disabled={statoPosizione === "richiesta"}
            className="h-11 w-full gap-2 border-2 bg-background font-semibold"
          >
            <MapPin className="size-4" aria-hidden />
            {statoPosizione === "richiesta"
              ? "Ti sto localizzando…"
              : "Usa il meteo di dove sei"}
          </Button>
        )}

        {haAmici ? (
          <label className="flex cursor-pointer items-start gap-3 pt-1">
            <input
              type="checkbox"
              checked={conAmici}
              onChange={(e) => setConAmici(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--vesta-yellow-hover)]"
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              Includi anche i capi dei miei amici
            </span>
          </label>
        ) : null}
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

      {errore ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errore}
        </p>
      ) : null}

      {proposte ? (
        <section aria-label="Proposte" className="space-y-5">
          <h2 className="font-heading text-lg font-extrabold">
            Tre idee per {OCCASION_LABELS[occasione].toLowerCase()}
          </h2>
          {proposte.map((proposta, indice) => (
            <SchedaProposta
              key={indice}
              proposta={proposta}
              occasione={occasione}
              meteo={meteo}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function SchedaProposta({
  proposta,
  occasione,
  meteo,
}: {
  proposta: Proposta;
  occasione: Occasion;
  meteo: WeatherSnapshot | null;
}) {
  const [immagine, setImmagine] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvato, setSalvato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const inPrestito = proposta.items.filter((c) => c.ownerName);

  async function generaImmagine() {
    setGenerando(true);
    setErrore(null);
    try {
      const risposta = await fetch(conBase("/api/outfits/image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: proposta.items.map((c) => c.id),
          occasion: occasione,
        }),
      });
      const json = await risposta.json().catch(() => ({}));

      if (!risposta.ok) {
        setErrore(json.error ?? "Non siamo riusciti a generare l'immagine.");
        return;
      }
      setImmagine(json.imageUrl);
    } catch {
      setErrore("Controlla la connessione e riprova.");
    } finally {
      setGenerando(false);
    }
  }

  async function salva() {
    setSalvando(true);
    const esito = await salvaOutfit({
      occasion: occasione,
      itemIds: proposta.items.map((c) => c.id),
      rationale: proposta.rationale,
      weather: meteo,
    });
    setSalvando(false);

    if (esito.ok) {
      setSalvato(true);
      toast.success("Outfit salvato.");
    } else {
      toast.error(esito.error);
    }
  }

  return (
    <article className="space-y-4 rounded-3xl border border-border bg-card p-4">
      {immagine ? (
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          <Image
            src={immagine}
            alt={`Outfit disposto in piano: ${proposta.items.map((c) => c.label).join(", ")}`}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        /* Modalità base: le foto dei capi accostate. Non costa niente in
           immagini generate, ed è quella che si vede per prima. */
        <ul className="grid grid-cols-3 gap-2">
          {proposta.items.map((capo) => (
            <li key={capo.id} className="space-y-1">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {capo.photoUrl ? (
                  <Image
                    src={capo.photoUrl}
                    alt={capo.label}
                    fill
                    sizes="33vw"
                    unoptimized
                    className="object-cover"
                  />
                ) : null}
              </div>
              <p className="truncate text-center text-[11px] text-muted-foreground">
                {capo.label}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm leading-relaxed">{proposta.rationale}</p>

      {inPrestito.length > 0 ? (
        <p className="rounded-xl bg-accent p-3 text-sm font-medium text-accent-foreground">
          {inPrestito
            .map((c) => `${c.label} in prestito da ${c.ownerName}`)
            .join(" · ")}
        </p>
      ) : null}

      {errore ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errore}
        </p>
      ) : null}

      <div className="flex gap-2">
        {!immagine ? (
          <Button
            variant="outline"
            onClick={generaImmagine}
            disabled={generando}
            className="h-11 flex-1 gap-2 border-2 bg-background font-bold"
          >
            {generando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Disegno…
              </>
            ) : (
              <>
                <Wand2 className="size-4" aria-hidden />
                Vedi l&apos;outfit
              </>
            )}
          </Button>
        ) : null}

        <Button
          onClick={salva}
          disabled={salvando || salvato}
          className="h-11 flex-1 gap-2 font-bold"
        >
          <Bookmark
            className="size-4"
            aria-hidden
            fill={salvato ? "currentColor" : "none"}
          />
          {salvato ? "Salvato" : salvando ? "Salvo…" : "Salva"}
        </Button>
      </div>
    </article>
  );
}
