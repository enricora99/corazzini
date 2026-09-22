/**
 * Identità del portale che sta davanti all'applicazione.
 *
 * Esiste perché VESTA può essere ospitata dentro il sito di qualcun altro,
 * che davanti al cancello vuole il proprio nome e il proprio segno. Tutto
 * arriva da variabili d'ambiente e niente è scritto nel codice: chi scarica
 * il progetto si ritrova il portale con il marchio VESTA, senza tracce di
 * chi lo stava ospitando.
 *
 * Per personalizzarlo bastano tre variabili, documentate in .env.example.
 */

export const PORTALE = {
  /** Il nome in cima al cancello. */
  nome: process.env.NEXT_PUBLIC_PORTAL_NAME?.trim() || "VESTA",

  /** La riga sotto al nome. */
  sottotitolo:
    process.env.NEXT_PUBLIC_PORTAL_TAGLINE?.trim() ||
    "Accesso riservato a chi ha un invito",

  /**
   * Percorso o indirizzo del segno da mostrare.
   *
   * Può essere un percorso assoluto servito dal dominio che ospita l'app
   * (per esempio /assets/logo.png): quando VESTA gira dentro un altro sito,
   * quel file appartiene a quel sito e non deve entrare qui dentro.
   */
  logo: process.env.NEXT_PUBLIC_PORTAL_LOGO?.trim() || "",
} as const;

/** Vero se il portale è stato personalizzato da chi ospita l'app. */
export function portaleOspitato(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PORTAL_NAME?.trim());
}
