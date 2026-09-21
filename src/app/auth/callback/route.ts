import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/** Solo percorsi interni: un indirizzo assoluto qui diventerebbe un
 *  reindirizzamento aperto da usare per portare la gente altrove. */
function destinazioneSicura(prossima: string | null): string {
  if (!prossima) return "/app";
  if (!prossima.startsWith("/") || prossima.startsWith("//")) return "/app";
  return prossima;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const prossima = destinazioneSicura(searchParams.get("prossima"));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  // Supabase manda un `code` con il flusso PKCE, che è quello predefinito con
  // @supabase/ssr. Se però il team personalizza il modello dell'email può
  // arrivare invece un `token_hash`: gestiamo entrambi, così un cambio di
  // template non rompe l'accesso il giorno della demo.
  let errore: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errore = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    errore = error?.message ?? null;
  } else {
    errore = "link-incompleto";
  }

  if (errore) {
    console.error("[auth] callback fallita:", errore);
    return NextResponse.redirect(`${origin}/auth/login?errore=link`);
  }

  // Se manca la conferma di maggiore età, il gate viene prima di tutto.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profilo } = await supabase
      .from("profiles")
      .select("adult_confirmed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profilo?.adult_confirmed_at) {
      const gate = new URL("/auth/maggiorenne", origin);
      gate.searchParams.set("prossima", prossima);
      return NextResponse.redirect(gate);
    }
  }

  return NextResponse.redirect(`${origin}${prossima}`);
}
