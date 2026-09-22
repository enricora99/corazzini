/**
 * Il sottopercorso da cui l'app viene servita, per i casi che Next non
 * sistema da solo.
 *
 * Il valore arriva da `next.config.ts`, che lo inietta al build: qui non va
 * scritto a mano, o prima o poi i due si scollano e i percorsi si rompono
 * solo in produzione.
 *
 * Serve per:
 *   - `next/image` con src assoluto — `next/link` invece è già a posto
 *   - le `fetch` verso le nostre rotte API
 *   - gli `<a href>` nativi, che non passano da `next/link`
 *   - i percorsi dentro il manifest della PWA
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Antepone il sottopercorso a un percorso assoluto interno. */
export function conBase(percorso: string): string {
  if (!percorso.startsWith("/")) {
    throw new Error(`conBase vuole un percorso assoluto, ricevuto: ${percorso}`);
  }
  return `${BASE_PATH}${percorso}`;
}
