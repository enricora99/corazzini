import Link from "next/link";
import type { Metadata } from "next";

import { SettingsPanel } from "@/components/app/settings-panel";
import { isAmministratore, richiediUtenteMaggiorenne } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Impostazioni",
  robots: { index: false, follow: false },
};

export default async function ImpostazioniPage() {
  const { profilo } = await richiediUtenteMaggiorenne("/app/impostazioni");
  const amministratore = await isAmministratore();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Impostazioni
        </h1>
      </header>

      <SettingsPanel email={profilo.email} />

      {amministratore ? (
        <Link
          href="/admin"
          className="block text-center text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          Pannello di amministrazione
        </Link>
      ) : null}

      <nav aria-label="Note legali">
        <ul className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <li>
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/cookie" className="underline underline-offset-4">
              Cookie
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
