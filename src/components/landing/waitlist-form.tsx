"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { Check, CircleAlert, PartyPopper } from "lucide-react";

import { joinWaitlist } from "@/app/actions/waitlist";
import { initialWaitlistState } from "@/lib/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WaitlistForm() {
  const [state, formAction, isPending] = useActionState(
    joinWaitlist,
    initialWaitlistState
  );

  const emailId = useId();
  const consentId = useId();
  const emailErrorId = `${emailId}-errore`;
  const consentErrorId = `${consentId}-errore`;

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-7 py-12 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary">
          <PartyPopper
            className="size-7 text-primary-foreground"
            aria-hidden
            strokeWidth={2}
          />
        </span>
        <p className="font-heading text-xl font-extrabold">{state.message}</p>
        <p className="text-muted-foreground">
          Nel frattempo, inizia a pensare a quel capo che non metti da mesi.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-5 rounded-3xl border border-border bg-card p-7 sm:p-10"
    >
      {/* Esca per i bot. Nascosto agli occhi e alle tecnologie assistive,
          e fuori dall'ordine di tabulazione: un umano non lo incontra mai. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Non compilare questo campo</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={emailId} className="text-base font-bold">
          La tua email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="nome@esempio.it"
          // Rimette quello che aveva scritto: dopo un errore il campo
          // altrimenti torna vuoto e tocca ribattere l'indirizzo.
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? emailErrorId : undefined}
          className="h-12 text-base"
        />
        {state.errors?.email ? (
          <p id={emailErrorId} className="text-sm font-medium text-destructive">
            {state.errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="relative mt-0.5 flex">
            <input
              id={consentId}
              name="consent"
              type="checkbox"
              required
              defaultChecked={state.values?.consent}
              aria-invalid={Boolean(state.errors?.consent)}
              aria-describedby={
                state.errors?.consent ? consentErrorId : undefined
              }
              className="peer size-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border-2 border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            {/* Spunta scura sul giallo. Il bianco qui darebbe 1,6:1. */}
            <Check
              aria-hidden
              strokeWidth={3.5}
              className="pointer-events-none absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100"
            />
          </span>
          {/* `block` serve a scavalcare il `flex` che Label porta di suo:
              da flex container, il link della privacy diventerebbe un
              elemento a sé invece di scorrere dentro la frase. */}
          <Label
            htmlFor={consentId}
            className="block cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
          >
            Acconsento al trattamento dei miei dati per essere avvisato
            all&apos;uscita di VESTA, come descritto nella{" "}
            <Link
              href="/privacy"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              privacy policy
            </Link>
            .
          </Label>
        </div>
        {state.errors?.consent ? (
          <p
            id={consentErrorId}
            className="text-sm font-medium text-destructive"
          >
            {state.errors.consent}
          </p>
        ) : null}
      </div>

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
        {isPending ? "Un attimo…" : "Entra in lista d'attesa"}
      </Button>
    </form>
  );
}
