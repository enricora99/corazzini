import Link from "next/link";
import type { Metadata } from "next";
import { Camera, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { richiediUtenteMaggiorenne } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Il tuo armadio",
  robots: { index: false, follow: false },
};

export default async function AppHome() {
  const { profilo } = await richiediUtenteMaggiorenne();

  const supabase = await createClient();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profilo.id);

  const capi = count ?? 0;
  const nome = profilo.display_name?.trim() || profilo.email.split("@")[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Ciao {nome}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {capi === 0
            ? "Il tuo armadio è ancora vuoto. Si comincia da una foto."
            : capi === 1
              ? "Hai 1 capo nell'armadio."
              : `Hai ${capi} capi nell'armadio.`}
        </p>
      </header>

      <div className="grid gap-4">
        <Button
          asChild
          size="lg"
          className="h-auto justify-start gap-4 px-6 py-5 text-left"
        >
          <Link href="/app/armadio?aggiungi=1">
            <Camera className="size-6 shrink-0" aria-hidden strokeWidth={2} />
            <span>
              <span className="block text-base font-extrabold">
                Aggiungi un capo
              </span>
              <span className="block text-sm font-medium opacity-80">
                Fotografalo e ci pensiamo noi
              </span>
            </span>
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-auto justify-start gap-4 border-2 bg-card px-6 py-5 text-left"
        >
          <Link href="/app/outfit">
            <Sparkles className="size-6 shrink-0" aria-hidden strokeWidth={2} />
            <span>
              <span className="block text-base font-extrabold">
                Crea un outfit
              </span>
              <span className="block text-sm font-medium text-muted-foreground">
                Dicci dove vai, al resto pensiamo noi
              </span>
            </span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
