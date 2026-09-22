import "server-only";

import { CATEGORIES, type Category } from "@/lib/ai/types";
import { getMieiCapi, type CapoConFoto } from "@/lib/items";
import { createClient } from "@/lib/supabase/server";
import type { StatisticheArmadio } from "@/components/app/wardrobe-stats";

/**
 * I numeri dell'armadio di un utente.
 *
 * Il dato che conta è quanti capi non sono mai finiti in un outfit: è la
 * misura diretta della promessa di VESTA, «usare di più i vestiti che hai
 * già». Se quel numero cala nel tempo, l'app sta funzionando.
 *
 * `item_ids` è un array nella riga dell'outfit, non una tabella di
 * collegamento: contare gli usi vuol dire scorrere gli outfit in memoria.
 * Con i numeri di un armadio personale — decine di capi, centinaia di
 * outfit — è più veloce di una join, e non serve una seconda tabella.
 */
export async function getStatistiche(
  userId: string
): Promise<StatisticheArmadio> {
  const supabase = await createClient();
  const capi = await getMieiCapi(userId);

  const { data: outfit, error } = await supabase
    .from("outfits")
    .select("item_ids, saved")
    .eq("user_id", userId);

  if (error) {
    console.error("[statistiche] lettura degli outfit fallita:", error.message);
  }

  const righe = (outfit ?? []) as { item_ids: string[]; saved: boolean }[];

  const usi = new Map<string, number>();
  for (const riga of righe) {
    for (const id of riga.item_ids ?? []) {
      usi.set(id, (usi.get(id) ?? 0) + 1);
    }
  }

  const maiUsati = capi.filter((c) => !usi.has(c.id));

  let piuUsato: { capo: CapoConFoto; volte: number } | null = null;
  for (const capo of capi) {
    const volte = usi.get(capo.id) ?? 0;
    if (volte > (piuUsato?.volte ?? 0)) piuUsato = { capo, volte };
  }

  const perCategoria = CATEGORIES.map((categoria: Category) => ({
    categoria,
    quanti: capi.filter((c) => c.category === categoria).length,
  }));

  return {
    totale: capi.length,
    perCategoria,
    maiUsati,
    piuUsato,
    outfitSalvati: righe.filter((r) => r.saved).length,
  };
}

export type GiornoPianificato = {
  giorno: number;
  anteprime: string[];
  etichetta: string;
};

/**
 * Gli outfit pianificati in un mese.
 *
 * Si guarda `planned_for` se c'è, altrimenti il giorno in cui l'outfit è
 * stato salvato: così il calendario ha qualcosa da mostrare anche a chi non
 * ha ancora usato la pianificazione, invece di una griglia vuota che sembra
 * una funzione rotta.
 */
export async function getMesePianificato(
  userId: string,
  anno: number,
  mese: number
): Promise<GiornoPianificato[]> {
  const supabase = await createClient();

  const primo = new Date(anno, mese, 1);
  const ultimo = new Date(anno, mese + 1, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from("outfits")
    .select("occasion, item_ids, planned_for, created_at")
    .eq("user_id", userId)
    .eq("saved", true)
    .or(
      `planned_for.gte.${primo.toISOString().slice(0, 10)},created_at.gte.${primo.toISOString()}`
    )
    .lte("created_at", ultimo.toISOString());

  if (error) {
    console.error("[calendario] lettura fallita:", error.message);
    return [];
  }

  const capi = await getMieiCapi(userId);
  const perId = new Map(capi.map((c) => [c.id, c]));

  const righe = (data ?? []) as {
    occasion: string;
    item_ids: string[];
    planned_for: string | null;
    created_at: string;
  }[];

  return righe
    .map((r) => {
      const quando = r.planned_for
        ? new Date(`${r.planned_for}T12:00:00`)
        : new Date(r.created_at);

      if (quando.getFullYear() !== anno || quando.getMonth() !== mese) {
        return null;
      }

      return {
        giorno: quando.getDate(),
        etichetta: r.occasion,
        anteprime: (r.item_ids ?? [])
          .map((id) => perId.get(id)?.photoUrl)
          .filter((u): u is string => Boolean(u)),
      };
    })
    .filter((g): g is GiornoPianificato => g !== null);
}
