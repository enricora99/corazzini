"use client";

import { useActionState, useId } from "react";
import { CircleAlert, KeyRound } from "lucide-react";

import { verificaCodice } from "@/app/actions/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statoIniziale } from "@/lib/form-state";

/**
 * Il form del cancello.
 *
 * I colori arrivano dalle variabili CSS che la pagina imposta sul
 * contenitore, così lo stesso componente serve sia il portale di chi ospita
 * l'app sia quello di VESTA, senza sapere nulla né dell'uno né dell'altro.
 */
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
      className="space-y-5 rounded-2xl border border-[#DEE6EC] bg-white p-6 shadow-[0_1px_2px_rgba(12,35,47,.05)] sm:p-8"
    >
      <input type="hidden" name="prossima" value={prossima} />

      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-bold text-[#16313F]">
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
          className="h-12 border-[#C5D4DF] text-base"
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
        // `portale-azione` sostituisce il gradiente giallo predefinito del
        // pulsante con quello del portale, quando ce n'è uno configurato.
        className="portale-azione h-12 w-full gap-2 rounded-full text-base font-bold"
      >
        <KeyRound className="size-5" aria-hidden strokeWidth={2} />
        {isPending ? "Verifico…" : "Entra"}
      </Button>
    </form>
  );
}
