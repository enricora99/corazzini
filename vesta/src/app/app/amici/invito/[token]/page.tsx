import type { Metadata } from "next";
import { Users } from "lucide-react";

import { AcceptInvite } from "@/components/app/accept-invite";
import { richiediUtenteMaggiorenne } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Invito",
  robots: { index: false, follow: false },
};

export default async function InvitoPage({
  params,
}: PageProps<"/app/amici/invito/[token]">) {
  const { token } = await params;

  // Chi non è ancora dentro passa prima dall'accesso e torna qui: il
  // percorso corrente viaggia in "prossima".
  await richiediUtenteMaggiorenne(`/app/amici/invito/${token}`);

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary">
        <Users className="size-8 text-primary-foreground" aria-hidden strokeWidth={2} />
      </span>

      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-balance">
          Ti hanno invitato su VESTA
        </h1>
        <p className="max-w-sm text-muted-foreground text-pretty">
          Accettando vedrete i vostri armadi a vicenda, in sola lettura, e
          potrete prendervi in prestito i capi. Nessuno dei due può modificare
          le cose dell&apos;altro.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <AcceptInvite token={token} />
      </div>
    </div>
  );
}
