import type { CapoConFoto } from "@/lib/items";
import { percorsoFoto, urlFoto } from "@/lib/demo/foto";
import type { Occasion } from "@/lib/schemas";
import type { WeatherSnapshot } from "@/lib/ai/types";

/**
 * L'armadio della modalità demo.
 *
 * Dati inventati. Le immagini stanno in `public/demo/`: le fotografie del
 * team dove ci sono, altrimenti il disegno generato da
 * `scripts/build-demo-assets.mjs` — se ne occupa `@/lib/demo/foto`. Serve a
 * far vedere com'è fatta l'app senza database, senza chiavi e senza far
 * finta che sia un armadio vero.
 *
 * La forma dei dati è la stessa che arriva dal database, così le pagine del
 * demo usano gli stessi componenti dell'app vera: quello che si vede qui è
 * l'interfaccia di produzione, non un disegnino a parte.
 */

const IO = "demo-utente";

type Seme = {
  slug: string;
  subcategory: string;
  category: CapoConFoto["category"];
  colors: string[];
  seasons: CapoConFoto["seasons"];
  style: CapoConFoto["style"];
  warmth: number;
  ownerName?: string;
};

const SEMI: Seme[] = [
  { slug: "t-shirt-bianca", subcategory: "t-shirt con stampa", category: "top", colors: ["bianco"], seasons: ["primavera", "estate"], style: "casual", warmth: 1 },
  { slug: "t-shirt-marrone", subcategory: "t-shirt di cotone", category: "top", colors: ["marrone"], seasons: ["primavera", "estate"], style: "casual", warmth: 1 },
  { slug: "polo-righe", subcategory: "polo a righe", category: "top", colors: ["bianco", "nero"], seasons: ["primavera", "autunno"], style: "elegante", warmth: 2 },
  { slug: "camicia-righe", subcategory: "camicia a righe", category: "top", colors: ["bianco", "nero"], seasons: ["primavera", "autunno"], style: "formale", warmth: 2 },
  { slug: "maglione-righe", subcategory: "maglione a righe", category: "top", colors: ["beige", "bianco"], seasons: ["autunno", "inverno"], style: "casual", warmth: 4 },
  { slug: "jeans-chiari", subcategory: "jeans dritti", category: "pantaloni", colors: ["azzurro"], seasons: ["primavera", "estate", "autunno"], style: "casual", warmth: 3 },
  { slug: "jeans-scuri", subcategory: "jeans con borchie", category: "pantaloni", colors: ["blu"], seasons: ["autunno", "inverno", "primavera"], style: "elegante", warmth: 3 },
  { slug: "jeans-larghi", subcategory: "jeans larghi", category: "pantaloni", colors: ["blu"], seasons: ["primavera", "autunno", "inverno"], style: "casual", warmth: 3 },
  { slug: "pantaloni-tuta", subcategory: "pantaloni di felpa", category: "pantaloni", colors: ["bordeaux"], seasons: ["autunno", "inverno"], style: "sportivo", warmth: 3 },
  { slug: "shorts-denim", subcategory: "shorts di jeans", category: "pantaloni", colors: ["azzurro"], seasons: ["estate"], style: "casual", warmth: 1 },
  { slug: "giacca-denim", subcategory: "giacca di jeans corta", category: "giacca", colors: ["azzurro"], seasons: ["primavera", "autunno"], style: "casual", warmth: 3 },
  { slug: "sneakers-bianche", subcategory: "sneakers argento", category: "scarpe", colors: ["bianco", "argento"], seasons: ["primavera", "estate", "autunno"], style: "casual", warmth: 2 },
  { slug: "scarpe-corsa", subcategory: "scarpe da corsa", category: "scarpe", colors: ["bianco", "nero"], seasons: ["primavera", "estate", "autunno"], style: "sportivo", warmth: 2 },
  { slug: "borsa-denim", subcategory: "borsa di denim", category: "accessorio", colors: ["blu"], seasons: ["primavera", "estate", "autunno", "inverno"], style: "casual", warmth: 1 },

  // Questi tre sono degli amici: nella griglia compaiono con «di …».
  { slug: "jeans-paisley", subcategory: "jeans larghi ricamati", category: "pantaloni", colors: ["blu"], seasons: ["primavera", "estate"], style: "elegante", warmth: 2, ownerName: "Giulia" },
  { slug: "sneakers-rosa", subcategory: "sneakers rosa", category: "scarpe", colors: ["rosa"], seasons: ["primavera", "estate", "autunno"], style: "casual", warmth: 2, ownerName: "Giulia" },
  { slug: "sneakers-multicolore", subcategory: "sneakers multicolore", category: "scarpe", colors: ["multicolore"], seasons: ["primavera", "estate"], style: "casual", warmth: 2, ownerName: "Marco" },
];

/** Date fisse: con `new Date()` la pagina non sarebbe più statica e a ogni
 *  ricarica cambierebbe l'ordine dei capi. */
const NASCITA = "2026-09-01T10:00:00.000Z";

function costruisci(seme: Seme, indice: number): CapoConFoto {
  const mio = !seme.ownerName;
  return {
    id: `demo-${seme.slug}`,
    user_id: mio ? IO : `demo-amico-${seme.ownerName?.toLowerCase()}`,
    photo_path: percorsoFoto(seme.slug),
    photoUrl: urlFoto(seme.slug),
    category: seme.category,
    subcategory: seme.subcategory,
    colors: seme.colors,
    seasons: seme.seasons,
    style: seme.style,
    warmth: seme.warmth,
    notes: null,
    created_at: new Date(Date.parse(NASCITA) - indice * 86_400_000).toISOString(),
    ownerName: seme.ownerName ?? null,
  };
}

const TUTTI = SEMI.map(costruisci);

export const CAPI_DEMO = TUTTI.filter((c) => !c.ownerName);
export const CAPI_AMICI_DEMO = TUTTI.filter((c) => c.ownerName);

export const AMICI_DEMO = [
  { nome: "Giulia", capi: 2 },
  { nome: "Marco", capi: 1 },
];

/** Meteo finto ma plausibile per fine settembre in Abruzzo. */
export const METEO_DEMO: WeatherSnapshot = {
  temperature: 19,
  apparent: 18,
  precipitation: 0,
  description: "poco nuvoloso",
};

export type PropostaDemo = {
  rationale: string;
  items: { id: string; label: string; photoUrl: string; ownerName: string | null }[];
};

function proposta(slugs: string[], rationale: string): PropostaDemo {
  return {
    rationale,
    items: slugs.map((slug) => {
      const capo = TUTTI.find((c) => c.id === `demo-${slug}`);
      if (!capo) throw new Error(`capo demo inesistente: ${slug}`);
      return {
        id: capo.id,
        label: capo.subcategory ?? capo.category,
        photoUrl: capo.photoUrl!,
        ownerName: capo.ownerName ?? null,
      };
    }),
  };
}

/**
 * Proposte già pronte, una terna per occasione.
 *
 * Nell'app vera le scrive il modello a partire dai capi e dal meteo. Qui sono
 * fisse: la modalità demo non chiama nessun modello, quindi non costa niente
 * e non può fallire davanti alla giuria.
 */
/**
 * Il calendario dimostrativo.
 *
 * I giorni si calcolano sul mese che si sta guardando invece di essere
 * fissati a una data: un calendario che mostra outfit di due mesi fa dice
 * a chi guarda che nessuno usa questa app.
 *
 * Gli stessi giorni relativi ogni mese, così la schermata è prevedibile
 * quando la si prova più volte.
 */
export function giorniDemo(anno: number, mese: number) {
  const quanti = new Date(anno, mese + 1, 0).getDate();
  const oggi = new Date().getDate();

  const piani: { scarto: number; slugs: string[]; etichetta: string }[] = [
    { scarto: -6, slugs: ["camicia-righe", "jeans-scuri", "sneakers-bianche"], etichetta: "Lavoro" },
    { scarto: -4, slugs: ["t-shirt-bianca", "jeans-larghi", "sneakers-bianche"], etichetta: "Università" },
    { scarto: -2, slugs: ["polo-righe", "jeans-paisley", "sneakers-bianche", "borsa-denim"], etichetta: "Sera" },
    { scarto: 0, slugs: ["maglione-righe", "jeans-chiari", "sneakers-bianche"], etichetta: "Oggi" },
    { scarto: 1, slugs: ["camicia-righe", "giacca-denim", "jeans-scuri", "sneakers-bianche"], etichetta: "Domani, riunione" },
    { scarto: 3, slugs: ["camicia-righe", "jeans-paisley", "sneakers-rosa"], etichetta: "Cerimonia" },
    { scarto: 6, slugs: ["t-shirt-marrone", "giacca-denim", "jeans-larghi", "sneakers-bianche"], etichetta: "Weekend" },
  ];

  return piani
    .map((p) => ({ ...p, giorno: oggi + p.scarto }))
    .filter((p) => p.giorno >= 1 && p.giorno <= quanti)
    .map((p) => ({
      giorno: p.giorno,
      etichetta: p.etichetta,
      anteprime: p.slugs
        .map((s) => TUTTI.find((c) => c.id === `demo-${s}`)?.photoUrl)
        .filter((u): u is string => Boolean(u)),
    }));
}

/**
 * Le rifiniture: «rendilo più formale», «più caldo», «meno pezzi».
 *
 * È la meccanica che racconta meglio l'idea di uno stilista con cui si
 * parla, invece di un pulsante che sputa fuori tre risultati e basta.
 *
 * Nell'app vera è una seconda chiamata al modello, che riceve l'outfit
 * precedente più la richiesta. Qui le risposte sono scritte: la demo non
 * chiama nessun modello, quindi non costa e non può fallire in pubblico.
 *
 * `chiavi` serve a riconoscere la richiesta anche quando viene scritta a
 * mano invece di toccare un suggerimento: chi prova la demo digita «più
 * elegante», non «formale».
 */
export type Rifinitura = {
  id: string;
  etichetta: string;
  chiavi: string[];
  risposta: string;
  proposte: PropostaDemo[];
};

export const RIFINITURE_DEMO: Rifinitura[] = [
  {
    id: "formale",
    etichetta: "Più formale",
    chiavi: ["formale", "elegante", "serio", "importante", "colloquio", "ufficio"],
    risposta:
      "Ho alzato il tono con quello che hai: camicia al posto della maglia e i jeans scuri. Più su di così non si arriva senza comprare un capo.",
    proposte: [
      proposta(
        ["camicia-righe", "jeans-scuri", "sneakers-bianche"],
        "La camicia fa quasi tutto. Le righe sottili non gridano."
      ),
      proposta(
        ["camicia-righe", "giacca-denim", "jeans-scuri", "sneakers-bianche"],
        "La giacca di jeans non è un blazer, ma chiude la figura e toglie l'aria da fine settimana."
      ),
    ],
  },
  {
    id: "caldo",
    etichetta: "Più caldo",
    chiavi: ["caldo", "freddo", "coprir", "inverno", "gela", "pesante"],
    risposta:
      "Ho aggiunto strati. Due leggeri scaldano più di uno pesante, e a metà giornata ne togli uno.",
    proposte: [
      proposta(
        ["maglione-righe", "jeans-larghi", "sneakers-bianche"],
        "Il maglione a coste copre davvero: da solo basta fino a metà novembre."
      ),
      proposta(
        ["maglione-righe", "giacca-denim", "jeans-scuri", "sneakers-bianche"],
        "Con la giacca sopra reggi anche la sera, senza portarti dietro un cappotto."
      ),
    ],
  },
  {
    id: "semplice",
    etichetta: "Meno pezzi",
    chiavi: ["semplice", "meno", "veloce", "fretta", "minimal", "essenziale"],
    risposta:
      "Ridotto all'osso: tre capi e sei fuori di casa. Senza vestiti in armadio, sotto i tre non si scende.",
    proposte: [
      proposta(
        ["t-shirt-bianca", "jeans-chiari", "sneakers-bianche"],
        "Il minimo che funziona sempre, senza doverci pensare."
      ),
      proposta(
        ["t-shirt-marrone", "jeans-larghi", "sneakers-bianche"],
        "Stessa logica, un tono più caldo. Il marrone regge meglio la luce di settembre."
      ),
    ],
  },
  {
    id: "scarpe",
    etichetta: "Cambia scarpe",
    chiavi: ["scarpe", "sneakers", "comode", "camminare", "corsa", "piedi"],
    risposta:
      "Ho cambiato solo le scarpe, il resto regge. Se devi camminare molto, la seconda.",
    proposte: [
      proposta(
        ["polo-righe", "jeans-chiari", "sneakers-bianche"],
        "Le argento tengono il casual senza scendere di tono."
      ),
      proposta(
        ["polo-righe", "jeans-chiari", "scarpe-corsa"],
        "Le scarpe da corsa sotto la polo: meno curate, ma a fine giornata te ne accorgi."
      ),
    ],
  },
];

/** Trova la rifinitura che corrisponde a quello che l'utente ha scritto. */
export function riconosciRifinitura(testo: string): Rifinitura | null {
  const pulito = testo.trim().toLowerCase();
  if (!pulito) return null;
  return (
    RIFINITURE_DEMO.find((r) =>
      r.chiavi.some((chiave) => pulito.includes(chiave))
    ) ?? null
  );
}

export const PROPOSTE_DEMO: Record<Occasion, PropostaDemo[]> = {
  lavoro: [
    proposta(
      ["camicia-righe", "jeans-scuri", "sneakers-bianche"],
      "La camicia a righe con i jeans scuri: le borchie si notano poco da seduta, e il resto resta sobrio."
    ),
    proposta(
      ["polo-righe", "jeans-chiari", "sneakers-bianche"],
      "La polo tiene il colletto senza la rigidità della camicia. Per le giornate senza riunioni."
    ),
    proposta(
      ["camicia-righe", "giacca-denim", "jeans-scuri", "sneakers-bianche"],
      "Con la giacca sopra regge anche l'aria condizionata. A 19 gradi la togli a metà mattina."
    ),
  ],
  universita: [
    proposta(
      ["t-shirt-bianca", "jeans-larghi", "sneakers-bianche"],
      "Il minimo sforzo che funziona sempre. La stampa fa tutto da sola."
    ),
    proposta(
      ["maglione-righe", "jeans-chiari", "sneakers-bianche"],
      "Per le mattine fredde in aula, dove il riscaldamento arriva sempre tardi."
    ),
    proposta(
      ["t-shirt-marrone", "giacca-denim", "jeans-larghi", "sneakers-bianche"],
      "Il marrone sotto il denim chiaro: due toni che si tengono senza sforzo."
    ),
  ],
  sera: [
    proposta(
      ["polo-righe", "jeans-paisley", "sneakers-bianche", "borsa-denim"],
      "I jeans ricamati di Giulia alzano il tono più di qualunque cosa tua. La polo li lascia parlare."
    ),
    proposta(
      ["t-shirt-marrone", "jeans-scuri", "sneakers-bianche", "borsa-denim"],
      "Scuro su scuro, con le borchie come unico dettaglio. Non chiede altro."
    ),
    proposta(
      ["camicia-righe", "jeans-paisley", "sneakers-rosa"],
      "Le scarpe rosa di Giulia raccolgono il ricamo dei jeans. Righe e paisley reggono: cambia la scala."
    ),
  ],
  sport: [
    proposta(
      ["t-shirt-bianca", "pantaloni-tuta", "scarpe-corsa"],
      "Quello che metteresti senza pensarci. A 19 gradi la felpa sopra non serve."
    ),
    proposta(
      ["t-shirt-marrone", "shorts-denim", "scarpe-corsa"],
      "Se resti a guardare più che a giocare: gli shorts non sono da campo, ma il pomeriggio regge."
    ),
    proposta(
      ["maglione-righe", "pantaloni-tuta", "scarpe-corsa"],
      "Da mettere prima e dopo, quando ti fermi e senti il fresco."
    ),
  ],
  cerimonia: [
    proposta(
      ["camicia-righe", "jeans-scuri", "sneakers-bianche", "borsa-denim"],
      "Ti dico come sta: di davvero formale nel tuo armadio non c'è niente. Questa è la cosa più composta che puoi mettere insieme oggi."
    ),
    proposta(
      ["camicia-righe", "jeans-paisley", "sneakers-bianche"],
      "I jeans ricamati di Giulia sono il pezzo più elegante a cui puoi arrivare senza comprare nulla."
    ),
    proposta(
      ["polo-righe", "jeans-scuri", "sneakers-bianche", "borsa-denim"],
      "L'alternativa se la camicia ti sembra troppo. Resta ordinato, ma non fingiamo che sia un completo."
    ),
  ],
};
