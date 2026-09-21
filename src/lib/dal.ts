import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer.
 *
 * Qui sta il controllo di autorizzazione che conta. Il proxy fa solo una
 * verifica ottimistica sul cookie per evitare un lampo di pagina sbagliata;
 * chi decide davvero chi sei è questo modulo, che sta il più vicino possibile
 * ai dati, più le policy del database sotto.
 *
 * Usiamo `getClaims()` e non `getSession()`: il primo verifica la firma del
 * token, il secondo si limita a leggere il cookie. Un cookie si fabbrica.
 */

export type Sessione = {
  userId: string;
  email: string | null;
};

/**
 * `cache` di React tiene il risultato per la durata della singola richiesta:
 * dieci componenti possono chiederla senza dieci verifiche del token.
 */
export const getSessione = cache(async (): Promise<Sessione | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  return { userId, email: data?.claims?.email ?? null };
});

/** Sessione obbligatoria: chi non ce l'ha finisce alla pagina di accesso. */
export async function richiediSessione(prossima?: string): Promise<Sessione> {
  const sessione = await getSessione();
  if (!sessione) {
    const destinazione = prossima
      ? `/auth/login?prossima=${encodeURIComponent(prossima)}`
      : "/auth/login";
    redirect(destinazione);
  }
  return sessione;
}

export type Profilo = {
  id: string;
  email: string;
  display_name: string | null;
  adult_confirmed_at: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
};

export const getProfilo = cache(async (): Promise<Profilo | null> => {
  const sessione = await getSessione();
  if (!sessione) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, adult_confirmed_at, city, lat, lon")
    .eq("id", sessione.userId)
    .maybeSingle();

  if (error) {
    console.error("[dal] lettura del profilo fallita:", error.message);
    return null;
  }
  return data as Profilo | null;
});

/**
 * Per entrare nell'area riservata servono due cose: una sessione valida e la
 * conferma di essere maggiorenne. La seconda si chiede una volta sola, ma va
 * verificata a ogni accesso: altrimenti basterebbe saltare la pagina del
 * gate scrivendo l'indirizzo a mano.
 */
export async function richiediUtenteMaggiorenne(
  prossima?: string
): Promise<{ sessione: Sessione; profilo: Profilo }> {
  const sessione = await richiediSessione(prossima);
  const profilo = await getProfilo();

  if (!profilo) {
    // Il profilo lo crea un trigger alla registrazione. Se manca, qualcosa
    // non ha funzionato: meglio rimandare all'accesso che proseguire al buio.
    redirect("/auth/login?errore=profilo");
  }

  if (!profilo.adult_confirmed_at) {
    redirect("/auth/maggiorenne");
  }

  return { sessione, profilo };
}

/** Email autorizzate ad aprire /admin, da variabile d'ambiente. */
export function emailAmministratori(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAmministratore(): Promise<boolean> {
  const sessione = await getSessione();
  if (!sessione?.email) return false;
  return emailAmministratori().includes(sessione.email.toLowerCase());
}

export async function richiediAmministratore(): Promise<Sessione> {
  const sessione = await richiediSessione("/admin");
  if (!(await isAmministratore())) {
    // 404 e non 403: a chi non è amministratore non diciamo nemmeno che
    // questa pagina esiste.
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return sessione;
}
