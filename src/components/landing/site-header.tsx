import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <Image
            src="/brand/vesta-logo-alpha.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-heading text-xl font-extrabold tracking-tight">
            VESTA
          </span>
          <span className="sr-only">Vai all&apos;inizio della pagina</span>
        </Link>

        <Button asChild size="sm" className="font-bold">
          <Link href="#lista">Entra in lista</Link>
        </Button>
      </div>
    </header>
  );
}
