import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Chi naviga da tastiera non deve attraversare l'intestazione a ogni
          pagina. Il link resta invisibile finché non riceve il focus. */}
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
      >
        Vai al contenuto
      </a>

      <SiteHeader />
      <main id="contenuto" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
