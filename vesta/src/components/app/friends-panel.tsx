"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Link2, Share2, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";

import { creaInvito, rimuoviAmicizia } from "@/app/actions/friends";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Amico, InvitoInSospeso } from "@/lib/friends";

export function FriendsPanel({
  amici,
  inviti,
  origine,
}: {
  amici: Amico[];
  inviti: InvitoInSospeso[];
  origine: string;
}) {
  const router = useRouter();
  const [inCorso, startTransition] = useTransition();
  const [daRimuovere, setDaRimuovere] = useState<Amico | null>(null);

  function linkDi(token: string) {
    return `${origine}/app/amici/invito/${token}`;
  }

  function nuovoInvito() {
    startTransition(async () => {
      const esito = await creaInvito();
      if (!esito.ok) {
        toast.error(esito.error);
        return;
      }
      await condividi(linkDi(esito.token));
      router.refresh();
    });
  }

  async function condividi(link: string) {
    // Su telefono apre il foglio di condivisione nativo, che è il modo in cui
    // la gente manda davvero un link. Altrove ripiega sugli appunti.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Entra nel mio guardaroba su VESTA",
          text: "Guarda cosa puoi prendere in prestito.",
          url: link,
        });
        return;
      } catch {
        // Condivisione annullata: si prosegue con gli appunti.
      }
    }
    await copia(link);
  }

  async function copia(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiato.");
    } catch {
      toast.error("Non riusciamo a copiare. Selezionalo a mano.");
    }
  }

  function conferma() {
    if (!daRimuovere) return;
    const amico = daRimuovere;
    startTransition(async () => {
      const esito = await rimuoviAmicizia(amico.friendshipId);
      if (esito.ok) {
        toast.success(`Non sei più amico di ${amico.nome}.`);
        setDaRimuovere(null);
        router.refresh();
      } else {
        toast.error(esito.error);
      }
    });
  }

  return (
    <div className="space-y-7">
      <Button
        onClick={nuovoInvito}
        disabled={inCorso}
        size="lg"
        className="h-13 w-full gap-2 text-base font-bold"
      >
        <Share2 className="size-5" aria-hidden strokeWidth={2} />
        {inCorso ? "Un attimo…" : "Invita un amico"}
      </Button>

      {amici.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-extrabold">
            I tuoi amici
          </h2>
          <ul className="space-y-2">
            {amici.map((amico) => (
              <li
                key={amico.friendshipId}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-extrabold text-primary-foreground"
                >
                  {amico.nome.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {amico.nome}
                </span>
                <button
                  type="button"
                  onClick={() => setDaRimuovere(amico)}
                  aria-label={`Rimuovi ${amico.nome} dagli amici`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <UserMinus className="size-5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-12 text-center">
          <Users className="size-8 text-muted-foreground" aria-hidden strokeWidth={1.5} />
          <p className="font-heading text-lg font-extrabold">
            Nessun amico, per ora
          </p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            Mandagli il link. Quando accetta, vedrete i vostri armadi a vicenda
            e potrete prendervi in prestito i capi.
          </p>
        </div>
      )}

      {inviti.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-base font-extrabold">
            Inviti in attesa
          </h2>
          <ul className="space-y-2">
            {inviti.map((invito) => (
              <li
                key={invito.friendshipId}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <Link2 className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                  {linkDi(invito.token)}
                </span>
                <button
                  type="button"
                  onClick={() => copia(linkDi(invito.token))}
                  aria-label="Copia il link dell'invito"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Copy className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Ogni link vale per una persona sola e si consuma quando viene
            accettato.
          </p>
        </section>
      ) : null}

      {amici.length > 0 ? (
        <Button asChild variant="outline" className="h-11 w-full border-2 bg-card font-bold">
          <Link href="/app/amici/guardaroba">
            <Users className="size-4" aria-hidden />
            Guarda i loro armadi
          </Link>
        </Button>
      ) : null}

      <Dialog
        open={Boolean(daRimuovere)}
        onOpenChange={(o) => !o && setDaRimuovere(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold">
              Rimuovere {daRimuovere?.nome}?
            </DialogTitle>
            <DialogDescription>
              Non vedrete più i vostri armadi a vicenda. Potete sempre rifarlo
              con un nuovo invito.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDaRimuovere(null)}
              disabled={inCorso}
            >
              Annulla
            </Button>
            <Button variant="destructive" onClick={conferma} disabled={inCorso}>
              {inCorso ? "Rimuovo…" : "Rimuovi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
