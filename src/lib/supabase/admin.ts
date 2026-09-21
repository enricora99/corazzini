import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase con la chiave di servizio.
 *
 * Scavalca la Row Level Security, quindi vive solo qui dentro e solo sul
 * server: l'import di `server-only` in cima fa fallire la build se qualcuno
 * prova a importarlo da un componente client.
 *
 * Usalo unicamente dove il controllo di chi sei l'hai già fatto tu a mano,
 * o dove non c'è un utente (lista d'attesa, registrazione delle chiamate ai
 * modelli, pagina di amministrazione). Per tutto il resto usa il client
 * legato alla sessione, che rispetta le policy.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Torna null invece di lanciare: così il progetto si compila e si apre
  // anche prima che il team abbia creato il progetto Supabase. Chi chiama
  // deve gestire il caso e dirlo all'utente, non fingere che sia andata bene.
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Vero se le variabili di Supabase sono configurate. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
