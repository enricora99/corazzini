/**
 * Cancello a codice d'invito davanti a tutta l'applicazione.
 *
 * COSA FA: tiene fuori chi passa per caso, finché non è pronta per chiunque.
 *
 * COSA NON FA: non è una misura di sicurezza. Sono codici condivisi; chi ne
 * ha uno può darlo a chiunque, e non c'è modo di saperlo. I dati veri non
 * sono protetti da questo ma dall'accesso via email e dalle regole del
 * database, che restano in piedi anche se un codice gira.
 *
 * SE NON È IMPOSTATO NESSUN CODICE, IL CANCELLO È APERTO. È voluto: un errore
 * di configurazione deve lasciare il sito visitabile, non spegnerlo del tutto.
 */

export const COOKIE_ACCESSO = "vesta_accesso";

/** Un mese: abbastanza da non richiederlo a ogni visita durante le prove. */
export const DURATA_ACCESSO_S = 60 * 60 * 24 * 30;

/**
 * I codici validi.
 *
 * `ACCESS_CODES` accetta più codici separati da virgola, così se ne può dare
 * uno diverso a ciascuno: si scopre chi è entrato e si revoca il singolo
 * senza togliere l'accesso a tutti gli altri.
 *
 * `ACCESS_CODE` al singolare resta accettato, per non rompere nulla.
 */
export function codiciValidi(): string[] {
  const grezzo =
    process.env.ACCESS_CODES?.trim() || process.env.ACCESS_CODE?.trim() || "";

  return grezzo
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function protezioneAttiva(): boolean {
  return codiciValidi().length > 0;
}

/**
 * Confronto senza distinzione fra maiuscole e minuscole.
 *
 * Un codice si detta a voce o si copia da un messaggio: pretendere le
 * maiuscole esatte produce solo gente che crede di essere stata esclusa.
 * Non toglie nulla: chi ha il codice ha il codice comunque.
 */
export function codiceCorretto(inserito: string): string | null {
  const pulito = inserito.trim().toLowerCase();
  return codiciValidi().find((c) => c.toLowerCase() === pulito) ?? null;
}

/** Rotte che restano raggiungibili anche senza codice. */
export function esenteDaCodice(pathname: string): boolean {
  return (
    pathname === "/accesso" ||
    // Senza questi, la pagina del codice si vedrebbe senza stili e senza
    // logo: il cancello sembrerebbe rotto invece che chiuso.
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png"
  );
}
