/**
 * Scrittore ZIP minimo, senza dipendenze.
 *
 * Perché non usare `tar`: sui server di Vercel c'è GNU tar, che non sa
 * produrre file zip — l'opzione che lo farebbe è di bsdtar, che lì non c'è.
 * E un .tar.gz a una giuria si consegna male.
 *
 * Perché non una libreria: il formato zip è pubblico e stabile dal 1989, e
 * quello che serve qui sono due intestazioni e un indice finale. Aggiungere
 * una dipendenza per centoventi righe di codice verificabile non conviene.
 *
 * Implementa il sottoinsieme che serve: file deflazionati, nessuna cartella
 * esplicita, nessuna cifratura, niente zip64. Basta ampiamente per un
 * progetto sorgente.
 */

import { deflateRawSync } from "node:zlib";

// --- CRC32, richiesto da ogni voce dell'archivio ---------------------------

const TABELLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = TABELLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Data e ora nel formato MS-DOS che lo zip si porta dietro dagli anni '80. */
function dataDos(d) {
  const ora =
    (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
  const giorno =
    ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { ora, giorno };
}

/**
 * Crea l'archivio.
 *
 * @param {{nome: string, contenuto: Buffer}[]} file
 *        `nome` è il percorso dentro l'archivio, con le barre in avanti.
 * @param {Date} quando data da scrivere su tutte le voci
 * @returns {Buffer}
 */
export function creaZip(file, quando = new Date()) {
  const { ora, giorno } = dataDos(quando);

  const pezzi = [];
  const indice = [];
  let posizione = 0;

  for (const f of file) {
    const nome = Buffer.from(f.nome.replace(/\\/g, "/"), "utf8");
    const crudo = f.contenuto;
    const compresso = deflateRawSync(crudo, { level: 9 });
    const crc = crc32(crudo);

    // Se comprimendo si guadagna nulla, si archivia così com'è: capita con
    // le immagini, che sono già compresse.
    const usaDeflate = compresso.length < crudo.length;
    const dati = usaDeflate ? compresso : crudo;
    const metodo = usaDeflate ? 8 : 0;

    const locale = Buffer.alloc(30);
    locale.writeUInt32LE(0x04034b50, 0); // firma
    locale.writeUInt16LE(20, 4); // versione minima
    locale.writeUInt16LE(0x0800, 6); // nomi in UTF-8
    locale.writeUInt16LE(metodo, 8);
    locale.writeUInt16LE(ora, 10);
    locale.writeUInt16LE(giorno, 12);
    locale.writeUInt32LE(crc, 14);
    locale.writeUInt32LE(dati.length, 18);
    locale.writeUInt32LE(crudo.length, 22);
    locale.writeUInt16LE(nome.length, 26);
    locale.writeUInt16LE(0, 28); // nessun campo extra

    pezzi.push(locale, nome, dati);

    indice.push({
      nome,
      crc,
      metodo,
      compressa: dati.length,
      originale: crudo.length,
      offset: posizione,
    });

    posizione += locale.length + nome.length + dati.length;
  }

  const inizioIndice = posizione;
  const voci = [];

  for (const v of indice) {
    const centrale = Buffer.alloc(46);
    centrale.writeUInt32LE(0x02014b50, 0); // firma
    centrale.writeUInt16LE(20, 4); // versione di chi ha scritto
    centrale.writeUInt16LE(20, 6); // versione minima per leggere
    centrale.writeUInt16LE(0x0800, 8); // nomi in UTF-8
    centrale.writeUInt16LE(v.metodo, 10);
    centrale.writeUInt16LE(ora, 12);
    centrale.writeUInt16LE(giorno, 14);
    centrale.writeUInt32LE(v.crc, 16);
    centrale.writeUInt32LE(v.compressa, 20);
    centrale.writeUInt32LE(v.originale, 24);
    centrale.writeUInt16LE(v.nome.length, 28);
    centrale.writeUInt16LE(0, 30); // extra
    centrale.writeUInt16LE(0, 32); // commento
    centrale.writeUInt16LE(0, 34); // numero del disco
    centrale.writeUInt16LE(0, 36); // attributi interni
    centrale.writeUInt32LE(0, 38); // attributi esterni
    centrale.writeUInt32LE(v.offset, 42);

    voci.push(centrale, v.nome);
    posizione += centrale.length + v.nome.length;
  }

  const coda = Buffer.alloc(22);
  coda.writeUInt32LE(0x06054b50, 0); // firma
  coda.writeUInt16LE(0, 4); // disco corrente
  coda.writeUInt16LE(0, 6); // disco dell'indice
  coda.writeUInt16LE(indice.length, 8);
  coda.writeUInt16LE(indice.length, 10);
  coda.writeUInt32LE(posizione - inizioIndice, 12);
  coda.writeUInt32LE(inizioIndice, 16);
  coda.writeUInt16LE(0, 20); // nessun commento

  return Buffer.concat([...pezzi, ...voci, coda]);
}
