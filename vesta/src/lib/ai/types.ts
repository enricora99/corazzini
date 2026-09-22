import { z } from "zod";

import { OCCASIONS } from "@/lib/schemas";

/**
 * Interfaccia comune ai fornitori di modelli.
 *
 * Tutto quello che sta sopra questo file non sa da chi arrivano le risposte.
 * Cambiare fornitore è una riga in `.env.local`, non una modifica al codice.
 */

// --- Vocabolario dei capi ---------------------------------------------------
// Chiuso di proposito: se il modello inventa una categoria nuova, la
// validazione la respinge invece di farla finire nel database.

export const CATEGORIES = [
  "top",
  "pantaloni",
  "gonna",
  "vestito",
  "giacca",
  "scarpe",
  "accessorio",
] as const;

export const SEASONS = ["primavera", "estate", "autunno", "inverno"] as const;

export const STYLES = ["casual", "formale", "sportivo", "elegante"] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  top: "Top",
  pantaloni: "Pantaloni",
  gonna: "Gonna",
  vestito: "Vestito",
  giacca: "Giacca",
  scarpe: "Scarpe",
  accessorio: "Accessorio",
};

export type Category = (typeof CATEGORIES)[number];
export type Season = (typeof SEASONS)[number];
export type Style = (typeof STYLES)[number];

/** Quello che ci aspettiamo dal modello di visione. */
export const itemAttributesSchema = z.object({
  category: z.enum(CATEGORIES),
  subcategory: z.string().max(60).nullish(),
  colors: z.array(z.string().max(30)).max(4),
  seasons: z.array(z.enum(SEASONS)).max(4),
  style: z.enum(STYLES).nullish(),
  // Quanto copre: 1 canotta, 5 piumino. Serve a incrociare i capi col meteo.
  warmth: z.number().int().min(1).max(5).nullish(),
});

export type ItemAttributes = z.infer<typeof itemAttributesSchema>;

/** Quello che mandiamo al modello di testo: metadati, mai le fotografie. */
export type ItemSummary = {
  id: string;
  category: Category;
  subcategory?: string | null;
  colors: string[];
  seasons: string[];
  style?: string | null;
  warmth?: number | null;
  /** Presente solo per i capi presi in prestito dagli amici. */
  ownerName?: string | null;
};

export type WeatherSnapshot = {
  temperature: number;
  apparent: number;
  precipitation: number;
  description: string;
  city?: string | null;
};

/** Una proposta di outfit. Gli id vanno validati contro i capi reali:
 *  un modello può citare un id che non esiste. */
export const outfitSuggestionSchema = z.object({
  itemIds: z.array(z.string()).min(2).max(6),
  rationale: z.string().min(1).max(300),
});

export const outfitSuggestionsSchema = z.object({
  suggestions: z.array(outfitSuggestionSchema).min(1).max(3),
});

export type OutfitSuggestion = z.infer<typeof outfitSuggestionSchema>;

// --- Risultati --------------------------------------------------------------

export type AiUsage = {
  tokensIn?: number;
  tokensOut?: number;
  images?: number;
};

export type AiResult<T> = {
  data: T;
  usage: AiUsage;
  provider: string;
  model: string;
};

export type GeneratedImage = {
  bytes: Uint8Array;
  mimeType: string;
};

// --- Ingressi ---------------------------------------------------------------

export type ClassifyInput = {
  imageBase64: string;
  mimeType: string;
};

export type SuggestInput = {
  items: ItemSummary[];
  occasion: (typeof OCCASIONS)[number];
  weather: WeatherSnapshot | null;
};

export type ImageInput = {
  items: ItemSummary[];
  occasion: (typeof OCCASIONS)[number];
  /** Lato del quadrato in pixel: il minimo utile per uno schermo di telefono. */
  size: number;
};

// --- I due contratti --------------------------------------------------------

export interface TextProvider {
  readonly provider: string;
  readonly model: string;
  classify(input: ClassifyInput): Promise<AiResult<ItemAttributes>>;
  suggest(input: SuggestInput): Promise<AiResult<OutfitSuggestion[]>>;
}

export interface ImageProvider {
  readonly provider: string;
  readonly model: string;
  generate(input: ImageInput): Promise<AiResult<GeneratedImage>>;
}

/** Errore che risale fino all'interfaccia con un messaggio mostrabile. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "AiError";
  }
}
