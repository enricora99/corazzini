import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, ItemSummary, Season, Style } from "@/lib/ai/types";

export const BUCKET = "items";

/** Durata dei collegamenti firmati alle foto. Un'ora basta a sfogliare
 *  l'armadio e non lascia in giro link che funzionano per sempre. */
const SCADENZA_FIRMA_S = 60 * 60;

export type Capo = {
  id: string;
  user_id: string;
  photo_path: string;
  category: Category;
  subcategory: string | null;
  colors: string[];
  seasons: Season[];
  style: Style | null;
  warmth: number | null;
  notes: string | null;
  created_at: string;
};

export type CapoConFoto = Capo & {
  /** Collegamento firmato, a scadenza. Il bucket è privato: senza firma
   *  nessuno vede niente, nemmeno chi conosce il percorso. */
  photoUrl: string | null;
  /** Valorizzato solo per i capi degli amici. */
  ownerName?: string | null;
};

const CAMPI =
  "id, user_id, photo_path, category, subcategory, colors, seasons, style, warmth, notes, created_at";

/**
 * Aggiunge i collegamenti firmati a una lista di capi.
 *
 * Una sola chiamata per tutti invece di una per capo: con trenta capi
 * sarebbero trenta viaggi di rete e una griglia che si popola a singhiozzo.
 */
async function conFirme(
  supabase: Awaited<ReturnType<typeof createClient>>,
  capi: Capo[]
): Promise<CapoConFoto[]> {
  if (capi.length === 0) return [];

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      capi.map((capo) => capo.photo_path),
      SCADENZA_FIRMA_S
    );

  if (error) {
    console.error("[items] firma dei collegamenti fallita:", error.message);
    return capi.map((capo) => ({ ...capo, photoUrl: null }));
  }

  const perPercorso = new Map(
    (data ?? []).map((riga) => [riga.path, riga.signedUrl])
  );

  return capi.map((capo) => ({
    ...capo,
    photoUrl: perPercorso.get(capo.photo_path) ?? null,
  }));
}

export async function getMieiCapi(userId: string): Promise<CapoConFoto[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select(CAMPI)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[items] lettura fallita:", error.message);
    return [];
  }

  return conFirme(supabase, (data ?? []) as Capo[]);
}

/**
 * I capi degli amici.
 *
 * Non filtriamo per amicizia qui: ci pensa la policy di lettura su `items`,
 * che usa `are_friends()`. Chiediamo tutto quello che non è nostro e il
 * database restituisce solo ciò che abbiamo il diritto di vedere. Se domani
 * qualcuno sbaglia una query, la RLS regge comunque.
 */
export async function getCapiAmici(userId: string): Promise<CapoConFoto[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select(`${CAMPI}, profiles!items_user_id_fkey (display_name, email)`)
    .neq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[items] lettura dei capi degli amici fallita:", error.message);
    return [];
  }

  type Riga = Capo & {
    profiles: { display_name: string | null; email: string } | null;
  };

  const righe = (data ?? []) as unknown as Riga[];
  const conFoto = await conFirme(
    supabase,
    righe.map((riga) => ({
      id: riga.id,
      user_id: riga.user_id,
      photo_path: riga.photo_path,
      category: riga.category,
      subcategory: riga.subcategory,
      colors: riga.colors,
      seasons: riga.seasons,
      style: riga.style,
      warmth: riga.warmth,
      notes: riga.notes,
      created_at: riga.created_at,
    }))
  );

  return conFoto.map((capo, indice) => {
    const profilo = righe[indice]?.profiles;
    return {
      ...capo,
      ownerName:
        profilo?.display_name?.trim() ||
        profilo?.email.split("@")[0] ||
        "un amico",
    };
  });
}

/** Riduce i capi a quello che si può mandare a un modello: metadati, mai foto. */
export function soloMetadati(capi: CapoConFoto[]): ItemSummary[] {
  return capi.map((capo) => ({
    id: capo.id,
    category: capo.category,
    subcategory: capo.subcategory,
    colors: capo.colors,
    seasons: capo.seasons,
    style: capo.style,
    warmth: capo.warmth,
    ownerName: capo.ownerName ?? null,
  }));
}
