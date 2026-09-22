import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * I numeri che il team porta nel business plan.
 *
 * Passa dal client di amministrazione: deve vedere tutti gli utenti, non solo
 * chi sta guardando la pagina. Chi può aprirla lo decide `richiediAmministratore`
 * in base a ADMIN_EMAILS.
 *
 * L'aggregazione per mese la facciamo in JavaScript invece che in SQL. Con i
 * numeri di una startup che parte è più che sufficiente, e ci risparmia una
 * vista nel database. Leggiamo però solo gli ultimi dodici mesi e solo le
 * colonne che servono: se un giorno le chiamate diventassero centinaia di
 * migliaia, questo è il punto da spostare in una funzione SQL.
 */

const MESI_INDIETRO = 12;

export type MeseCosti = {
  /** "2026-09" */
  mese: string;
  chiamate: number;
  proposte: number;
  immagini: number;
  costoTotale: number;
  utentiAttivi: number;
  costoMedioPerUtente: number;
};

export type Metriche = {
  disponibile: boolean;
  listaAttesa: number;
  utenti: number;
  capi: number;
  capiPerUtente: number;
  proposte: number;
  immagini: number;
  costoTotale: number;
  mesi: MeseCosti[];
};

const VUOTE: Metriche = {
  disponibile: false,
  listaAttesa: 0,
  utenti: 0,
  capi: 0,
  capiPerUtente: 0,
  proposte: 0,
  immagini: 0,
  costoTotale: 0,
  mesi: [],
};

export async function getMetriche(): Promise<Metriche> {
  const supabase = createAdminClient();
  if (!supabase) return VUOTE;

  const da = new Date();
  da.setMonth(da.getMonth() - MESI_INDIETRO);
  da.setDate(1);
  da.setHours(0, 0, 0, 0);

  const [listaAttesa, utenti, capi, chiamate] = await Promise.all([
    supabase.from("waitlist").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_calls")
      .select("user_id, kind, cost_usd, created_at, success")
      .gte("created_at", da.toISOString()),
  ]);

  const righe = (chiamate.data ?? []) as Array<{
    user_id: string | null;
    kind: string;
    cost_usd: number | string;
    created_at: string;
    success: boolean;
  }>;

  const perMese = new Map<
    string,
    { chiamate: number; proposte: number; immagini: number; costo: number; utenti: Set<string> }
  >();

  let proposte = 0;
  let immagini = 0;
  let costoTotale = 0;

  for (const riga of righe) {
    // numeric arriva come stringa dal driver: senza Number() la somma
    // concatenerebbe testo invece di sommare.
    const costo = Number(riga.cost_usd) || 0;
    costoTotale += costo;

    if (riga.kind === "suggestion") proposte++;
    if (riga.kind === "image" && riga.success) immagini++;

    const mese = riga.created_at.slice(0, 7);
    if (!perMese.has(mese)) {
      perMese.set(mese, {
        chiamate: 0,
        proposte: 0,
        immagini: 0,
        costo: 0,
        utenti: new Set(),
      });
    }
    const voce = perMese.get(mese)!;
    voce.chiamate++;
    voce.costo += costo;
    if (riga.kind === "suggestion") voce.proposte++;
    if (riga.kind === "image" && riga.success) voce.immagini++;
    if (riga.user_id) voce.utenti.add(riga.user_id);
  }

  const numeroUtenti = utenti.count ?? 0;
  const numeroCapi = capi.count ?? 0;

  const mesi: MeseCosti[] = [...perMese.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mese, voce]) => ({
      mese,
      chiamate: voce.chiamate,
      proposte: voce.proposte,
      immagini: voce.immagini,
      costoTotale: Number(voce.costo.toFixed(4)),
      utentiAttivi: voce.utenti.size,
      // "Utente attivo" qui vuol dire: ha fatto almeno una richiesta a un
      // modello quel mese. Chi si è iscritto e non ha mai caricato niente
      // non entra nella media, altrimenti il costo medio sembrerebbe più
      // basso di quanto è davvero.
      costoMedioPerUtente: voce.utenti.size
        ? Number((voce.costo / voce.utenti.size).toFixed(4))
        : 0,
    }));

  return {
    disponibile: true,
    listaAttesa: listaAttesa.count ?? 0,
    utenti: numeroUtenti,
    capi: numeroCapi,
    capiPerUtente: numeroUtenti ? Number((numeroCapi / numeroUtenti).toFixed(1)) : 0,
    proposte,
    immagini,
    costoTotale: Number(costoTotale.toFixed(4)),
    mesi,
  };
}
