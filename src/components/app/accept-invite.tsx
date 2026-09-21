"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { accettaInvito } from "@/app/actions/friends";
import { Button } from "@/components/ui/button";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [inCorso, startTransition] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);

  function accetta() {
    setErrore(null);
    startTransition(async () => {
      const esito = await accettaInvito(token);
      if (esito.ok) {
        toast.success("Siete amici. Buon prestito.");
        router.push("/app/amici");
        router.refresh();
      } else {
        setErrore(esito.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {errore ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errore}
        </p>
      ) : null}

      <Button
        onClick={accetta}
        disabled={inCorso}
        size="lg"
        className="h-13 w-full gap-2 text-base font-bold"
      >
        <UserPlus className="size-5" aria-hidden strokeWidth={2} />
        {inCorso ? "Un attimo…" : "Accetta l'invito"}
      </Button>
    </div>
  );
}
