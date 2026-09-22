"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  COOKIE_ACCESSO,
  DURATA_ACCESSO_S,
  codiceRichiesto,
} from "@/lib/access";
import type { FormState } from "@/lib/form-state";

/** Solo percorsi interni: un "prossima" arbitrario diventerebbe un
 *  reindirizzamento aperto verso un altro sito. */
function destinazioneSicura(prossima: unknown): string {
  if (typeof prossima !== "string") return "/";
  if (!prossima.startsWith("/") || prossima.startsWith("//")) return "/";
  if (prossima.startsWith("/accesso")) return "/";
  return prossima;
}

export async function verificaCodice(
  _previous: FormState,
  formData: FormData
): Promise<FormState> {
  const atteso = codiceRichiesto();

  // Protezione spenta: non c'è niente da verificare.
  if (!atteso) redirect("/");

  const inserito = String(formData.get("codice") ?? "").trim();

  if (inserito !== atteso) {
    // Nessun dettaglio sul perché: sbagliato è sbagliato.
    return {
      status: "error",
      errors: { codice: "Codice non valido." },
    };
  }

  const store = await cookies();
  store.set(COOKIE_ACCESSO, atteso, {
    // Fuori dalla portata di qualsiasi script nella pagina.
    httpOnly: true,
    // In sviluppo si lavora in HTTP, e con secure il cookie non verrebbe
    // mai scritto: il cancello resterebbe chiuso per sempre in locale.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURATA_ACCESSO_S,
  });

  redirect(destinazioneSicura(formData.get("prossima")));
}
