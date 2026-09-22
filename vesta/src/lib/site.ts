/** Costanti del sito, in un posto solo così non si sdoppiano. */

export const CONTACT_EMAIL = "hello.vesta.team@gmail.com";

export const SITE_NAME = "VESTA";

const PREDEFINITO = "http://localhost:3000";

/**
 * Un indirizzo malformato qui faceva crollare il build con «Invalid URL» e
 * un riferimento a `metadataBase`, che non dice dove sia il problema vero.
 * Succede più facilmente di quanto sembri: basta che la variabile non sia
 * leggibile durante il build — su Vercel le variabili marcate come sensibili
 * non lo sono — e arriva vuota.
 *
 * Meglio ripiegare su localhost e lasciare una riga nei log che dice
 * esattamente quale variabile guardare.
 */
function indirizzoValido(valore: string | undefined): string {
  if (!valore) return PREDEFINITO;

  try {
    new URL(valore);
    return valore.replace(/\/+$/, "");
  } catch {
    console.error(
      `[site] NEXT_PUBLIC_SITE_URL non è un indirizzo valido: "${valore}". ` +
        `Uso ${PREDEFINITO}. Dev'essere completo di protocollo, per esempio ` +
        `https://www.esempio.it — e su Vercel NON può essere una variabile ` +
        `sensibile, perché le NEXT_PUBLIC_ servono già durante il build.`
    );
    return PREDEFINITO;
  }
}

export const SITE_URL = indirizzoValido(process.env.NEXT_PUBLIC_SITE_URL);
