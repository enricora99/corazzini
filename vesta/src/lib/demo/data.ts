import type { CapoConFoto } from "@/lib/items";
import { conBase } from "@/lib/base-path";
import type { Occasion } from "@/lib/schemas";
import type { WeatherSnapshot } from "@/lib/ai/types";

/**
 * L'armadio della modalità demo.
 *
 * Dati inventati, immagini disegnate (`public/demo/`, generate da
 * `scripts/build-demo-assets.mjs`): non c'è nessuna fotografia, né nostra né
 * presa dal web. Serve a far vedere com'è fatta l'app senza database, senza
 * chiavi e senza far finta che sia un armadio vero.
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
  { slug: "t-shirt-bianca", subcategory: "t-shirt di cotone", category: "top", colors: ["bianco"], seasons: ["primavera", "estate"], style: "casual", warmth: 1 },
  { slug: "camicia-azzurra", subcategory: "camicia di lino", category: "top", colors: ["azzurro"], seasons: ["primavera", "estate"], style: "formale", warmth: 2 },
  { slug: "maglione-beige", subcategory: "maglione a coste", category: "top", colors: ["beige"], seasons: ["autunno", "inverno"], style: "casual", warmth: 4 },
  { slug: "top-nero", subcategory: "top smanicato", category: "top", colors: ["nero"], seasons: ["primavera", "estate"], style: "elegante", warmth: 1 },
  { slug: "jeans-blu", subcategory: "jeans dritti", category: "pantaloni", colors: ["blu"], seasons: ["primavera", "autunno", "inverno"], style: "casual", warmth: 3 },
  { slug: "pantaloni-neri", subcategory: "pantaloni sartoriali", category: "pantaloni", colors: ["nero"], seasons: ["autunno", "inverno", "primavera"], style: "formale", warmth: 3 },
  { slug: "pantaloni-beige", subcategory: "chino beige", category: "pantaloni", colors: ["beige"], seasons: ["primavera", "estate"], style: "casual", warmth: 2 },
  { slug: "gonna-nera", subcategory: "gonna a tubino", category: "gonna", colors: ["nero"], seasons: ["autunno", "inverno"], style: "elegante", warmth: 2 },
  { slug: "vestito-verde", subcategory: "abito verde salvia", category: "vestito", colors: ["verde"], seasons: ["primavera", "estate"], style: "elegante", warmth: 2 },
  { slug: "blazer-blu", subcategory: "blazer blu notte", category: "giacca", colors: ["blu"], seasons: ["autunno", "primavera"], style: "formale", warmth: 3 },
  { slug: "sneakers-bianche", subcategory: "sneakers di pelle", category: "scarpe", colors: ["bianco"], seasons: ["primavera", "estate", "autunno"], style: "casual", warmth: 2 },
  { slug: "stivaletti-neri", subcategory: "stivaletti con tacco", category: "scarpe", colors: ["nero"], seasons: ["autunno", "inverno"], style: "elegante", warmth: 3 },

  // Questi tre sono degli amici: nella griglia compaiono con «di …».
  { slug: "giacca-denim", subcategory: "giacca di jeans", category: "giacca", colors: ["blu"], seasons: ["primavera", "autunno"], style: "casual", warmth: 3, ownerName: "Giulia" },
  { slug: "sciarpa-senape", subcategory: "sciarpa di lana", category: "accessorio", colors: ["senape"], seasons: ["autunno", "inverno"], style: "casual", warmth: 4, ownerName: "Giulia" },
  { slug: "borsa-cuoio", subcategory: "borsa di cuoio", category: "accessorio", colors: ["cuoio"], seasons: ["primavera", "estate", "autunno", "inverno"], style: "elegante", warmth: 1, ownerName: "Marco" },
];

/** Date fisse: con `new Date()` la pagina non sarebbe più statica e a ogni
 *  ricarica cambierebbe l'ordine dei capi. */
const NASCITA = "2026-09-01T10:00:00.000Z";

function costruisci(seme: Seme, indice: number): CapoConFoto {
  const mio = !seme.ownerName;
  return {
    id: `demo-${seme.slug}`,
    user_id: mio ? IO : `demo-amico-${seme.ownerName?.toLowerCase()}`,
    photo_path: `demo/${seme.slug}.svg`,
    photoUrl: conBase(`/demo/${seme.slug}.svg`),
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
export const PROPOSTE_DEMO: Record<Occasion, PropostaDemo[]> = {
  lavoro: [
    proposta(
      ["camicia-azzurra", "pantaloni-neri", "stivaletti-neri"],
      "L'azzurro tiene la camicia leggera senza smontare il resto: formale ma non rigido."
    ),
    proposta(
      ["camicia-azzurra", "blazer-blu", "pantaloni-neri", "stivaletti-neri"],
      "Con il blazer regge anche una riunione; a 19 gradi non ti pesa addosso."
    ),
    proposta(
      ["maglione-beige", "pantaloni-neri", "stivaletti-neri"],
      "Quando la giornata è tranquilla: il beige smorza il nero e resta ordinato."
    ),
  ],
  universita: [
    proposta(
      ["t-shirt-bianca", "jeans-blu", "sneakers-bianche"],
      "Il minimo sforzo che funziona sempre. Bianco e blu non litigano mai."
    ),
    proposta(
      ["t-shirt-bianca", "giacca-denim", "pantaloni-beige", "sneakers-bianche"],
      "La giacca di jeans te la fai prestare da Giulia: copre quel che serve a metà settembre."
    ),
    proposta(
      ["maglione-beige", "jeans-blu", "sneakers-bianche"],
      "Per le mattine fredde in aula, dove il riscaldamento arriva sempre tardi."
    ),
  ],
  sera: [
    proposta(
      ["top-nero", "gonna-nera", "stivaletti-neri"],
      "Nero su nero: il tacco fa il lavoro, tu non devi pensarci."
    ),
    proposta(
      ["top-nero", "gonna-nera", "borsa-cuoio", "stivaletti-neri"],
      "La borsa di Marco spezza il nero con un tono caldo, senza gridare."
    ),
    proposta(
      ["vestito-verde", "stivaletti-neri"],
      "Un capo solo e hai finito. Il verde salvia regge bene la luce serale."
    ),
  ],
  sport: [
    proposta(
      ["t-shirt-bianca", "pantaloni-neri", "sneakers-bianche"],
      "Leggero e comodo. Con 19 gradi non ti serve altro."
    ),
    proposta(
      ["t-shirt-bianca", "jeans-blu", "sneakers-bianche"],
      "Se il campo è all'aperto e resti a guardare più che a giocare."
    ),
    proposta(
      ["maglione-beige", "pantaloni-neri", "sneakers-bianche"],
      "Da mettere sopra prima e dopo, quando ti fermi e senti il fresco."
    ),
  ],
  cerimonia: [
    proposta(
      ["vestito-verde", "stivaletti-neri", "borsa-cuoio"],
      "Il verde salvia è composto senza essere spento: funziona di giorno."
    ),
    proposta(
      ["vestito-verde", "blazer-blu", "stivaletti-neri"],
      "Con il blazer sopra se la cerimonia è in chiesa e dentro fa fresco."
    ),
    proposta(
      ["camicia-azzurra", "blazer-blu", "pantaloni-neri", "stivaletti-neri"],
      "L'alternativa senza vestito: sobria, e non rischi di essere troppo."
    ),
  ],
};
