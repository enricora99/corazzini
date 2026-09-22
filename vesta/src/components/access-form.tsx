"use client";

import { useActionState, useId } from "react";
import { CircleAlert, KeyRound } from "lucide-react";

import { verificaCodice } from "@/app/actions/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statoIniziale } from "@/lib/form-state";

export function AccessForm({ prossima }: { prossima: string }) {
  const [state, formAction, isPending] = useActionState(
    verificaCodice,
    statoIniziale
  );
  const id = useId();
  const errorId = `${id}-errore`;

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-3xl border border-border bg-card p-7 sm:p-10"
    >
      <input type="hidden" name="prossima" value={prossima} />

      <div className="space-y-2">
        <Label htmlFor={id} className="text-base font-bold">
          Codice d&apos;invito
        </Label>
        <Input
          id={id}
          name="codice"
          type="text"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(state.errors?.codice)}
          aria-describedby={state.errors?.codice ? errorId : undefined}
          className="h-12 text-base"
        />
        {state.errors?.codice ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-start gap-2 text-sm font-medium text-destructive"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.errors.codice}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-13 w-full gap-2 text-base font-bold"
      >
        <KeyRound className="size-5" aria-hidden strokeWidth={2} />
        {isPending ? "Verifico…" : "Entra"}
      </Button>
    </form>
  );
}
