/**
 * Listino dei modelli, per stimare il costo di ogni chiamata.
 *
 * ATTENZIONE: questi numeri sono una configurazione, non una verità. I
 * fornitori cambiano i prezzi senza preavviso. Prima di portare le cifre in
 * un business plan, confrontatele con il listino ufficiale:
 *
 *   Gemini   https://ai.google.dev/pricing
 *   Seedream https://www.volcengine.com/docs (listino di ByteDance)
 *   Qwen     https://help.aliyun.com/zh/model-studio/billing
 *
 * Quello che finisce in `ai_calls` è quindi una **stima**, ed è etichettata
 * come tale anche in /admin. Serve a capire l'ordine di grandezza e a
 * confrontare i fornitori tra loro, non a riconciliare una fattura.
 */

export type ModelPricing = {
  /** Dollari per milione di token in ingresso. */
  inputPerMillion?: number;
  /** Dollari per milione di token in uscita. */
  outputPerMillion?: number;
  /** Dollari per immagine generata. */
  perImage?: number;
};

export const PRICING: Record<string, ModelPricing> = {
  "gemini:gemini-2.5-flash": {
    inputPerMillion: 0.3,
    outputPerMillion: 2.5,
  },
  "gemini:gemini-2.5-flash-image": {
    inputPerMillion: 0.3,
    perImage: 0.039,
  },
  "seedream:seedream-4.0": {
    perImage: 0.03,
  },
  "qwen:qwen-image-edit": {
    perImage: 0.025,
  },
};

/** Listino di riserva: meglio una stima grossolana che un costo a zero,
 *  che in /admin sembrerebbe "gratis" e non "non lo sappiamo". */
const FALLBACK: ModelPricing = {
  inputPerMillion: 0.3,
  outputPerMillion: 2.5,
  perImage: 0.04,
};

export function stimaCosto(
  provider: string,
  model: string,
  usage: { tokensIn?: number; tokensOut?: number; images?: number }
): number {
  const listino = PRICING[`${provider}:${model}`] ?? FALLBACK;

  const ingresso =
    ((usage.tokensIn ?? 0) / 1_000_000) * (listino.inputPerMillion ?? 0);
  const uscita =
    ((usage.tokensOut ?? 0) / 1_000_000) * (listino.outputPerMillion ?? 0);
  const immagini = (usage.images ?? 0) * (listino.perImage ?? 0);

  // Sei decimali: la colonna del database è numeric(10, 6), e una singola
  // classificazione può costare frazioni di millesimo di dollaro.
  return Number((ingresso + uscita + immagini).toFixed(6));
}

/** Vero se per questa combinazione abbiamo un prezzo vero e non il ripiego. */
export function prezzoNoto(provider: string, model: string): boolean {
  return Boolean(PRICING[`${provider}:${model}`]);
}
