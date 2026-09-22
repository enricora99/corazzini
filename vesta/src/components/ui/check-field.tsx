"use client";

import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";

/**
 * Casella di spunta con etichetta.
 *
 * È una `<input type="checkbox">` nativa e non la versione di Radix, per due
 * motivi: funziona anche senza JavaScript, quindi i form con server action
 * restano usabili, e l'etichetta resta testo scorrevole dentro cui si possono
 * infilare dei collegamenti.
 */
export function CheckField({
  id,
  name,
  defaultChecked,
  error,
  children,
}: {
  id: string;
  name: string;
  defaultChecked?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-errore`;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex">
          <input
            id={id}
            name={name}
            type="checkbox"
            required
            defaultChecked={defaultChecked}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="peer size-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border-2 border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {/* Spunta scura sul giallo: in bianco darebbe 1,6:1. */}
          <Check
            aria-hidden
            strokeWidth={3.5}
            className="pointer-events-none absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 peer-checked:opacity-100"
          />
        </span>
        {/* `block` scavalca il `flex` che Label porta di suo, altrimenti i
            link dentro l'etichetta diventano elementi a sé. */}
        <Label
          htmlFor={id}
          className="block cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
        >
          {children}
        </Label>
      </div>
      {error ? (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
