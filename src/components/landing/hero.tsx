import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Macchia gialla decorativa, tenuta bassa di proposito: più carica di
          così, il logo (che è giallo anche lui) ci si perde dentro.
          aria-hidden perché non racconta nulla. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-5xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/vesta-logo-alpha.png"
            alt="VESTA"
            width={96}
            height={96}
            // È l'immagine più grande sopra la piega: caricarla per prima
            // migliora il tempo di disegno del contenuto principale.
            priority
            className="h-20 w-20 sm:h-24 sm:w-24"
          />

          {/* Il claim, nel peso che il brand gli assegna: 700 corsivo. */}
          <h1 className="mt-7 font-heading text-4xl font-bold italic leading-[1.05] tracking-tight text-balance sm:text-6xl">
            Da 15 minuti a 5 secondi
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
            L&apos;app che sceglie l&apos;outfit con i vestiti che hai già.
          </p>

          <Button
            asChild
            size="lg"
            className="mt-9 h-13 w-full max-w-xs text-base font-bold"
          >
            <Link href="#lista">Entra in lista d&apos;attesa</Link>
          </Button>

          {/* Secondaria di proposito: chi è già convinto lascia l'email,
              chi vuole capire prima va a vedere. Nessuna delle due strade
              chiede di registrarsi. */}
          <Link
            href="/demo"
            // Next precarica da solo i link che entrano nello schermo. Questo
            // sta sopra la piega, quindi tirerebbe giù tutta la pagina /demo
            // mentre la home deve ancora disegnarsi — e la maggioranza di chi
            // arriva qui non ci clicca. La demo è statica: anche senza
            // precarico si apre subito.
            prefetch={false}
            className="mt-4 rounded-md px-3 py-2 text-base font-semibold text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Guarda com&apos;è fatta, senza registrarti
          </Link>
        </div>
      </div>
    </section>
  );
}
