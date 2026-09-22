import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { imageProvider, latoImmagine } from "@/lib/ai";
import { conRegistro } from "@/lib/ai/log";
import { AiError } from "@/lib/ai/types";
import { richiediSessione } from "@/lib/dal";
import { getCapiAmici, getMieiCapi, soloMetadati } from "@/lib/items";
import { chiaveCache, controllaQuotaImmagini } from "@/lib/quota";
import { occasionSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * Genera l'immagine di un outfit, o la ripesca dalla cache.
 *
 * L'ordine dei controlli non è casuale: prima la cache, poi la quota. Una
 * richiesta già vista non consuma quota, perché non costa nulla.
 */

const BUCKET = "outfits";
const SCADENZA_FIRMA_S = 60 * 60;

const corpo = z.object({
  itemIds: z.array(z.uuid()).min(2).max(6),
  occasion: occasionSchema,
});

export async function POST(request: NextRequest) {
  const sessione = await richiediSessione();

  const parsed = corpo.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { itemIds, occasion } = parsed.data;
  const supabase = await createClient();
  const provider = imageProvider();

  const chiave = chiaveCache({
    itemIds,
    occasion,
    provider: provider.provider,
    model: provider.model,
  });

  // --- 1. Cache -----------------------------------------------------------
  const { data: inCache } = await supabase
    .from("outfit_images")
    .select("storage_path")
    .eq("cache_key", chiave)
    .maybeSingle();

  if (inCache?.storage_path) {
    const { data: firmato } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(inCache.storage_path, SCADENZA_FIRMA_S);

    if (firmato?.signedUrl) {
      return NextResponse.json({ imageUrl: firmato.signedUrl, cached: true });
    }
    // Riga presente ma file sparito: si rigenera, ed è giusto che consumi quota.
  }

  // --- 2. Quota -----------------------------------------------------------
  const quota = await controllaQuotaImmagini(sessione.userId);
  if (!quota.consentito) {
    return NextResponse.json(
      { error: quota.messaggio, quota: { usate: quota.usate, tetto: quota.tetto } },
      { status: 429 }
    );
  }

  // --- 3. I capi devono essere davvero accessibili a chi li chiede --------
  // Li rileggiamo attraverso la RLS invece di fidarci degli id nel corpo
  // della richiesta: senza questo passaggio, chiunque potrebbe far
  // descrivere al modello i capi di uno sconosciuto.
  const disponibili = [
    ...(await getMieiCapi(sessione.userId)),
    ...(await getCapiAmici(sessione.userId)),
  ];
  const perId = new Map(disponibili.map((capo) => [capo.id, capo]));
  const capi = itemIds.map((id) => perId.get(id)).filter((c) => c !== undefined);

  if (capi.length !== itemIds.length) {
    return NextResponse.json(
      { error: "Alcuni capi non sono più disponibili." },
      { status: 403 }
    );
  }

  // --- 4. Generazione -----------------------------------------------------
  try {
    const immagine = await conRegistro(
      {
        userId: sessione.userId,
        provider: provider.provider,
        model: provider.model,
        kind: "image",
      },
      async () => {
        const esito = await provider.generate({
          items: soloMetadati(capi),
          occasion,
          size: latoImmagine(),
        });
        return { data: esito.data, usage: esito.usage };
      }
    );

    const estensione = immagine.mimeType.includes("webp") ? "webp" : "png";
    const percorso = `${sessione.userId}/${chiave}.${estensione}`;

    const { error: erroreCaricamento } = await supabase.storage
      .from(BUCKET)
      .upload(percorso, immagine.bytes, {
        contentType: immagine.mimeType,
        upsert: true,
      });

    if (erroreCaricamento) {
      console.error("[api/outfits/image] caricamento:", erroreCaricamento.message);
      return NextResponse.json(
        { error: "Immagine generata ma non salvata. Riprova." },
        { status: 500 }
      );
    }

    // Registrata dopo il caricamento: una riga che punta a un file
    // inesistente manderebbe in cache un buco.
    await supabase.from("outfit_images").upsert(
      {
        cache_key: chiave,
        user_id: sessione.userId,
        storage_path: percorso,
        provider: provider.provider,
        model: provider.model,
      },
      { onConflict: "cache_key" }
    );

    const { data: firmato } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(percorso, SCADENZA_FIRMA_S);

    return NextResponse.json({
      imageUrl: firmato?.signedUrl ?? null,
      cached: false,
      quota: { usate: quota.usate + 1, tetto: quota.tetto },
    });
  } catch (errore) {
    if (errore instanceof AiError) {
      return NextResponse.json({ error: errore.message }, { status: 502 });
    }
    console.error("[api/outfits/image]", errore);
    return NextResponse.json(
      { error: "Non siamo riusciti a generare l'immagine." },
      { status: 500 }
    );
  }
}
