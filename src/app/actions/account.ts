"use server";

import { redirect } from "next/navigation";

import { richiediSessione } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EsitoAccount = { ok: false; error: string };

/**
 * Cancella l'account e tutto quello che c'è dentro.
 *
 * L'ordine conta. Prima i file, perché una volta sparita la riga del capo non
 * sapremmo più quale file cancellare, e resterebbe nell'archivio per sempre.
 * Poi l'utente in auth.users: le tabelle sono legate con `on delete cascade`,
 * quindi profilo, capi, outfit e amicizie se ne vanno da sole.
 */
export async function cancellaAccount(): Promise<EsitoAccount | never> {
  const sessione = await richiediSessione("/app/impostazioni");
  const supabase = await createClient();

  // Cancellare un utente da auth.users richiede la chiave di amministrazione:
  // è l'unica operazione dell'app che la usa su richiesta di un utente, ed è
  // legittima perché l'utente sta cancellando sé stesso.
  const admin = createAdminClient();
  if (!admin) {
    console.error("[account] SUPABASE_SERVICE_ROLE_KEY mancante");
    return {
      ok: false,
      error:
        "La cancellazione non è configurata su questa installazione. Scrivici e lo facciamo noi.",
    };
  }

  // --- 1. Le foto dei capi ---
  const { data: capi } = await supabase
    .from("items")
    .select("photo_path")
    .eq("user_id", sessione.userId);

  const percorsiCapi = (capi ?? [])
    .map((c) => c.photo_path)
    .filter((p): p is string => Boolean(p));

  if (percorsiCapi.length > 0) {
    const { error } = await admin.storage.from("items").remove(percorsiCapi);
    if (error) console.error("[account] foto non rimosse:", error.message);
  }

  // --- 2. Le immagini degli outfit generate ---
  const { data: immagini } = await supabase
    .from("outfit_images")
    .select("storage_path")
    .eq("user_id", sessione.userId);

  const percorsiOutfit = (immagini ?? [])
    .map((i) => i.storage_path)
    .filter((p): p is string => Boolean(p));

  if (percorsiOutfit.length > 0) {
    const { error } = await admin.storage
      .from("outfits")
      .remove(percorsiOutfit);
    if (error) console.error("[account] immagini non rimosse:", error.message);
  }

  // --- 3. L'utente, che si porta dietro tutto il resto ---
  const { error } = await admin.auth.admin.deleteUser(sessione.userId);

  if (error) {
    console.error("[account] cancellazione fallita:", error.message);
    return {
      ok: false,
      error: "Non siamo riusciti a cancellare l'account. Riprova.",
    };
  }

  await supabase.auth.signOut();
  redirect("/?addio=1");
}
