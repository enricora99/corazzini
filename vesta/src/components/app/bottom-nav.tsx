"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, Shirt, Sparkles, Users } from "lucide-react";

/**
 * Barra di navigazione, con il pulsante di aggiunta al centro.
 *
 * Il tasto centrale rialzato non è un vezzo: l'azione che fa vivere l'app è
 * aggiungere un capo, e metterla fra le voci normali la renderebbe una delle
 * cinque. Lì in mezzo, più grande e di un altro colore, è l'unica cosa che
 * si tocca senza cercarla.
 *
 * `base` esiste perché la demo vive sotto /demo e riusa questa stessa barra:
 * così chi la guarda vede la navigazione vera dell'app, non una copia.
 */

const SINISTRA = [
  { segmento: "", label: "Home", icon: House },
  { segmento: "/armadio", label: "Armadio", icon: Shirt },
] as const;

const DESTRA = [
  { segmento: "/outfit", label: "Outfit", icon: Sparkles },
  { segmento: "/amici", label: "Amici", icon: Users },
] as const;

export function BottomNav({ base = "/app" }: { base?: string }) {
  const pathname = usePathname();

  function attiva(segmento: string) {
    const href = `${base}${segmento}`;
    if (segmento === "") return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Sezioni dell'app"
      // pb con safe-area: sugli iPhone la barra gesti coprirebbe le voci.
      className="sticky bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch">
        {SINISTRA.map((v) => (
          <VoceNav key={v.label} {...v} base={base} attiva={attiva(v.segmento)} />
        ))}

        <li className="flex flex-1 items-center justify-center">
          <Link
            href={`${base}/armadio?aggiungi=1`}
            aria-label="Aggiungi un capo"
            className="-mt-5 flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Plus className="size-7" aria-hidden strokeWidth={2.5} />
          </Link>
        </li>

        {DESTRA.map((v) => (
          <VoceNav key={v.label} {...v} base={base} attiva={attiva(v.segmento)} />
        ))}
      </ul>
    </nav>
  );
}

function VoceNav({
  segmento,
  label,
  icon: Icona,
  base,
  attiva,
}: {
  segmento: string;
  label: string;
  icon: typeof House;
  base: string;
  attiva: boolean;
}) {
  return (
    <li className="flex-1">
      <Link
        href={`${base}${segmento}`}
        aria-current={attiva ? "page" : undefined}
        className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <Icona
          aria-hidden
          strokeWidth={attiva ? 2.5 : 2}
          className={attiva ? "size-5 text-foreground" : "size-5 text-muted-foreground"}
        />
        <span className={attiva ? "text-foreground" : "text-muted-foreground"}>
          {label}
        </span>
        {/* Il colore da solo non basta a dire quale scheda è attiva:
            chi non distingue i toni ha bisogno anche della barretta. */}
        <span
          aria-hidden
          className={`h-0.5 w-5 rounded-full ${attiva ? "bg-primary" : "bg-transparent"}`}
        />
      </Link>
    </li>
  );
}
