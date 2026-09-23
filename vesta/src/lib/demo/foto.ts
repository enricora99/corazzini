import { conBase } from "@/lib/base-path";
import fotografati from "./foto.json";

/**
 * Da dove arriva l'immagine di un capo della demo.
 *
 * Due sorgenti convivono. `scripts/import-foto-demo.mjs` scrive le
 * fotografie vere in `public/demo/<capo>.webp` e aggiorna `foto.json` con
 * l'elenco di quelle che ci sono; i capi che non compaiono in quell'elenco
 * restano al disegno generato da `scripts/build-demo-assets.mjs`.
 *
 * Così l'armadio si può fotografare un capo alla volta, senza mai un giorno
 * in cui la demo è a metà: quello che manca non è un riquadro vuoto, è il
 * disegno di prima.
 */
const CON_FOTO = new Set<string>(fotografati);

/** Il percorso dentro `public/`, come lo registrerebbe il database. */
export function percorsoFoto(slug: string): string {
  return `demo/${slug}.${CON_FOTO.has(slug) ? "webp" : "svg"}`;
}

/** L'indirizzo da mettere in un `src`, sottocartella compresa. */
export function urlFoto(slug: string): string {
  return conBase(`/${percorsoFoto(slug)}`);
}
