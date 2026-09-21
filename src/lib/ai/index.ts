import "server-only";

import { GeminiImageProvider, GeminiTextProvider } from "./providers/gemini";
import { OpenAiCompatibleImageProvider } from "./providers/openai-compatible";
import { AiError, type ImageProvider, type TextProvider } from "./types";

/**
 * Scelta del fornitore, da variabile d'ambiente.
 *
 * È l'unico punto del progetto che sa quali fornitori esistono. Tutto il
 * resto lavora sulle interfacce `TextProvider` e `ImageProvider`, quindi
 * cambiare modello è una riga in `.env.local`.
 */

export function textProvider(): TextProvider {
  const nome = (process.env.AI_TEXT_PROVIDER ?? "gemini").toLowerCase();

  switch (nome) {
    case "gemini":
      return new GeminiTextProvider();
    default:
      throw new AiError(
        `AI_TEXT_PROVIDER vale "${nome}", che non conosco. I valori ammessi sono: gemini.`
      );
  }
}

export function imageProvider(): ImageProvider {
  const nome = (process.env.AI_IMAGE_PROVIDER ?? "gemini").toLowerCase();

  switch (nome) {
    case "gemini":
      return new GeminiImageProvider();
    case "seedream":
      return new OpenAiCompatibleImageProvider("seedream");
    case "qwen":
      return new OpenAiCompatibleImageProvider("qwen");
    default:
      throw new AiError(
        `AI_IMAGE_PROVIDER vale "${nome}", che non conosco. I valori ammessi sono: gemini, seedream, qwen.`
      );
  }
}

/** Lato in pixel delle immagini generate: il minimo utile per un telefono. */
export function latoImmagine(): number {
  const grezzo = Number(process.env.AI_IMAGE_SIZE ?? 768);
  if (!Number.isFinite(grezzo) || grezzo < 256) return 768;
  return Math.min(Math.round(grezzo), 2048);
}

/** Tetto giornaliero di immagini per utente. */
export function tettoImmaginiGiornaliero(): number {
  const grezzo = Number(process.env.AI_IMAGE_DAILY_LIMIT ?? 5);
  if (!Number.isFinite(grezzo) || grezzo < 0) return 5;
  return Math.round(grezzo);
}

export * from "./types";
