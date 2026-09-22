import Image from "next/image";
import { ImageOff } from "lucide-react";

export type CapoMiniatura = {
  id: string;
  label: string;
  photoUrl: string | null;
  ownerName?: string | null;
};

export type SchedaOutfit = {
  rationale: string;
  items: CapoMiniatura[];
};

/**
 * Le proposte come schede che scorrono in orizzontale.
 *
 * Le schede sono larghe il 78% dello schermo di proposito: così la
 * successiva sporge sul bordo e si capisce che ce n'è dell'altro. Con schede
 * a tutta larghezza chi guarda crede che la proposta sia una sola e non
 * prova nemmeno a trascinare.
 */
export function OutfitCarousel({
  proposte,
  azioni,
}: {
  proposte: SchedaOutfit[];
  /** Cosa mettere sotto ogni scheda (salva, rigenera, chiedi altro). */
  azioni?: (proposta: SchedaOutfit, indice: number) => React.ReactNode;
}) {
  return (
    <div
      // I margini negativi lasciano che le schede tocchino i bordi dello
      // schermo mentre il testo intorno resta allineato al resto.
      className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex snap-x snap-mandatory gap-3">
        {proposte.map((proposta, indice) => (
          <li
            key={indice}
            className="w-[78%] shrink-0 snap-start sm:w-[62%]"
          >
            <article className="flex h-full flex-col gap-3 rounded-3xl border border-border bg-card p-3">
              <Collage items={proposta.items} />

              <p className="flex-1 text-sm leading-relaxed">
                {proposta.rationale}
              </p>

              {azioni ? <div>{azioni(proposta, indice)}</div> : null}
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * I capi accostati, due per riga.
 *
 * Con meno di quattro capi la griglia resta a due colonne invece di
 * allargarsi: un outfit di tre pezzi con l'ultimo a tutta larghezza
 * sembrerebbe sbilanciato.
 */
function Collage({ items }: { items: CapoMiniatura[] }) {
  const mostrati = items.slice(0, 4);
  const restanti = items.length - mostrati.length;

  return (
    <div className="relative grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl bg-muted p-1.5">
      {mostrati.map((capo) => (
        <div
          key={capo.id}
          className="relative aspect-square overflow-hidden rounded-xl bg-background"
        >
          {capo.photoUrl ? (
            <Image
              src={capo.photoUrl}
              alt={capo.label}
              fill
              sizes="(max-width: 640px) 40vw, 200px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-5" aria-hidden />
              <span className="sr-only">{capo.label}</span>
            </div>
          )}

          {capo.ownerName ? (
            <span className="absolute inset-x-1 bottom-1 truncate rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
              di {capo.ownerName}
            </span>
          ) : null}
        </div>
      ))}

      {restanti > 0 ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-foreground/85 px-2 py-0.5 text-[11px] font-bold text-background">
          +{restanti}
        </span>
      ) : null}
    </div>
  );
}
