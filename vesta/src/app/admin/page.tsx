import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { getMetriche } from "@/lib/admin-metrics";
import { richiediAmministratore } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Amministrazione",
  robots: { index: false, follow: false },
};

const dollari = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const mesi = new Intl.DateTimeFormat("it-IT", {
  month: "long",
  year: "numeric",
});

function nomeMese(chiave: string): string {
  const [anno, mese] = chiave.split("-").map(Number);
  return mesi.format(new Date(anno, mese - 1, 1));
}

export default async function AdminPage() {
  await richiediAmministratore();
  const m = await getMetriche();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Torna all&apos;app
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
        Amministrazione
      </h1>
      <p className="mt-1 text-muted-foreground">
        I numeri per il business plan.
      </p>

      {!m.disponibile ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-primary bg-accent p-4 font-semibold text-accent-foreground"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          Manca SUPABASE_SERVICE_ROLE_KEY: senza, questa pagina non può leggere
          i dati di tutti gli utenti.
        </p>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Dato etichetta="Lista d'attesa" valore={m.listaAttesa} />
        <Dato etichetta="Utenti registrati" valore={m.utenti} />
        <Dato etichetta="Capi caricati" valore={m.capi} />
        <Dato etichetta="Capi per utente" valore={m.capiPerUtente} />
        <Dato etichetta="Proposte generate" valore={m.proposte} />
        <Dato etichetta="Immagini generate" valore={m.immagini} />
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-extrabold">Costi per mese</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Sono <strong>stime</strong>, calcolate dal listino in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            src/lib/ai/pricing.ts
          </code>
          . Prima di metterle in un documento, confrontatele con la fattura
          vera del fornitore.
        </p>

        {m.mesi.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            Nessuna chiamata registrata, per ora.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <caption className="sr-only">
                Chiamate ai modelli e costi stimati, mese per mese
              </caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="py-2 pr-4 font-bold">Mese</th>
                  <th scope="col" className="py-2 pr-4 text-right font-bold">Proposte</th>
                  <th scope="col" className="py-2 pr-4 text-right font-bold">Immagini</th>
                  <th scope="col" className="py-2 pr-4 text-right font-bold">Attivi</th>
                  <th scope="col" className="py-2 pr-4 text-right font-bold">Costo</th>
                  <th scope="col" className="py-2 text-right font-bold">Per utente</th>
                </tr>
              </thead>
              <tbody>
                {m.mesi.map((riga) => (
                  <tr key={riga.mese} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-semibold capitalize">
                      {nomeMese(riga.mese)}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{riga.proposte}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{riga.immagini}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">{riga.utentiAttivi}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums">
                      {dollari.format(riga.costoTotale)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {dollari.format(riga.costoMedioPerUtente)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-3 pr-4 font-extrabold">Totale</td>
                  <td className="py-3 pr-4 text-right font-bold tabular-nums">{m.proposte}</td>
                  <td className="py-3 pr-4 text-right font-bold tabular-nums">{m.immagini}</td>
                  <td className="py-3 pr-4" />
                  <td className="py-3 pr-4 text-right font-extrabold tabular-nums">
                    {dollari.format(m.costoTotale)}
                  </td>
                  <td className="py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-muted-foreground text-pretty">
          <strong className="text-foreground">Utente attivo</strong> vuol dire
          che quel mese ha fatto almeno una richiesta a un modello. Chi si
          iscrive e non carica niente non entra nella media, altrimenti il
          costo per utente sembrerebbe più basso di quello che è.
        </p>
      </section>
    </main>
  );
}

function Dato({ etichetta, valore }: { etichetta: string; valore: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-heading text-2xl font-extrabold tabular-nums">
        {valore.toLocaleString("it-IT")}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{etichetta}</p>
    </div>
  );
}
