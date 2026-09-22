import type { Metadata } from "next";

import { BottomNav } from "@/components/app/bottom-nav";
import { DemoBanner } from "@/components/demo/demo-banner";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Sfoglia VESTA senza registrarti: armadio, outfit e guardaroba degli amici, con dati di esempio.",
  // Non va indicizzata: chi cerca VESTA deve trovare la pagina vera, non
  // un armadio inventato.
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <>
      <a
        href="#contenuto-demo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
      >
        Vai al contenuto
      </a>

      <DemoBanner />

      {/* `main` e non `div`: è il punto di riferimento che gli screen reader
          usano per saltare al contenuto. */}
      <main
        id="contenuto-demo"
        className="mx-auto w-full max-w-lg flex-1 px-5 pb-8 pt-6"
      >
        {children}
      </main>

      {/* La stessa barra dell'app vera, puntata su /demo: quello che si vede
          qui è la navigazione di produzione, non una copia. */}
      <BottomNav base="/demo" />
    </>
  );
}
