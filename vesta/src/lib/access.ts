/**
 * Cancello a codice d'invito davanti a tutta l'applicazione.
 *
 * COSA FA: tiene fuori chi passa per caso, finché l'MVP non è pronto per
 * essere giudicato da chiunque.
 *
 * COSA NON FA: non è una misura di sicurezza. È un codice condiviso; chi ce
 * l'ha può darlo a chiunque, e non c'è modo di saperlo. I dati veri non sono
 * protetti da questo, ma dall'accesso via email e dalle regole del database,
 * che restano in piedi anche se il codice gira.
 *
 * SE `ACCESS_CODE` NON È IMPOSTATA, IL CANCELLO È APERTO. È voluto: un errore
 * di configurazione deve lasciare il sito visitabile, non spegnerlo del tutto.
 * Per accendere la protezione basta mettere la variabile su Vercel.
 */

export const COOKIE_ACCESSO = "vesta_accesso";

/** Un mese: abbastanza da non richiederlo a ogni visita durante le prove. */
export const DURATA_ACCESSO_S = 60 * 60 * 24 * 30;

/** Il codice atteso, o null se la protezione è spenta. */
export function codiceRichiesto(): string | null {
  const valore = process.env.ACCESS_CODE?.trim();
  return valore ? valore : null;
}

/** Rotte che restano raggiungibili anche senza codice. */
export function esenteDaCodice(pathname: string): boolean {
  return (
    pathname === "/accesso" ||
    // Senza questi, la pagina del codice si vedrebbe senza stili e senza
    // il logo: il cancello sembrerebbe rotto invece che chiuso.
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png"
  );
}
