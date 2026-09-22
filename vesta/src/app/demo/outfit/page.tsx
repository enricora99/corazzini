import { DemoOutfitStudio } from "@/components/demo/demo-outfit-studio";

export default function DemoOutfit() {
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

      <DemoOutfitStudio />
    </div>
  );
}
