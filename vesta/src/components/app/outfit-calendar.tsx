import Image from "next/image";

export type GiornoConOutfit = {
  /** Giorno del mese, da 1 a 31. */
  giorno: number;
  /** Le miniature dei capi, per il collage. */
  anteprime: string[];
  etichetta: string;
};

/**
 * Il mese con gli outfit posati sui giorni.
 *
 * Serve a una cosa sola, ed è la promessa del prodotto: guardare la settimana
 * prima che arrivi, invece di decidere alle sette e un quarto davanti
 * all'armadio aperto.
 *
 * Il collage di ogni giorno è minuscolo di proposito. A questa dimensione non
 * si distinguono i capi, e va bene: serve a riconoscere «quel giorno ho già
 * deciso», non a rivedere l'outfit. Chi vuole guardarlo tocca il giorno.
 */
export function OutfitCalendar({
  anno,
  mese,
  giorni,
  oggi,
}: {
  anno: number;
  /** Da 0 a 11, come lo vuole Date. */
  mese: number;
  giorni: GiornoConOutfit[];
  oggi?: number;
}) {
  const primo = new Date(anno, mese, 1);
  const quantiGiorni = new Date(anno, mese + 1, 0).getDate();

  // getDay() mette domenica a 0, ma in Italia la settimana comincia di
  // lunedì: senza questa correzione tutto il mese slitta di un giorno.
  const primoGiornoSettimana = (primo.getDay() + 6) % 7;

  const perGiorno = new Map(giorni.map((g) => [g.giorno, g]));
  const nomeMese = new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(primo);

  const celle: (number | null)[] = [
    ...Array<null>(primoGiornoSettimana).fill(null),
    ...Array.from({ length: quantiGiorni }, (_, i) => i + 1),
  ];

  return (
    <section aria-label={`Outfit di ${nomeMese}`} className="space-y-3">
      <h2 className="font-heading text-lg font-extrabold capitalize tracking-tight">
        {nomeMese}
      </h2>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((g) => (
          <div key={g} className="py-1">
            {g}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celle.map((giorno, i) => {
          if (giorno === null) return <div key={`vuoto-${i}`} />;

          const conOutfit = perGiorno.get(giorno);
          const eOggi = giorno === oggi;

          return (
            <div
              key={giorno}
              className={`flex aspect-square flex-col items-center gap-0.5 rounded-xl p-1 ${
                eOggi ? "bg-accent" : ""
              }`}
            >
              <span
                className={`text-[11px] leading-none ${
                  eOggi
                    ? "font-extrabold text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {giorno}
              </span>

              {conOutfit ? (
                <div
                  className="grid w-full flex-1 grid-cols-2 gap-px overflow-hidden rounded-lg bg-muted p-px"
                  title={conOutfit.etichetta}
                >
                  {conOutfit.anteprime.slice(0, 4).map((src, n) => (
                    <div
                      key={n}
                      className="relative overflow-hidden rounded-[3px] bg-background"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="24px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ))}
                  <span className="sr-only">{conOutfit.etichetta}</span>
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** La riga di numeri sotto al mese. */
export function RigaStatistiche({
  voci,
}: {
  voci: { etichetta: string; valore: string }[];
}) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {voci.map((v) => (
        <div
          key={v.etichetta}
          className="rounded-2xl border border-border bg-card p-3 text-center"
        >
          <dt className="text-[11px] leading-tight text-muted-foreground">
            {v.etichetta}
          </dt>
          <dd className="mt-1 font-heading text-lg font-extrabold tabular-nums">
            {v.valore}
          </dd>
        </div>
      ))}
    </dl>
  );
}
