import type { Category, Season, Style } from "@/lib/ai/types";

/**
 * I capi che si possono «fotografare» nella demo.
 *
 * Non sono nell'armadio di partenza, così aggiungerne uno si vede davvero
 * comparire nella griglia.
 *
 * `riconosciuto` è quello che nell'app vera scrive il modello di visione
 * guardando la foto. Qui è fisso: la demo non chiama nessun modello, quindi
 * non costa niente e davanti a una giuria non può sbagliare capo né fallire
 * per una rete lenta.
 */

export type CapoDaRiconoscere = {
  slug: string;
  /** Come lo chiameresti tu guardando la foto, prima che parli il modello. */
  etichetta: string;
  riconosciuto: {
    category: Category;
    subcategory: string;
    colors: string[];
    seasons: Season[];
    style: Style;
    warmth: number;
  };
};

export const CAPI_DA_RICONOSCERE: CapoDaRiconoscere[] = [
  {
    slug: "felpa-grigia",
    etichetta: "Una felpa",
    riconosciuto: {
      category: "top",
      subcategory: "felpa di cotone",
      colors: ["grigio"],
      seasons: ["primavera", "autunno", "inverno"],
      style: "casual",
      warmth: 3,
    },
  },
  {
    slug: "cappotto-cammello",
    etichetta: "Un cappotto",
    riconosciuto: {
      category: "giacca",
      subcategory: "cappotto di lana",
      colors: ["cammello"],
      seasons: ["autunno", "inverno"],
      style: "elegante",
      warmth: 5,
    },
  },
  {
    slug: "mocassini-cuoio",
    etichetta: "Dei mocassini",
    riconosciuto: {
      category: "scarpe",
      subcategory: "mocassini di cuoio",
      colors: ["cuoio"],
      seasons: ["primavera", "autunno"],
      style: "formale",
      warmth: 2,
    },
  },
];

/**
 * Quanto dura la finta analisi.
 *
 * Non è un vezzo: nell'app vera il modello ci mette qualche secondo, e senza
 * questa attesa la demo racconterebbe una cosa che non succede. Tenuta corta
 * perché chi guarda da dietro le spalle non si annoi.
 */
export const DURATA_ANALISI_MS = 1600;
