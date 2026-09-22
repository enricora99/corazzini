/**
 * Accesso alle variabili di Supabase che possono stare nel browser.
 *
 * Non c'è niente di segreto qui: la chiave "anon" è pensata per essere
 * pubblica, e da sola non scavalca la Row Level Security. La chiave di
 * amministrazione vive altrove, in `admin.ts`, che è `server-only`.
 */

export function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error(
      "Manca NEXT_PUBLIC_SUPABASE_URL. Copia .env.example in .env.local e riempilo."
    );
  }
  return value;
}

export function supabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error(
      "Manca NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example in .env.local e riempilo."
    );
  }
  return value;
}

/** Vero se l'accesso è configurabile. Serve a mostrare messaggi sensati
 *  invece di far esplodere la pagina quando le chiavi non ci sono ancora. */
export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
