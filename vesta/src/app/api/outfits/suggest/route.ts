import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { textProvider } from "@/lib/ai";
import { conRegistro } from "@/lib/ai/log";
import { AiError } from "@/lib/ai/types";
import { richiediSessione } from "@/lib/dal";
import { getCapiAmici, getMieiCapi, soloMetadati, type CapoConFoto } from "@/lib/items";
import { occasionSchema } from "@/lib/schemas";
import { getMeteo } from "@/lib/weather";

/**
 * Tre proposte di outfit.
 *
 * Al modello arrivano solo i metadati dei capi, mai le fotografie: è quello
 * che promette l'informativa privacy, ed è anche molto più economico.
 */

/** Sotto questa soglia non c'è niente da comporre, e mandare comunque la
 *  richiesta significa pagare una chiamata per ricevere un no. */
const CAPI_MINIMI = 3;

const corpo = z.object({
  occasion: occasionSchema,
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  includeFriends: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const sessione = await richiediSessione();

  const parsed = corpo.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { occasion, lat, lon, includeFriends } = parsed.data;

  const miei = await getMieiCapi(sessione.userId);
  const amici = includeFriends ? await getCapiAmici(sessione.userId) : [];
  const disponibili = [...miei, ...amici];

  if (miei.length < CAPI_MINIMI) {
    return NextResponse.json(
      {
        error: `Servono almeno ${CAPI_MINIMI} capi nel tuo armadio. Aggiungine qualcuno e torna qui.`,
      },
      { status: 422 }
    );
  }

  const weather =
    lat !== undefined && lon !== undefined ? await getMeteo(lat, lon) : null;

  const provider = textProvider();

  try {
    const proposte = await conRegistro(
      {
        userId: sessione.userId,
        provider: provider.provider,
        model: provider.model,
        kind: "suggestion",
      },
      async () => {
        const esito = await provider.suggest({
          items: soloMetadati(disponibili),
          occasion,
          weather,
        });
        return { data: esito.data, usage: esito.usage };
      }
    );

    // Il modello può citare un id che non esiste, o ripetere lo stesso capo.
    // Ricostruiamo ogni proposta dai capi veri e scartiamo quelle che non
    // stanno in piedi, invece di mostrare una griglia con dei buchi.
    const perId = new Map(disponibili.map((capo) => [capo.id, capo]));

    const valide = proposte
      .map((proposta) => {
        const capi = [...new Set(proposta.itemIds)]
          .map((id) => perId.get(id))
          .filter((capo): capo is CapoConFoto => Boolean(capo));

        return { capi, rationale: proposta.rationale };
      })
      .filter((proposta) => proposta.capi.length >= 2);

    if (valide.length === 0) {
      return NextResponse.json(
        { error: "Il modello non è riuscito a comporre nulla di sensato. Riprova." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      weather,
      suggestions: valide.map((proposta) => ({
        rationale: proposta.rationale,
        items: proposta.capi.map((capo) => ({
          id: capo.id,
          label: capo.subcategory || capo.category,
          photoUrl: capo.photoUrl,
          ownerName: capo.ownerName ?? null,
        })),
      })),
    });
  } catch (errore) {
    if (errore instanceof AiError) {
      return NextResponse.json({ error: errore.message }, { status: 502 });
    }
    console.error("[api/outfits/suggest]", errore);
    return NextResponse.json(
      { error: "Non siamo riusciti a comporre gli outfit. Riprova." },
      { status: 500 }
    );
  }
}
