import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import { Toaster } from "@/components/ui/sonner";
import { PORTALE } from "@/lib/portal";
import { SITE_URL } from "@/lib/site";
import { conBase } from "@/lib/base-path";
import "./globals.css";

// Montserrat è variabile: un solo file copre 400, 500, 700 e 800, quindi i pesi
// del brand non costano download aggiuntivi. next/font lo serve dal nostro
// dominio, così il browser non contatta mai Google.
const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VESTA — Da 15 minuti a 5 secondi",
    template: "%s · VESTA",
  },
  description:
    "L'app che sceglie l'outfit con i vestiti che hai già. Fotografi l'armadio, dici dove vai, ricevi il look in pochi secondi.",
  applicationName: "VESTA",
  manifest: conBase("/manifest.webmanifest"),
  // Le icone le prende Next da src/app/icon.png e src/app/apple-icon.png,
  // aggiungendo da sé dimensioni e impronta per la cache. Quando l'app gira
  // dentro il sito di qualcun altro, però, la scheda del browser mostra il
  // dominio di quel sito: l'icona giusta è la sua, non la nostra.
  ...(PORTALE.favicon
    ? {
        icons: {
          icon: PORTALE.favicon,
          shortcut: PORTALE.favicon,
          apple: PORTALE.favicon,
        },
      }
    : {}),
  appleWebApp: {
    capable: true,
    title: "VESTA",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "VESTA",
    title: "VESTA — Da 15 minuti a 5 secondi",
    description:
      "L'app che sceglie l'outfit con i vestiti che hai già.",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Niente maximumScale: bloccare lo zoom costa un errore di accessibilità
  // in Lighthouse e rende l'app inusabile a chi ha bisogno di ingrandire.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
        <ServiceWorker />
      </body>
    </html>
  );
}
