"use client";

import { useState, useTransition } from "react";
import { CircleAlert, Download, LogOut, Trash2 } from "lucide-react";

import { cancellaAccount } from "@/app/actions/account";
import { esci } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { conBase } from "@/lib/base-path";

/** Chi cancella deve scrivere questo. Un click solo è troppo poco per
 *  un'azione che porta via anche le foto. */
const PAROLA_DI_CONFERMA = "CANCELLA";

export function SettingsPanel({ email }: { email: string }) {
  const [dialogoAperto, setDialogoAperto] = useState(false);
  const [conferma, setConferma] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, startTransition] = useTransition();

  function cancella() {
    setErrore(null);
    startTransition(async () => {
      // In caso di successo la server action reindirizza e non torna qui.
      const esito = await cancellaAccount();
      if (esito && !esito.ok) setErrore(esito.error);
    });
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-base font-extrabold">
            I tuoi dati
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Scarica tutto quello che abbiamo su di te in un file JSON: profilo,
            capi, outfit, amicizie.
          </p>
        </div>
        <Button asChild variant="outline" className="h-11 w-full gap-2 border-2 bg-background font-bold">
          {/* Link diretto e non fetch: così il browser apre la finestra di
              salvataggio da solo, anche su iOS. */}
          <a href={conBase("/api/me/export")} download>
            <Download className="size-4" aria-hidden />
            Scarica i miei dati
          </a>
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-base font-extrabold">Accesso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sei entrato come <strong className="text-foreground">{email}</strong>.
          </p>
        </div>
        <form action={esci}>
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full gap-2 border-2 bg-background font-bold"
          >
            <LogOut className="size-4" aria-hidden />
            Esci
          </Button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border-2 border-destructive/30 bg-card p-5">
        <div>
          <h2 className="font-heading text-base font-extrabold text-destructive">
            Cancella l&apos;account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Spariscono profilo, capi, outfit, amicizie e tutte le foto. Non si
            torna indietro e non possiamo recuperarli.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setDialogoAperto(true)}
          className="h-11 w-full gap-2 font-bold"
        >
          <Trash2 className="size-4" aria-hidden />
          Cancella tutto
        </Button>
      </section>

      <Dialog
        open={dialogoAperto}
        onOpenChange={(o) => {
          setDialogoAperto(o);
          if (!o) {
            setConferma("");
            setErrore(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">
              Sei sicuro?
            </DialogTitle>
            <DialogDescription>
              Stai per cancellare definitivamente il tuo account e tutte le
              foto che hai caricato. Se ti servono, scaricale prima.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="conferma-cancellazione" className="font-bold">
              Scrivi {PAROLA_DI_CONFERMA} per confermare
            </Label>
            <Input
              id="conferma-cancellazione"
              value={conferma}
              onChange={(e) => setConferma(e.target.value)}
              autoComplete="off"
              className="h-12"
            />
          </div>

          {errore ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {errore}
            </p>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogoAperto(false)}
              disabled={inCorso}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={cancella}
              disabled={inCorso || conferma !== PAROLA_DI_CONFERMA}
            >
              {inCorso ? "Cancello…" : "Cancella per sempre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
