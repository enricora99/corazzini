"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  COOKIE_ACCESSO,
  DURATA_ACCESSO_S,
  codiceCorretto,
  protezioneAttiva,
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
  // Protezione spenta: non c'è niente da verificare.
  if (!protezioneAttiva()) redirect("/");

  const inserito = String(formData.get("codice") ?? "");
  const riconosciuto = codiceCorretto(inserito);

  if (!riconosciuto) {
    // Nessun dettaglio sul perché: sbagliato è sbagliato.
    return {
      status: "error",
      errors: { codice: "Codice non valido." },
    };
  }

  const store = await cookies();

  // Nel cookie finisce il codice come è scritto nella configurazione, non
  // come l'ha battuto l'utente: così, con codici diversi per persona, dal
  // cookie si capisce chi è entrato senza doverglielo chiedere.
  store.set(COOKIE_ACCESSO, riconosciuto, {
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
