import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { stimaCosto } from "./pricing";
import type { AiUsage } from "./types";

export type TipoChiamata = "classification" | "suggestion" | "image";

/**
 * Registra una chiamata a un modello in `ai_calls`.
 *
 * Passa dal client di amministrazione perché la tabella non ha policy di
 * inserimento: un utente non deve poter scrivere (né alterare) i costi che
 * finiscono nel business plan.
 *
 * Non lancia mai. Se il registro fallisce, l'utente ha comunque ricevuto il
 * suo outfit: perdere una riga di contabilità non è un buon motivo per
 * rompergli la schermata.
 */
export async function registraChiamata(params: {
  userId: string | null;
  provider: string;
  model: string;
  kind: TipoChiamata;
  usage: AiUsage;
  durationMs: number;
  success: boolean;
  error?: string;
}): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const costo = stimaCosto(params.provider, params.model, params.usage);

  const { error } = await supabase.from("ai_calls").insert({
    user_id: params.userId,
    provider: params.provider,
    model: params.model,
    kind: params.kind,
    cost_usd: costo,
    duration_ms: Math.round(params.durationMs),
    tokens_in: params.usage.tokensIn ?? null,
    tokens_out: params.usage.tokensOut ?? null,
    success: params.success,
    // Il messaggio d'errore può essere lungo e prolisso: ne bastano i
    // primi caratteri per capire cosa è andato storto.
    error: params.error?.slice(0, 500) ?? null,
  });

  if (error) {
    console.error("[ai/log] registrazione fallita:", error.message);
  }
}

/**
 * Esegue un'operazione su un modello misurandola e registrandola,
 * sia che vada bene sia che vada male.
 */
export async function conRegistro<T>(
  params: {
    userId: string | null;
    provider: string;
    model: string;
    kind: TipoChiamata;
  },
  operazione: () => Promise<{ data: T; usage: AiUsage }>
): Promise<T> {
  const inizio = performance.now();

  try {
    const esito = await operazione();
    await registraChiamata({
      ...params,
      usage: esito.usage,
      durationMs: performance.now() - inizio,
      success: true,
    });
    return esito.data;
  } catch (errore) {
    await registraChiamata({
      ...params,
      usage: {},
      durationMs: performance.now() - inizio,
      success: false,
      error: errore instanceof Error ? errore.message : String(errore),
    });
    throw errore;
  }
}
