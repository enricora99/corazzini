"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Camera, CircleAlert, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { salvaCapo } from "@/app/actions/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  SEASONS,
  STYLES,
  type Category,
  type ItemAttributes,
  type Season,
  type Style,
} from "@/lib/ai/types";
import { preparaFoto } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

type Fase = "scelta" | "lavorazione" | "revisione" | "salvataggio";

type Bozza = {
  id: string;
  photoPath: string;
  anteprima: string;
  category: Category;
  subcategory: string;
  colors: string;
  seasons: Season[];
  style: Style | "";
  warmth: string;
  aiClassified: boolean;
};

export function AddItemSheet({
  userId,
  apriSubito,
}: {
  userId: string;
  apriSubito: boolean;
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(apriSubito);
  const [fase, setFase] = useState<Fase>("scelta");
  const [bozza, setBozza] = useState<Bozza | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);

  const inputFoto = useRef<HTMLInputElement>(null);
  const inputGalleria = useRef<HTMLInputElement>(null);
  const idBase = useId();

  // L'anteprima è una object URL: se non la revochiamo, il blob resta in
  // memoria finché non si ricarica la pagina.
  useEffect(() => {
    const url = bozza?.anteprima;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [bozza?.anteprima]);

  function ripristina() {
    setFase("scelta");
    setBozza(null);
    setErrore(null);
    setAvviso(null);
  }

  function chiudi(nuovoStato: boolean) {
    setAperto(nuovoStato);
    if (!nuovoStato) {
      ripristina();
      // Toglie ?aggiungi=1 dall'indirizzo, altrimenti un ricarico
      // riaprirebbe il pannello da solo.
      router.replace("/app/armadio");
    }
  }

  async function gestisciFile(file: File | undefined) {
    if (!file) return;

    setFase("lavorazione");
    setErrore(null);
    setAvviso(null);

    try {
      const foto = await preparaFoto(file);
      const id = crypto.randomUUID();
      const photoPath = `${userId}/${id}.webp`;

      // Caricamento e classificazione in parallelo: sono indipendenti, e
      // farli in fila raddoppierebbe l'attesa proprio nel momento in cui
      // l'utente sta guardando lo schermo.
      const supabase = createClient();

      const [caricamento, classificazione] = await Promise.allSettled([
        supabase.storage.from("items").upload(photoPath, foto.blob, {
          contentType: foto.mimeType,
          upsert: false,
        }),
        fetch("/api/items/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: foto.base64,
            mimeType: foto.mimeType,
          }),
        }).then(async (r) => {
          const json = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(json.error ?? "Classificazione fallita.");
          return json.attributes as ItemAttributes;
        }),
      ]);

      // Senza la foto caricata non si va avanti: è l'unica delle due cose
      // di cui non possiamo fare a meno.
      if (caricamento.status === "rejected" || caricamento.value.error) {
        const messaggio =
          caricamento.status === "rejected"
            ? String(caricamento.reason)
            : caricamento.value.error?.message;
        console.error("[armadio] caricamento fallito:", messaggio);
        setErrore(
          "Non siamo riusciti a caricare la foto. Controlla la connessione e riprova."
        );
        setFase("scelta");
        return;
      }

      let attributi: ItemAttributes | null = null;
      if (classificazione.status === "fulfilled") {
        attributi = classificazione.value;
      } else {
        // La classificazione è un aiuto, non un requisito: se salta,
        // l'utente compila a mano invece di perdere la foto appena caricata.
        setAvviso(
          classificazione.reason instanceof Error
            ? classificazione.reason.message
            : "Non siamo riusciti a riconoscere il capo. Compila i campi a mano."
        );
      }

      setBozza({
        id,
        photoPath,
        anteprima: URL.createObjectURL(foto.blob),
        category: attributi?.category ?? "top",
        subcategory: attributi?.subcategory ?? "",
        colors: (attributi?.colors ?? []).join(", "),
        seasons: attributi?.seasons ?? [],
        style: attributi?.style ?? "",
        warmth: attributi?.warmth ? String(attributi.warmth) : "",
        aiClassified: Boolean(attributi),
      });
      setFase("revisione");
    } catch (e) {
      console.error("[armadio]", e);
      setErrore(
        e instanceof Error ? e.message : "Qualcosa è andato storto con la foto."
      );
      setFase("scelta");
    }
  }

  async function salva() {
    if (!bozza) return;
    setFase("salvataggio");
    setErrore(null);

    const esito = await salvaCapo({
      id: bozza.id,
      photoPath: bozza.photoPath,
      category: bozza.category,
      subcategory: bozza.subcategory.trim() || undefined,
      colors: bozza.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 4),
      seasons: bozza.seasons,
      style: bozza.style || undefined,
      warmth: bozza.warmth ? Number(bozza.warmth) : undefined,
      aiClassified: bozza.aiClassified,
      // Se ha toccato qualcosa lo sapremo: serve a capire quanto il modello
      // ci prende davvero, senza chiedere niente all'utente.
      correctedByUser: bozza.aiClassified && haModificato(bozza),
    });

    if (!esito.ok) {
      setErrore(esito.error);
      setFase("revisione");
      return;
    }

    toast.success("Capo aggiunto all'armadio.");
    chiudi(false);
    router.refresh();
  }

  return (
    <>
      <Button
        onClick={() => setAperto(true)}
        size="lg"
        className="h-13 w-full gap-2 text-base font-bold"
      >
        <Camera className="size-5" aria-hidden strokeWidth={2} />
        Aggiungi un capo
      </Button>

      <input
        ref={inputFoto}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => gestisciFile(e.target.files?.[0])}
      />
      <input
        ref={inputGalleria}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => gestisciFile(e.target.files?.[0])}
      />

      <Sheet open={aperto} onOpenChange={chiudi}>
        <SheetContent
          side="bottom"
          className="max-h-[92svh] overflow-y-auto rounded-t-3xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-xl font-extrabold">
              {fase === "revisione" || fase === "salvataggio"
                ? "Controlla e salva"
                : "Aggiungi un capo"}
            </SheetTitle>
            <SheetDescription>
              {fase === "revisione" || fase === "salvataggio"
                ? "Abbiamo compilato noi. Correggi quello che non torna."
                : "Una foto sola, il capo ben visibile."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-8">
            {errore ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {errore}
              </p>
            ) : null}

            {fase === "scelta" ? (
              <div className="grid gap-3">
                <Button
                  onClick={() => inputFoto.current?.click()}
                  size="lg"
                  className="h-13 gap-2 text-base font-bold"
                >
                  <Camera className="size-5" aria-hidden strokeWidth={2} />
                  Scatta una foto
                </Button>
                <Button
                  onClick={() => inputGalleria.current?.click()}
                  size="lg"
                  variant="outline"
                  className="h-13 gap-2 border-2 bg-card text-base font-bold"
                >
                  <ImageIcon className="size-5" aria-hidden strokeWidth={2} />
                  Scegli dalla galleria
                </Button>
              </div>
            ) : null}

            {fase === "lavorazione" ? (
              <div
                role="status"
                className="flex flex-col items-center gap-3 py-12 text-center"
              >
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
                <p className="font-semibold">Stiamo guardando il capo…</p>
                <p className="text-sm text-muted-foreground">
                  Ci vogliono pochi secondi.
                </p>
              </div>
            ) : null}

            {bozza && (fase === "revisione" || fase === "salvataggio") ? (
              <RevisioneCapo
                bozza={bozza}
                setBozza={setBozza}
                avviso={avviso}
                idBase={idBase}
                salvataggio={fase === "salvataggio"}
                onSalva={salva}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Confronto grossolano fra quello che ha detto il modello e quello che c'è
 *  ora nei campi. Serve solo a una statistica, non a una decisione. */
function haModificato(bozza: Bozza): boolean {
  return bozza.subcategory.trim().length > 0 || bozza.colors.trim().length > 0;
}

function RevisioneCapo({
  bozza,
  setBozza,
  avviso,
  idBase,
  salvataggio,
  onSalva,
}: {
  bozza: Bozza;
  setBozza: (b: Bozza) => void;
  avviso: string | null;
  idBase: string;
  salvataggio: boolean;
  onSalva: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={bozza.anteprima}
          alt="Il capo che stai aggiungendo"
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      {avviso ? (
        <p className="rounded-xl bg-accent p-3 text-sm font-medium text-accent-foreground">
          {avviso}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idBase}-cat`} className="font-bold">
          Categoria
        </Label>
        <Select
          value={bozza.category}
          onValueChange={(v) => setBozza({ ...bozza, category: v as Category })}
        >
          <SelectTrigger id={`${idBase}-cat`} className="h-12 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idBase}-sub`} className="font-bold">
          Che cos&apos;è
        </Label>
        <Input
          id={`${idBase}-sub`}
          value={bozza.subcategory}
          onChange={(e) => setBozza({ ...bozza, subcategory: e.target.value })}
          placeholder="camicia di lino"
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idBase}-col`} className="font-bold">
          Colori
        </Label>
        <Input
          id={`${idBase}-col`}
          value={bozza.colors}
          onChange={(e) => setBozza({ ...bozza, colors: e.target.value })}
          placeholder="blu, bianco"
          className="h-12"
        />
        <p className="text-sm text-muted-foreground">Separali con una virgola.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">Stagioni</legend>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => {
            const attiva = bozza.seasons.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={attiva}
                onClick={() =>
                  setBozza({
                    ...bozza,
                    seasons: attiva
                      ? bozza.seasons.filter((x) => x !== s)
                      : [...bozza.seasons, s],
                  })
                }
                className={`rounded-full border-2 px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                  attiva
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idBase}-stile`} className="font-bold">
            Stile
          </Label>
          <Select
            value={bozza.style || undefined}
            onValueChange={(v) => setBozza({ ...bozza, style: v as Style })}
          >
            <SelectTrigger id={`${idBase}-stile`} className="h-12 w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {STYLES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idBase}-caldo`} className="font-bold">
            Quanto copre
          </Label>
          <Select
            value={bozza.warmth || undefined}
            onValueChange={(v) => setBozza({ ...bozza, warmth: v })}
          >
            <SelectTrigger id={`${idBase}-caldo`} className="h-12 w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / 5
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={onSalva}
        disabled={salvataggio}
        size="lg"
        className="h-13 w-full text-base font-bold"
      >
        {salvataggio ? "Salvo…" : "Salva nell'armadio"}
      </Button>
    </div>
  );
}
