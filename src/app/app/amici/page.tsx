import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amici",
  robots: { index: false, follow: false },
};

// Segnaposto: questa schermata arriva con il passo successivo.
export default function AmiciPage() {
  return (
    <div className="space-y-2">
      <h1 className="font-heading text-2xl font-extrabold tracking-tight">
        Amici
      </h1>
      <p className="text-muted-foreground">In lavorazione.</p>
    </div>
  );
}
