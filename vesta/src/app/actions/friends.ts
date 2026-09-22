"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { richiediSessione } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type EsitoInvito =
  | { ok: true; token: string }
  | { ok: false; error: string };

export type EsitoAmicizia = { ok: true } | { ok: false; error: string };

/** Un invito in sospeso alla volta non basta — si invitano più persone — ma
 *  senza un tetto un click ripetuto riempirebbe la tabella. */
const MAX_INVITI_IN_SOSPESO = 10;

export async function creaInvito(): Promise<EsitoInvito> {
  const sessione = await richiediSessione("/app/amici");
  const supabase = await createClient();

  const { count } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", sessione.userId)
    .eq("status", "pending");

  if ((count ?? 0) >= MAX_INVITI_IN_SOSPESO) {
    return {
      ok: false,
      error: `Hai già ${MAX_INVITI_IN_SOSPESO} inviti in sospeso. Usa quelli, o cancellane qualcuno.`,
    };
  }

  // Il token lo genera il database (gen_random_bytes): niente numeri casuali
  // prodotti da noi per qualcosa che protegge l'accesso a un armadio.
  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: sessione.userId, status: "pending" })
    .select("invite_token")
    .single();

  if (error || !data) {
    console.error("[amici] creazione invito fallita:", error?.message);
    return { ok: false, error: "Non siamo riusciti a creare l'invito." };
  }

  revalidatePath("/app/amici");
  return { ok: true, token: data.invite_token };
}

export async function accettaInvito(token: string): Promise<EsitoAmicizia> {
  await richiediSessione(`/app/amici/invito/${token}`);

  if (!z.string().min(8).max(128).safeParse(token).success) {
    return { ok: false, error: "Invito non valido." };
  }

  const supabase = await createClient();

  // Passa da una funzione del database e non da una update diretta: finché
  // l'invito è in sospeso la riga non è visibile a chi la deve accettare,
  // quindi una update non troverebbe nulla da aggiornare.
  const { error } = await supabase.rpc("accept_friend_invite", { token });

  if (error) {
    console.error("[amici] accettazione fallita:", error.message);
    // I messaggi che solleva la funzione sono già scritti per essere letti.
    return { ok: false, error: messaggioLeggibile(error.message) };
  }

  revalidatePath("/app/amici");
  return { ok: true };
}

export async function rimuoviAmicizia(id: string): Promise<EsitoAmicizia> {
  await richiediSessione("/app/amici");

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: "Amicizia non valida." };
  }

  const supabase = await createClient();

  // Chi può cancellare lo decide la policy: solo le due persone coinvolte.
  const { error } = await supabase.from("friendships").delete().eq("id", id);

  if (error) {
    console.error("[amici] rimozione fallita:", error.message);
    return { ok: false, error: "Non siamo riusciti a rimuovere l'amicizia." };
  }

  revalidatePath("/app/amici");
  revalidatePath("/app/outfit");
  return { ok: true };
}

function messaggioLeggibile(grezzo: string): string {
  const conosciuti = [
    "Invito non valido.",
    "Non puoi accettare il tuo stesso invito.",
    "Questo invito è già stato usato.",
    "Siete già amici.",
    "Devi aver effettuato l'accesso.",
  ];
  const trovato = conosciuti.find((m) => grezzo.includes(m));
  return trovato ?? "Non siamo riusciti ad accettare l'invito.";
}
