"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { CircleAlert, MailCheck } from "lucide-react";

import { inviaLinkAccesso } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { CheckField } from "@/components/ui/check-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statoIniziale } from "@/lib/form-state";

export function LoginForm({ prossima }: { prossima: string }) {
  const [state, formAction, isPending] = useActionState(
    inviaLinkAccesso,
    statoIniziale
  );

  const emailId = useId();
  const adultId = useId();
  const emailErrorId = `${emailId}-errore`;

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-7 py-12 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary">
          <MailCheck
            className="size-7 text-primary-foreground"
            aria-hidden
            strokeWidth={2}
          />
        </span>
        <h2 className="font-heading text-xl font-extrabold">
          Guarda la tua email
        </h2>
        <p className="text-muted-foreground text-pretty">
          Abbiamo mandato un link a{" "}
          <strong className="text-foreground">{state.message}</strong>. Aprilo
          da questo stesso dispositivo: è lì che sei già a metà dell&apos;accesso.
        </p>
        <p className="text-sm text-muted-foreground">
          Non arriva? Controlla lo spam, poi riprova tra un minuto.
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
      <input type="hidden" name="prossima" value={prossima} />

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
          autoFocus
          placeholder="nome@esempio.it"
          defaultValue={
            typeof state.values?.email === "string"
              ? state.values.email
              : undefined
          }
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? emailErrorId : undefined}
          className="h-12 text-base"
        />
        {state.errors?.email ? (
          <p id={emailErrorId} className="text-sm font-medium text-destructive">
            {state.errors.email}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Niente password: ti mandiamo un link e sei dentro.
        </p>
      </div>

      <CheckField
        id={adultId}
        name="adult"
        defaultChecked={state.values?.adult === true}
        error={state.errors?.adult}
      >
        Confermo di avere almeno 18 anni e accetto la{" "}
        <Link
          href="/privacy"
          className="font-semibold text-foreground underline underline-offset-4"
        >
          privacy policy
        </Link>
        .
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
        {isPending ? "Un attimo…" : "Mandami il link"}
      </Button>
    </form>
  );
}
