import "server-only";

import { createHash } from "node:crypto";

import { tettoImmaginiGiornaliero } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tetto giornaliero alle immagini generate e chiave di cache.
 *
 * Sono i due freni ai costi chiesti dalla specifica. Il conteggio passa dal
 * client di amministrazione perché legge `ai_calls`, dove un utente non deve
 * poter mettere mano: altrimenti basterebbe cancellarsi le righe per
 * azzerarsi il contatore.
 */

export type EsitoQuota =
  | { consentito: true; usate: number; tetto: number }
  | { consentito: false; usate: number; tetto: number; messaggio: string };

export async function controllaQuotaImmagini(
  userId: string
): Promise<EsitoQuota> {
  const tetto = tettoImmaginiGiornaliero();
  const supabase = createAdminClient();

  // Senza client di amministrazione non sappiamo contare. Bloccare sarebbe
  // peggio: l'app diventerebbe inutilizzabile per un problema di
  // configurazione. Lasciamo passare e lo scriviamo nei log.
  if (!supabase) {
    console.error("[quota] nessun client di amministrazione: conteggio saltato");
    return { consentito: true, usate: 0, tetto };
  }

  // Dalla mezzanotte locale del server. Con Vercel in fra1 è l'ora europea,
  // che è quella dei nostri utenti.
  const inizioGiornata = new Date();
  inizioGiornata.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "image")
    .eq("success", true)
    .gte("created_at", inizioGiornata.toISOString());

  if (error) {
    console.error("[quota] conteggio fallito:", error.message);
    return { consentito: true, usate: 0, tetto };
  }

  const usate = count ?? 0;

  if (usate >= tetto) {
    return {
      consentito: false,
      usate,
      tetto,
      messaggio: `Hai già generato ${tetto} immagini oggi. Le proposte con le foto dei tuoi capi restano illimitate.`,
    };
  }

  return { consentito: true, usate, tetto };
}

/**
 * Chiave di cache di un'immagine.
 *
 * Gli id si ordinano prima di unirli: lo stesso outfit proposto con i capi in
 * ordine diverso è lo stesso outfit, e non va pagato due volte. Ci entra
 * anche il modello, perché cambiando fornitore l'immagine cambia davvero.
 */
export function chiaveCache(params: {
  itemIds: string[];
  occasion: string;
  provider: string;
  model: string;
}): string {
  const impronta = [
    [...params.itemIds].sort().join(","),
    params.occasion,
    params.provider,
    params.model,
  ].join("|");

  return createHash("sha256").update(impronta).digest("hex");
}
