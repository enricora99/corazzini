"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Client Supabase per il browser.
 *
 * Tutto quello che passa di qui è soggetto alla Row Level Security: anche se
 * qualcuno modificasse il codice della pagina, il database gli restituirebbe
 * comunque solo i suoi dati.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
