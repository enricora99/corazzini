/**
 * Identità del portale che sta davanti all'applicazione.
 *
 * VESTA può girare dentro il sito di qualcun altro, e in quel caso il
 * cancello d'ingresso non è suo: è di chi ospita. Nome, sottotitolo, logo,
 * colori e icona arrivano tutti da variabili d'ambiente e niente è scritto
 * nel codice, così chi scarica il progetto si ritrova un portale generico
 * senza tracce di chi lo stava ospitando.
 *
 * Anche i colori sono variabili, non solo i testi: un cancello col marchio
 * di uno studio professionale e i colori di un'app di moda sarebbe più
 * stonato che lasciarlo senza marchio del tutto.
 */

function leggi(nome: string): string {
  return process.env[nome]?.trim() || "";
}

export const PORTALE = {
  /** La parola principale, in carattere con grazie quando c'è un sottomarchio. */
  nome: leggi("NEXT_PUBLIC_PORTAL_NAME") || "VESTA",

  /**
   * La parola piccola sotto al nome, in maiuscoletto spaziato.
   * Serve a distinguere una sezione dal sito che la ospita.
   */
  sottomarchio: leggi("NEXT_PUBLIC_PORTAL_SUB"),

  sottotitolo:
    leggi("NEXT_PUBLIC_PORTAL_TAGLINE") ||
    "Accesso riservato a chi ha un invito",

  /**
   * Percorso del segno da mostrare.
   *
   * Può essere un percorso assoluto servito dal dominio che ospita l'app:
   * quel file appartiene a quel sito e non deve entrare qui dentro.
   */
  logo: leggi("NEXT_PUBLIC_PORTAL_LOGO"),

  /** Icona della scheda del browser, se chi ospita ne vuole una sua. */
  favicon: leggi("NEXT_PUBLIC_PORTAL_FAVICON"),

  /** Colore d'azione. Se non c'è, resta il giallo di VESTA. */
  accento: leggi("NEXT_PUBLIC_PORTAL_ACCENT"),
  accentoScuro: leggi("NEXT_PUBLIC_PORTAL_ACCENT_DARK"),

  /** Colore del testo sopra l'accento: bianco su un blu, scuro su un giallo. */
  accentoTesto: leggi("NEXT_PUBLIC_PORTAL_ACCENT_ON") || "#ffffff",
} as const;

/** Vero se il portale è stato personalizzato da chi ospita l'app. */
export function portaleOspitato(): boolean {
  return Boolean(leggi("NEXT_PUBLIC_PORTAL_NAME"));
}

/** Il titolo della scheda del browser: solo il marchio, senza aggiunte. */
export function titoloPortale(): string {
  return PORTALE.sottomarchio
    ? `${PORTALE.nome} ${PORTALE.sottomarchio}`
    : PORTALE.nome;
}
