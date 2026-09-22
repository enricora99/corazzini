import "server-only";

import {
  AiError,
  CATEGORIES,
  SEASONS,
  STYLES,
  itemAttributesSchema,
  outfitSuggestionsSchema,
  type AiResult,
  type ClassifyInput,
  type GeneratedImage,
  type ImageInput,
  type ImageProvider,
  type ItemAttributes,
  type OutfitSuggestion,
  type SuggestInput,
  type TextProvider,
} from "../types";
import { promptImmagine, promptProposte } from "../prompts";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Oltre questo tempo l'utente ha già smesso di aspettare. */
const TIMEOUT_TESTO_MS = 30_000;
const TIMEOUT_IMMAGINE_MS = 90_000;

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  inline_data?: { mime_type: string; data: string };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function chiave(): string {
  const value = process.env.GEMINI_API_KEY;
  if (!value) {
    throw new AiError(
      "Manca GEMINI_API_KEY. Mettila in .env.local: la trovi su aistudio.google.com/apikey."
    );
  }
  return value;
}

async function chiama(
  model: string,
  body: unknown,
  timeoutMs: number
): Promise<GeminiResponse> {
  let risposta: Response;

  try {
    risposta = await fetch(`${BASE}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // In intestazione e non nella query: gli URL finiscono nei log dei
        // proxy, e una chiave nei log è una chiave da revocare.
        "x-goog-api-key": chiave(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (errore) {
    if (errore instanceof Error && errore.name === "TimeoutError") {
      throw new AiError("Il modello ci sta mettendo troppo. Riprova.", errore);
    }
    throw new AiError("Non riusciamo a raggiungere il modello.", errore);
  }

  const dati = (await risposta.json().catch(() => null)) as GeminiResponse | null;

  if (!risposta.ok) {
    const dettaglio = dati?.error?.message ?? `HTTP ${risposta.status}`;
    if (risposta.status === 429) {
      throw new AiError("Troppe richieste in poco tempo. Riprova tra un minuto.");
    }
    if (risposta.status === 401 || risposta.status === 403) {
      throw new AiError("La chiave del modello non è valida o è scaduta.");
    }
    throw new AiError(`Il modello ha risposto con un errore: ${dettaglio}`);
  }

  if (!dati) throw new AiError("Risposta del modello illeggibile.");

  if (dati.promptFeedback?.blockReason) {
    throw new AiError(
      "Il modello ha rifiutato questa immagine. Provane un'altra."
    );
  }

  return dati;
}

function uso(dati: GeminiResponse) {
  return {
    tokensIn: dati.usageMetadata?.promptTokenCount,
    tokensOut: dati.usageMetadata?.candidatesTokenCount,
  };
}

function testo(dati: GeminiResponse): string {
  const parti = dati.candidates?.[0]?.content?.parts ?? [];
  const unito = parti
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!unito) {
    const motivo = dati.candidates?.[0]?.finishReason;
    throw new AiError(
      motivo === "MAX_TOKENS"
        ? "La risposta del modello si è interrotta a metà. Riprova."
        : "Il modello non ha risposto nulla di utilizzabile."
    );
  }
  return unito;
}

/** Il modello dichiara di rispondere in JSON, ma a volte lo incarta in
 *  un blocco markdown. Costa tre righe pararlo, e salva la demo. */
function jsonDaTesto(grezzo: string): unknown {
  const pulito = grezzo
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  try {
    return JSON.parse(pulito);
  } catch (errore) {
    throw new AiError("Il modello ha risposto in un formato inatteso.", errore);
  }
}

// --- Schemi di risposta -----------------------------------------------------
// Chiedere al modello di attenersi a uno schema riduce di molto gli scarti.
// La validazione con zod resta comunque: lo schema è una richiesta, non una
// garanzia.

const SCHEMA_CAPO = {
  type: "OBJECT",
  properties: {
    category: { type: "STRING", enum: [...CATEGORIES] },
    subcategory: { type: "STRING" },
    colors: { type: "ARRAY", items: { type: "STRING" } },
    seasons: { type: "ARRAY", items: { type: "STRING", enum: [...SEASONS] } },
    style: { type: "STRING", enum: [...STYLES] },
    warmth: { type: "INTEGER" },
  },
  required: ["category", "colors", "seasons"],
};

const SCHEMA_PROPOSTE = {
  type: "OBJECT",
  properties: {
    suggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          itemIds: { type: "ARRAY", items: { type: "STRING" } },
          rationale: { type: "STRING" },
        },
        required: ["itemIds", "rationale"],
      },
    },
  },
  required: ["suggestions"],
};

// --- Fornitore di testo e visione -------------------------------------------

export class GeminiTextProvider implements TextProvider {
  readonly provider = "gemini";
  readonly model: string;

  constructor(model = process.env.AI_TEXT_MODEL ?? "gemini-2.5-flash") {
    this.model = model;
  }

  async classify(input: ClassifyInput): Promise<AiResult<ItemAttributes>> {
    const dati = await chiama(
      this.model,
      {
        contents: [
          {
            role: "user",
            parts: [
              { text: promptClassificazione() },
              {
                inline_data: {
                  mime_type: input.mimeType,
                  data: input.imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA_CAPO,
          // Bassa: qui vogliamo che riconosca, non che sia creativo.
          temperature: 0.1,
        },
      },
      TIMEOUT_TESTO_MS
    );

    const parsed = itemAttributesSchema.safeParse(jsonDaTesto(testo(dati)));
    if (!parsed.success) {
      throw new AiError(
        "Il modello ha descritto il capo in un modo che non riconosciamo. Compila i campi a mano."
      );
    }

    return {
      data: parsed.data,
      usage: uso(dati),
      provider: this.provider,
      model: this.model,
    };
  }

  async suggest(input: SuggestInput): Promise<AiResult<OutfitSuggestion[]>> {
    const dati = await chiama(
      this.model,
      {
        contents: [
          { role: "user", parts: [{ text: promptProposte(input) }] },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCHEMA_PROPOSTE,
          temperature: 0.8,
        },
      },
      TIMEOUT_TESTO_MS
    );

    const parsed = outfitSuggestionsSchema.safeParse(jsonDaTesto(testo(dati)));
    if (!parsed.success) {
      throw new AiError("Il modello non è riuscito a comporre gli outfit. Riprova.");
    }

    return {
      data: parsed.data.suggestions,
      usage: uso(dati),
      provider: this.provider,
      model: this.model,
    };
  }
}

// --- Fornitore di immagini --------------------------------------------------

export class GeminiImageProvider implements ImageProvider {
  readonly provider = "gemini";
  readonly model: string;

  constructor(model = process.env.AI_IMAGE_MODEL ?? "gemini-2.5-flash-image") {
    this.model = model;
  }

  async generate(input: ImageInput): Promise<AiResult<GeneratedImage>> {
    const dati = await chiama(
      this.model,
      {
        contents: [
          { role: "user", parts: [{ text: promptImmagine(input) }] },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          // Quadrata: è il formato che rende meglio in una griglia su telefono.
          imageConfig: { aspectRatio: "1:1" },
        },
      },
      TIMEOUT_IMMAGINE_MS
    );

    const parti = dati.candidates?.[0]?.content?.parts ?? [];
    const immagine = parti
      .map((p) => p.inlineData ?? (p.inline_data
        ? { mimeType: p.inline_data.mime_type, data: p.inline_data.data }
        : null))
      .find((p): p is { mimeType: string; data: string } => Boolean(p?.data));

    if (!immagine) {
      throw new AiError("Il modello non ha restituito nessuna immagine.");
    }

    return {
      data: {
        bytes: Buffer.from(immagine.data, "base64"),
        mimeType: immagine.mimeType || "image/png",
      },
      usage: { ...uso(dati), images: 1 },
      provider: this.provider,
      model: this.model,
    };
  }
}

function promptClassificazione(): string {
  return [
    "Sei un assistente che cataloga capi di abbigliamento a partire da una foto.",
    "Guarda l'immagine e descrivi il capo principale, ignorando sfondo, gruccia e altri oggetti.",
    "",
    "Regole:",
    `- category: una sola tra ${CATEGORIES.join(", ")}.`,
    "- colors: da uno a tre colori dominanti, in italiano e in minuscolo (per esempio: blu, bianco, beige).",
    "- seasons: le stagioni in cui il capo si indossa. Se va bene tutto l'anno, elencale tutte e quattro.",
    `- style: uno solo tra ${STYLES.join(", ")}.`,
    "- warmth: quanto copre, da 1 (canotta) a 5 (piumino da montagna).",
    "- subcategory: due o tre parole in italiano, per esempio «camicia di lino» o «jeans dritti».",
    "",
    "Se la foto non contiene un capo di abbigliamento, scegli comunque la categoria più vicina: l'utente potrà correggerla.",
  ].join("\n");
}
