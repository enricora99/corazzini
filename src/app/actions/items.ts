"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CATEGORIES, SEASONS, STYLES } from "@/lib/ai/types";
import { richiediSessione } from "@/lib/dal";
import { BUCKET } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";

const capoSchema = z.object({
  id: z.uuid(),
  photoPath: z.string().min(1).max(300),
  category: z.enum(CATEGORIES),
  subcategory: z.string().trim().max(60).optional(),
  colors: z.array(z.string().trim().min(1).max(30)).max(4),
  seasons: z.array(z.enum(SEASONS)).max(4),
  style: z.enum(STYLES).optional(),
  warmth: z.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(300).optional(),
  aiClassified: z.boolean(),
  correctedByUser: z.boolean(),
});

export type SalvaCapoInput = z.infer<typeof capoSchema>;

export type EsitoCapo = { ok: true } | { ok: false; error: string };

export async function salvaCapo(input: SalvaCapoInput): Promise<EsitoCapo> {
  const sessione = await richiediSessione("/app/armadio");

  const parsed = capoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Alcuni campi non sono validi. Controllali." };
  }

  const dati = parsed.data;

  // Il percorso deve stare nella cartella dell'utente. La policy dello storage
  // lo impone già, ma qui evitiamo di scrivere una riga che punta a un file
  // che l'utente non potrebbe mai leggere.
  if (!dati.photoPath.startsWith(`${sessione.userId}/`)) {
    return { ok: false, error: "Percorso della foto non valido." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("items").insert({
    id: dati.id,
    // Anche se qualcuno cambiasse questo valore, la policy di inserimento
    // rifiuterebbe una riga intestata a un altro utente.
    user_id: sessione.userId,
    photo_path: dati.photoPath,
    category: dati.category,
    subcategory: dati.subcategory || null,
    colors: dati.colors,
    seasons: dati.seasons,
    style: dati.style ?? null,
    warmth: dati.warmth ?? null,
    notes: dati.notes || null,
    ai_classified: dati.aiClassified,
    corrected_by_user: dati.correctedByUser,
  });

  if (error) {
    console.error("[items] salvataggio fallito:", error.message);
    return { ok: false, error: "Non siamo riusciti a salvare il capo. Riprova." };
  }

  revalidatePath("/app/armadio");
  revalidatePath("/app");
  return { ok: true };
}

export async function eliminaCapo(id: string): Promise<EsitoCapo> {
  // Non serve l'identità qui — chi può cancellare lo decide la policy del
  // database — ma la chiamata resta: senza sessione l'utente va all'accesso
  // invece di ricevere un silenzioso "non è successo niente".
  await richiediSessione("/app/armadio");

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: "Capo non valido." };
  }

  const supabase = await createClient();

  // Il percorso della foto serve prima di cancellare la riga, altrimenti il
  // file resterebbe nell'archivio a occupare spazio per sempre.
  const { data: capo } = await supabase
    .from("items")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) {
    console.error("[items] eliminazione fallita:", error.message);
    return { ok: false, error: "Non siamo riusciti a eliminare il capo." };
  }

  if (capo?.photo_path) {
    const { error: erroreFile } = await supabase.storage
      .from(BUCKET)
      .remove([capo.photo_path]);
    if (erroreFile) {
      // La riga è già sparita: per l'utente il capo non c'è più. Resta un
      // file orfano, che è un problema di pulizia, non suo.
      console.error("[items] file non rimosso:", erroreFile.message);
    }
  }

  revalidatePath("/app/armadio");
  revalidatePath("/app");
  return { ok: true };
}
