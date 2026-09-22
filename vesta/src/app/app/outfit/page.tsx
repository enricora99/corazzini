import Link from "next/link";
import type { Metadata } from "next";
import { Shirt } from "lucide-react";

import { OutfitStudio } from "@/components/app/outfit-studio";
import { Button } from "@/components/ui/button";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Outfit",
  robots: { index: false, follow: false },
};

const CAPI_MINIMI = 3;

export default async function OutfitPage() {
  const { profilo } = await richiediUtenteMaggiorenne("/app/outfit");
  const supabase = await createClient();

  const [{ count: capi }, { count: amicizie }] = await Promise.all([
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profilo.id),
    supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
  ]);

  if ((capi ?? 0) < CAPI_MINIMI) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Outfit
        </h1>
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <Shirt className="size-8 text-muted-foreground" aria-hidden strokeWidth={1.5} />
          <p className="font-heading text-lg font-extrabold">
            Prima riempiamo l&apos;armadio
          </p>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty">
            Servono almeno {CAPI_MINIMI} capi perché ci sia qualcosa da
            combinare. Ne hai {capi ?? 0}.
          </p>
          <Button asChild className="mt-2 font-bold">
            <Link href="/app/armadio?aggiungi=1">Aggiungi un capo</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Outfit
        </h1>
        <p className="mt-1 text-muted-foreground">
          Dicci dove vai. Al resto pensiamo noi.
        </p>
      </header>

      <OutfitStudio haAmici={(amicizie ?? 0) > 0} />
    </div>
  );
}
