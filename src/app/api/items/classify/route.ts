import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { textProvider } from "@/lib/ai";
import { conRegistro } from "@/lib/ai/log";
import { AiError } from "@/lib/ai/types";
import { getSessione } from "@/lib/dal";

/**
 * Classifica la foto di un capo.
 *
 * Riceve l'immagine, la gira al modello, restituisce gli attributi. Non
 * salva niente: l'utente deve poter correggere prima che finisca nel
 * database, come chiede la specifica.
 *
 * La chiave del modello vive solo qui, lato server. Il browser non la vede
 * mai: non ha il prefisso NEXT_PUBLIC_, quindi nel bundle è `undefined`.
 */

const corpo = z.object({
  // ~2,7 MB di base64 ≈ 2 MB di immagine. Il client ridimensiona a 1024px
  // di lato, quindi in pratica siamo sotto i 200 KB: questo è solo un
  // paracadute contro richieste gonfiate ad arte.
  imageBase64: z.string().min(32).max(2_800_000),
  mimeType: z.enum(["image/webp", "image/jpeg", "image/png"]),
});

export async function POST(request: NextRequest) {
  const sessione = await getSessione();
  if (!sessione) {
    return NextResponse.json({ error: "Devi aver effettuato l'accesso." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = corpo.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Immagine non valida o troppo grande." },
      { status: 400 }
    );
  }

  const provider = textProvider();

  try {
    const attributi = await conRegistro(
      {
        userId: sessione.userId,
        provider: provider.provider,
        model: provider.model,
        kind: "classification",
      },
      async () => {
        const esito = await provider.classify({
          imageBase64: parsed.data.imageBase64,
          mimeType: parsed.data.mimeType,
        });
        return { data: esito.data, usage: esito.usage };
      }
    );

    return NextResponse.json({ attributes: attributi });
  } catch (errore) {
    // AiError porta un messaggio già scritto per essere letto da una persona.
    // Qualsiasi altro errore no: di quello mostriamo una frase generica e
    // teniamo i dettagli nei log del server.
    if (errore instanceof AiError) {
      return NextResponse.json({ error: errore.message }, { status: 502 });
    }
    console.error("[api/items/classify]", errore);
    return NextResponse.json(
      { error: "Non siamo riusciti a riconoscere il capo. Compila i campi a mano." },
      { status: 500 }
    );
  }
}
