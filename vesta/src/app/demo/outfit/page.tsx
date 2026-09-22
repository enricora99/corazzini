import { DemoOutfitStudio } from "@/components/demo/demo-outfit-studio";

export default async function DemoOutfit({
  searchParams,
}: PageProps<"/demo/outfit">) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          Outfit
        </h1>
        <p className="mt-1 text-muted-foreground">
          Dicci dove vai, poi chiedi le modifiche che vuoi.
        </p>
      </header>

      <DemoOutfitStudio chatSubito={params.chat === "1"} />
    </div>
  );
}
