import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_ACCESSO, codiceRichiesto, esenteDaCodice } from "@/lib/access";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * In Next 16 il middleware si chiama `proxy`. Fa due cose:
 *
 * 1. rinnova la sessione Supabase e riscrive i cookie aggiornati;
 * 2. fa un controllo ottimistico e rimanda alla pagina di accesso chi non ha
 *    una sessione.
 *
 * Il punto 2 è solo una scorciatoia per l'esperienza d'uso, non una misura di
 * sicurezza: gira su ogni rotta, comprese quelle precaricate, quindi si limita
 * a leggere il cookie. Il controllo che conta è nel Data Access Layer
 * (`src/lib/dal.ts`) e, sotto ancora, nelle policy del database.
 */

const PROTETTE = ["/app", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Cancello a codice d'invito -----------------------------------------
  // Prima di tutto il resto: finché l'MVP non è pubblico, chi non ha il
  // codice non deve vedere nemmeno la landing. Se ACCESS_CODE non è
  // impostata questo blocco non fa niente e il sito è aperto.
  const codice = codiceRichiesto();
  if (codice && !esenteDaCodice(pathname)) {
    if (request.cookies.get(COOKIE_ACCESSO)?.value !== codice) {
      const cancello = request.nextUrl.clone();
      cancello.pathname = "/accesso";
      cancello.search = "";
      // Dove stava andando, per riportarcelo dopo.
      if (pathname !== "/") cancello.searchParams.set("prossima", pathname);
      return NextResponse.redirect(cancello);
    }
  }

  // Senza chiavi configurate non c'è sessione da rinnovare. Lasciamo passare:
  // la landing deve restare visitabile anche prima che Supabase esista.
  if (!hasSupabasePublicEnv()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Queste intestazioni non sono un dettaglio: senza, la CDN davanti
          // all'app potrebbe mettere in cache una risposta che contiene un
          // Set-Cookie di sessione e servirla a un altro utente.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    }
  );

  // Va chiamata presto, prima che la risposta sia composta: se il rinnovo del
  // token arrivasse dopo, i cookie aggiornati non finirebbero nella risposta
  // e alla richiesta successiva si ricomincerebbe da capo.
  const { data } = await supabase.auth.getClaims();
  const utente = data?.claims?.sub ?? null;

  const eProtetta = PROTETTE.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );

  if (eProtetta && !utente) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    // Dove voleva andare, per riportarcelo dopo l'accesso.
    login.searchParams.set("prossima", pathname);
    return NextResponse.redirect(login);
  }

  // Chi è già dentro non ha motivo di rivedere la pagina di accesso.
  if (pathname === "/auth/login" && utente) {
    const app = request.nextUrl.clone();
    app.pathname = "/app";
    app.search = "";
    return NextResponse.redirect(app);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * La radice va elencata a parte. Il modello qui sotto, per come Next lo
     * compila, NON intercetta "/": senza questa riga il cancello lascerebbe
     * passare la landing, che è esattamente la pagina che deve proteggere.
     * Verificato a mano, non dedotto.
     */
    "/",
    /*
     * Tutto il resto tranne gli asset statici e le immagini generate da Next:
     * farci girare sopra un controllo di sessione costerebbe latenza su ogni
     * file senza servire a niente.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|brand/|sw.js|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$).*)",
  ],
};
