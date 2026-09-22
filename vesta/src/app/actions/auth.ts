"use server";

import { redirect } from "next/navigation";

import { getSessione } from "@/lib/dal";
import type { FormState } from "@/lib/form-state";
import { loginSchema } from "@/lib/schemas";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Percorsi interni soltanto: un "prossima" preso dalla query potrebbe
 *  altrimenti portare l'utente su un dominio esterno dopo l'accesso. */
function destinazioneSicura(prossima: unknown): string {
  if (typeof prossima !== "string") return "/app";
  if (!prossima.startsWith("/") || prossima.startsWith("//")) return "/app";
  return prossima;
}

export async function inviaLinkAccesso(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const rawEmail = formData.get("email");
  const adult = formData.get("adult") === "on";
  const prossima = destinazioneSicura(formData.get("prossima"));

  const values = {
    email: typeof rawEmail === "string" ? rawEmail : undefined,
    adult,
  };

  const parsed = loginSchema.safeParse({ email: rawEmail, adult });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      errors: { email: flat.email?.[0], adult: flat.adult?.[0] },
      values,
    };
  }

  if (!hasSupabasePublicEnv()) {
    return {
      status: "error",
      message:
        "L'accesso non è ancora configurato su questa installazione. Servono le chiavi di Supabase in .env.local.",
      values,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${SITE_URL}/auth/callback?prossima=${encodeURIComponent(prossima)}`,
    },
  });

  if (error) {
    console.error("[auth] invio del link fallito:", error.message);
    return {
      status: "error",
      message: `Non siamo riusciti a mandarti il link. Riprova tra poco, o scrivici a ${CONTACT_EMAIL}.`,
      values,
    };
  }

  return {
    status: "success",
    message: parsed.data.email,
  };
}

/**
 * Registra la conferma di maggiore età sul profilo.
 *
 * La dichiarazione l'utente l'ha già data chiedendo il link, ma quella non
 * lascia traccia: è questa scrittura a essere verificabile, ed è quella che
 * il Data Access Layer controlla a ogni ingresso nell'area riservata.
 */
export async function confermaMaggiorenne(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  if (formData.get("adult") !== "on") {
    return {
      status: "error",
      errors: { adult: "Devi confermare di avere almeno 18 anni." },
    };
  }

  const sessione = await getSessione();
  if (!sessione) redirect("/auth/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ adult_confirmed_at: new Date().toISOString() })
    .eq("id", sessione.userId);

  if (error) {
    console.error("[auth] conferma maggiore età fallita:", error.message);
    return {
      status: "error",
      message: "Non siamo riusciti a salvare la conferma. Riprova.",
    };
  }

  redirect("/app");
}

export async function esci(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
