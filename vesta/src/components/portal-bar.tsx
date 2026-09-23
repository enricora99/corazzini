"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { esciDallArea } from "@/app/actions/access";

/**
 * La striscia del portale che ospita il progetto.
 *
 * Non appartiene a VESTA: appartiene all'area riservata che le sta davanti.
 * Dice dove ti trovi e ti fa uscire, e ogni altro progetto che finirà dietro
 * lo stesso cancello monta questo stesso componente — così l'uscita sta
 * sempre nello stesso posto invece di essere reinventata ogni volta.
 *
 * Compare solo quando un cancello c'è davvero: nel progetto scaricato, senza
 * codici configurati, un pulsante «esci» non avrebbe da dove uscire.
 */
export function PortalBar({
  attiva,
  marchio,
}: {
  attiva: boolean;
  marchio: string;
}) {
  const percorso = usePathname();

  // Sul cancello stesso non ha senso: si è già fuori.
  if (!attiva || percorso === "/accesso") return null;

  return (
    <div className="border-b border-[#DEE6EC] bg-[#F4F7F9]">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-5 py-1.5">
        <p className="flex-1 truncate text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#607180]">
          {marchio}
        </p>

        <form action={esciDallArea}>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[#16313F] underline-offset-4 hover:underline"
          >
            <LogOut className="size-3.5" aria-hidden strokeWidth={2.5} />
            Esci
          </button>
        </form>
      </div>
    </div>
  );
}
