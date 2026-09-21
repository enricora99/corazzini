import Link from "next/link";

import { CONTACT_EMAIL } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-10 text-center sm:px-8">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>

        <nav aria-label="Note legali">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
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

        <p className="text-sm text-muted-foreground">© {year} VESTA</p>
      </div>
    </footer>
  );
}
