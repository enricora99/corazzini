import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sei offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/brand/vesta-logo-alpha.png"
        alt=""
        width={72}
        height={72}
        className="opacity-40"
      />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-extrabold">
          Sei senza connessione
        </h1>
        <p className="max-w-sm text-muted-foreground">
          Appena torna la rete ricarica la pagina. I tuoi capi sono al sicuro.
        </p>
      </div>
    </main>
  );
}
