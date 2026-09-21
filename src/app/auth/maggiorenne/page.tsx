import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdultGateForm } from "@/components/auth/adult-gate-form";
import { getProfilo, richiediSessione } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Conferma l'età",
  robots: { index: false, follow: false },
};

export default async function MaggiorennePage() {
  await richiediSessione("/auth/maggiorenne");

  // Chi ha già confermato non deve rifarlo a ogni accesso.
  const profilo = await getProfilo();
  if (profilo?.adult_confirmed_at) redirect("/app");

  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          Ancora una cosa
        </h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          VESTA è riservata ai maggiorenni. Te lo chiediamo una volta sola.
        </p>
      </div>

      <AdultGateForm />
    </>
  );
}
