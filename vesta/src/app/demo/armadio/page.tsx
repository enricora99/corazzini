import { DemoArmadio } from "@/components/demo/demo-armadio";
import { CAPI_DEMO } from "@/lib/demo/data";

export default function DemoArmadioPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Armadio
        </h1>
      </header>

      <DemoArmadio iniziali={CAPI_DEMO} />

      <p className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        Le immagini sono disegni, non fotografie: le foto dei capi veri le
        carica chi usa l&apos;app. Prova ad aggiungere un capo per vedere come
        viene riconosciuto.
      </p>
    </div>
  );
}
