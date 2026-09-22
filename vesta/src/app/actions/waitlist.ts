"use server";

import { waitlistSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT_EMAIL } from "@/lib/site";
import type { WaitlistState } from "@/lib/waitlist";

export async function joinWaitlist(
  _previous: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  // Campo esca: è nascosto, un essere umano non lo vede e non lo compila.
  // Se arriva pieno è un bot: rispondiamo come se fosse andata bene, così
  // non impara nulla, ma non scriviamo niente.
  if (formData.get("website")) {
    return { status: "success", message: "Ci siamo, ti scriviamo noi." };
  }

  const rawEmail = formData.get("email");
  const consent = formData.get("consent") === "on";

  // Da rimandare al form se qualcosa non va, per non fargli riscrivere tutto.
  const values = {
    email: typeof rawEmail === "string" ? rawEmail : undefined,
    consent,
  };

  const parsed = waitlistSchema.safeParse({ email: rawEmail, consent });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      errors: {
        email: flat.email?.[0],
        consent: flat.consent?.[0],
      },
      values,
    };
  }

  const supabase = createAdminClient();

  if (!supabase) {
    // Supabase non è ancora configurato. Non fingiamo un successo: chi ha
    // lasciato l'email crederebbe di essere in lista senza esserci.
    console.error(
      "[waitlist] Supabase non configurato: manca NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
    return {
      status: "error",
      message: `Non riusciamo a registrarti in questo momento. Scrivici a ${CONTACT_EMAIL} e ti mettiamo in lista a mano.`,
      values,
    };
  }

  const { error } = await supabase.from("waitlist").upsert(
    {
      email: parsed.data.email,
      consent: true,
      consent_at: new Date().toISOString(),
      source: "landing",
    },
    { onConflict: "email", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[waitlist]", error.message);
    return {
      status: "error",
      message: `Qualcosa è andato storto. Riprova, o scrivici a ${CONTACT_EMAIL}.`,
      values,
    };
  }

  // Stessa risposta anche se l'indirizzo era già in lista: dire "sei già
  // iscritto" permetterebbe a chiunque di scoprire chi si è registrato.
  return {
    status: "success",
    message: "Ci sei. Ti scriviamo appena VESTA è pronta.",
  };
}
