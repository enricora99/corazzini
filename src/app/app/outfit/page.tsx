import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outfit",
  robots: { index: false, follow: false },
};

// Segnaposto: questa schermata arriva con il passo successivo.
export default function OutfitPage() {
  return (
    <div className="space-y-2">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">
        Outfit
      </h1>
      <p className="text-muted-foreground">In lavorazione.</p>
    </div>
  );
}
