import { BottomNav } from "@/components/app/bottom-nav";
import { richiediUtenteMaggiorenne } from "@/lib/dal";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  // Il controllo sta qui, vicino ai dati, e non solo nel proxy: il proxy fa
  // una verifica ottimistica sul cookie per evitare il lampo di pagina
  // sbagliata, questo invece verifica la firma del token e la conferma di
  // maggiore età. Sotto ancora ci sono le policy del database.
  await richiediUtenteMaggiorenne();

  return (
    <>
      <a
        href="#contenuto-app"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
      >
        Vai al contenuto
      </a>

      {/* `main` e non `div`: è il punto di riferimento che gli screen reader
          usano per saltare al contenuto, ed è quello che cerca il link
          «Vai al contenuto» qui sopra. */}
      <main
        id="contenuto-app"
        className="mx-auto w-full max-w-lg flex-1 px-5 pb-8 pt-6"
      >
        {children}
      </main>

      <BottomNav />
    </>
  );
}
