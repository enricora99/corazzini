"use client";

import { useActionState, useId } from "react";
import { CircleAlert } from "lucide-react";

import { confermaMaggiorenne } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { CheckField } from "@/components/ui/check-field";
import { statoIniziale } from "@/lib/form-state";

export function AdultGateForm() {
  const [state, formAction, isPending] = useActionState(
    confermaMaggiorenne,
    statoIniziale
  );
  const adultId = useId();

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-3xl border border-border bg-card p-7 sm:p-10"
    >
      <CheckField id={adultId} name="adult" error={state.errors?.adult}>
        Confermo di avere almeno 18 anni.
      </CheckField>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-13 w-full text-base font-bold"
      >
        {isPending ? "Un attimo…" : "Continua"}
      </Button>
    </form>
  );
}
