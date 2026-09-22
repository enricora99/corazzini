"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { richiediSessione } from "@/lib/dal";
import { occasionSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

const salvaSchema = z.object({
  occasion: occasionSchema,
  itemIds: z.array(z.uuid()).min(2).max(6),
  rationale: z.string().trim().max(300).optional(),
  imagePath: z.string().max(300).optional(),
  weather: z
    .object({
      temperature: z.number(),
      apparent: z.number(),
      precipitation: z.number(),
      description: z.string().max(60),
    })
    .nullish(),
  /** { id del capo → id dell'amico proprietario } */
  borrowedFrom: z.record(z.uuid(), z.uuid()).optional(),
});

export type SalvaOutfitInput = z.infer<typeof salvaSchema>;

export type EsitoOutfit = { ok: true } | { ok: false; error: string };

export async function salvaOutfit(
  input: SalvaOutfitInput
): Promise<EsitoOutfit> {
  const sessione = await richiediSessione("/app/outfit");

  const parsed = salvaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Outfit non valido." };
  }

  const dati = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("outfits").insert({
    user_id: sessione.userId,
    occasion: dati.occasion,
    item_ids: dati.itemIds,
    borrowed_from: dati.borrowedFrom ?? {},
    rationale: dati.rationale ?? null,
    weather: dati.weather ?? null,
    image_path: dati.imagePath ?? null,
    saved: true,
  });

  if (error) {
    console.error("[outfits] salvataggio fallito:", error.message);
    return { ok: false, error: "Non siamo riusciti a salvare l'outfit." };
  }

  revalidatePath("/app/outfit");
  return { ok: true };
}
