"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shirt, Sparkles, Users } from "lucide-react";

const VOCI = [
  { segmento: "/armadio", label: "Armadio", icon: Shirt },
  { segmento: "/outfit", label: "Outfit", icon: Sparkles },
  { segmento: "/amici", label: "Amici", icon: Users },
  { segmento: "/impostazioni", label: "Impostazioni", icon: Settings },
] as const;

/**
 * `base` esiste perché la modalità demo vive sotto /demo e riusa questa
 * stessa barra: così chi la guarda vede la navigazione vera dell'app, non
 * una copia che può divergere.
 */
export function BottomNav({ base = "/app" }: { base?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni dell'app"
      // pb con safe-area: sugli iPhone la barra gesti coprirebbe le voci.
      className="sticky bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch">
        {VOCI.map((voce) => {
          const href = `${base}${voce.segmento}`;
          const attiva = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={attiva ? "page" : undefined}
                className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <voce.icon
                  aria-hidden
                  strokeWidth={attiva ? 2.5 : 2}
                  className={
                    attiva ? "size-6 text-foreground" : "size-6 text-muted-foreground"
                  }
                />
                <span className={attiva ? "text-foreground" : "text-muted-foreground"}>
                  {voce.label}
                </span>
                {/* Il colore da solo non basta a dire quale scheda è attiva:
                    chi non distingue i toni ha bisogno anche della barretta. */}
                <span
                  aria-hidden
                  className={`h-0.5 w-6 rounded-full ${attiva ? "bg-primary" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
