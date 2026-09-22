import type { Metadata } from "next";

import { FriendsPanel } from "@/components/app/friends-panel";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { getAmicizie } from "@/lib/friends";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Amici",
  robots: { index: false, follow: false },
};

export default async function AmiciPage() {
  const { profilo } = await richiediUtenteMaggiorenne("/app/amici");
  const { amici, inviti } = await getAmicizie(profilo.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Amici
        </h1>
        <p className="mt-1 text-muted-foreground text-pretty">
          Vedi cosa puoi prendere in prestito prima di comprare qualcosa di
          nuovo.
        </p>
      </header>

      <FriendsPanel amici={amici} inviti={inviti} origine={SITE_URL} />
    </div>
  );
}
