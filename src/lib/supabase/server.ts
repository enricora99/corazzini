import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Client Supabase legato alla sessione dell'utente.
 *
 * Va creato a ogni richiesta — mai riusato tra richieste diverse, o le
 * intestazioni anti-cache finirebbero solo sulla prima.
 *
 * Rispetta la Row Level Security: è questo che va usato praticamente ovunque.
 * Il client di amministrazione (`admin.ts`) serve solo dove un utente non c'è.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Da un Server Component i cookie sono in sola lettura. Non è un
          // problema: al rinnovo della sessione ci pensa src/proxy.ts, che
          // gira prima e può scrivere sulla risposta.
        }
      },
    },
  });
}
