import { NextResponse } from "next/server";

import { getProfilo, richiediSessione } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

/**
 * Esportazione dei propri dati in JSON.
 *
 * È il diritto alla portabilità: tutto quello che abbiamo su una persona, in
 * un file che una macchina sa rileggere. Le query passano dal client legato
 * alla sessione, quindi la RLS garantisce che nessuno esporti i dati altrui
 * anche se qualcosa qui fosse scritto male.
 */
export async function GET() {
  const sessione = await richiediSessione("/app/impostazioni");
  const supabase = await createClient();
  const profilo = await getProfilo();

  const [capi, outfit, amicizie, chiamate] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .eq("user_id", sessione.userId)
      .order("created_at"),
    supabase
      .from("outfits")
      .select("*")
      .eq("user_id", sessione.userId)
      .order("created_at"),
    supabase.from("friendships").select("*").order("created_at"),
    supabase
      .from("ai_calls")
      .select("provider, model, kind, cost_usd, duration_ms, created_at")
      .eq("user_id", sessione.userId)
      .order("created_at"),
  ]);

  const esportazione = {
    esportato_il: new Date().toISOString(),
    nota:
      "Le foto non sono incluse in questo file: stanno nell'archivio e si scaricano dai collegamenti dell'app. " +
      "Scrivici se ti servono anche quelle.",
    profilo,
    capi: capi.data ?? [],
    outfit: outfit.data ?? [],
    amicizie: amicizie.data ?? [],
    chiamate_ai_modelli: chiamate.data ?? [],
  };

  const data = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(esportazione, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="vesta-${data}.json"`,
      // Contiene dati personali: non deve finire in nessuna cache.
      "Cache-Control": "private, no-store",
    },
  });
}
