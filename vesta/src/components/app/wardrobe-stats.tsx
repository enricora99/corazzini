import Image from "next/image";

import { CATEGORY_LABELS, type Category } from "@/lib/ai/types";
import type { CapoConFoto } from "@/lib/items";

export type StatisticheArmadio = {
  totale: number;
  perCategoria: { categoria: Category; quanti: number }[];
  maiUsati: CapoConFoto[];
  piuUsato: { capo: CapoConFoto; volte: number } | null;
  outfitSalvati: number;
};

/**
 * Le statistiche dell'armadio.
 *
 * Il numero che conta è uno: quanti capi non hai mai messo. È la ragione per
 * cui VESTA esiste — «usare di più i vestiti che hai già» — e messo in grande
 * fa più del resto della pagina.
 *
 * Il resto sono numeri, non grafici. Con dodici capi un grafico a torta delle
 * categorie sarebbe una figura che occupa mezzo schermo per dire «tre top e
 * due paia di scarpe»: le barre qui sotto servono solo a far vedere gli
 * squilibri, ed è per questo che sono orizzontali con il valore scritto
 * accanto invece che da leggere su un asse.
 */
export function WardrobeStats({ s }: { s: StatisticheArmadio }) {
  const massimo = Math.max(1, ...s.perCategoria.map((c) => c.quanti));

  return (
    <div className="space-y-6">
      {s.maiUsati.length > 0 ? (
        <section className="rounded-3xl border-2 border-primary bg-accent p-5">
          <p className="font-heading text-4xl font-extrabold tabular-nums text-accent-foreground">
            {s.maiUsati.length}
          </p>
          <p className="mt-1 font-heading text-lg font-extrabold text-accent-foreground text-balance">
            {s.maiUsati.length === 1
              ? "capo che non hai mai messo"
              : "capi che non hai mai messo"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-accent-foreground/80 text-pretty">
            Sono già tuoi. Prima di comprare qualcosa, prova a chiedere un
            outfit che parta da uno di questi.
          </p>

          <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {s.maiUsati.slice(0, 8).map((capo) => (
              <li key={capo.id} className="shrink-0">
                <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-background">
                  {capo.photoUrl ? (
                    <Image
                      src={capo.photoUrl}
                      alt={capo.subcategory ?? CATEGORY_LABELS[capo.category]}
                      fill
                      sizes="64px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <dl className="grid grid-cols-3 gap-2">
        <Riquadro etichetta="Capi" valore={s.totale} />
        <Riquadro etichetta="Outfit salvati" valore={s.outfitSalvati} />
        <Riquadro
          etichetta="Categorie"
          valore={s.perCategoria.filter((c) => c.quanti > 0).length}
        />
      </dl>

      <section aria-labelledby="categorie-titolo" className="space-y-3">
        <h2
          id="categorie-titolo"
          className="font-heading text-base font-extrabold tracking-tight"
        >
          Com&apos;è composto l&apos;armadio
        </h2>

        <ul className="space-y-2">
          {s.perCategoria
            .filter((c) => c.quanti > 0)
            .sort((a, b) => b.quanti - a.quanti)
            .map((c) => (
              <li
                key={c.categoria}
                className="grid grid-cols-[6.5rem_1fr_1.5rem] items-center gap-2"
                title={`${CATEGORY_LABELS[c.categoria]}: ${c.quanti}`}
              >
                <span className="truncate text-sm text-muted-foreground">
                  {CATEGORY_LABELS[c.categoria]}
                </span>

                {/* Barra piatta in HTML: a questa scala una figura vettoriale
                    non aggiungerebbe niente e peserebbe di più. */}
                <span className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(6, (c.quanti / massimo) * 100)}%`,
                      backgroundColor: "var(--vesta-data)",
                    }}
                  />
                </span>

                <span className="text-right text-sm font-bold tabular-nums">
                  {c.quanti}
                </span>
              </li>
            ))}
        </ul>
      </section>

      {s.piuUsato ? (
        <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {s.piuUsato.capo.photoUrl ? (
              <Image
                src={s.piuUsato.capo.photoUrl}
                alt=""
                fill
                sizes="64px"
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Il più usato
            </p>
            <p className="truncate font-heading text-base font-extrabold">
              {s.piuUsato.capo.subcategory ??
                CATEGORY_LABELS[s.piuUsato.capo.category]}
            </p>
            <p className="text-sm text-muted-foreground">
              In {s.piuUsato.volte}{" "}
              {s.piuUsato.volte === 1 ? "outfit" : "outfit"}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Riquadro({ etichetta, valore }: { etichetta: string; valore: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <dt className="text-[11px] leading-tight text-muted-foreground">
        {etichetta}
      </dt>
      <dd className="mt-1 font-heading text-xl font-extrabold tabular-nums">
        {valore}
      </dd>
    </div>
  );
}
