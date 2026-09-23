#!/usr/bin/env node
/*
 * Trasforma delle fotografie qualsiasi nell'armadio della demo.
 *
 *   node scripts/import-foto-demo.mjs [cartella]     (default: foto-demo/)
 *
 * COSA SERVE: una foto per capo, nominata come il capo. I nomi validi li
 * stampa lo script stesso se ne trova di sconosciuti. Formato e dimensione
 * non contano, il taglio nemmeno: basta che il capo sia su uno sfondo
 * uniforme (un lenzuolo, un muro, un tavolo chiaro).
 *
 * COSA FA: ritaglia via lo sfondo attorno al capo, mette tutto in un
 * quadrato della stessa misura e con lo stesso fondo, e scrive i PNG in
 * public/demo/.
 *
 * PERCHÉ IMPORTA: quindici foto scattate bene ma inquadrate ognuna a modo
 * suo continuano a sembrare quindici foto. Un armadio sembra un armadio
 * quando i capi stanno tutti nella stessa cornice - ed è quella cornice,
 * non la risoluzione, che davanti a una giuria fa la differenza fra
 * «un'app» e «delle immagini messe in una griglia».
 *
 * I capi senza fotografia restano al disegno di prima: la demo non si
 * rompe mai a metà, peggiora al massimo un capo per volta.
 */

import { createRequire } from "node:module";
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

// sharp arriva insieme a Next: non è una dipendenza in più, ma non è nemmeno
// dichiarata fra le nostre. Se un giorno Next smettesse di portarselo dietro,
// è questo `require` a rompersi, e il messaggio sotto dice cosa fare.
const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error(
    "Manca sharp. Arriva insieme a Next: prova `npm install`.\n" +
      "Se Next non se lo porta più dietro, va aggiunto alle dipendenze."
  );
  process.exit(1);
}

const RADICE = join(dirname(fileURLToPath(import.meta.url)), "..");

/** I capi dell'armadio demo. Sono i nomi dei file che lo script si aspetta. */
const CAPI = [
  // Sopra
  "t-shirt-bianca",
  "t-shirt-marrone",
  "polo-righe",
  "camicia-righe",
  "maglione-righe",
  // Sotto
  "jeans-chiari",
  "jeans-scuri",
  "jeans-larghi",
  "pantaloni-tuta",
  "shorts-denim",
  // Sopra di tutto
  "giacca-denim",
  // Ai piedi
  "sneakers-bianche",
  "scarpe-corsa",
  // In mano
  "borsa-denim",

  // Degli amici: nella griglia compaiono con «di ...».
  "jeans-paisley",
  "sneakers-rosa",
  "sneakers-multicolore",

  // Questi tre non stanno nell'armadio di partenza: sono i capi che si
  // aggiungono durante la dimostrazione, per far vedere il riconoscimento.
  "felpa-beige",
  "sneakers-marroni",
  "borsa-rosa",
];

const LATO = 640;
/**
 * Un margine attorno al capo: incollato ai bordi sembra tagliato male.
 *
 * Il lato sta a 640 e non piu' in alto di proposito: le foto di catalogo
 * arrivano intorno ai 640 di altezza, e un quadrato piu' grande le
 * ingrandirebbe soltanto - piu' peso, stessa nitidezza.
 */
const MARGINE = 40;

/**
 * Il colore con cui riempire il quadrato attorno al capo.
 *
 * Non è bianco fisso: è il fondo della fotografia stessa, preso dall'angolo.
 * Un lenzuolo fotografato col telefono non è mai bianco pieno, e riempire
 * col bianco lascia un rettangolo più caldo in mezzo al quadrato - la
 * giuntura si vede, e si vede che l'immagine è stata montata.
 */
async function fondoDellaFoto(percorso) {
  const { data } = await sharp(percorso)
    .extract({ left: 0, top: 0, width: 24, height: 24 })
    .resize(1, 1, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { r: data[0], g: data[1], b: data[2], alpha: 1 };
}

const cartella = join(RADICE, process.argv[2] ?? "foto-demo");
const destinazione = join(RADICE, "public", "demo");

let file = [];
try {
  file = readdirSync(cartella);
} catch {
  console.error(`Non trovo la cartella ${cartella}.`);
  console.error(`Mettici una foto per capo, nominata così:\n  ${CAPI.join(".jpg\n  ")}.jpg`);
  process.exit(1);
}

mkdirSync(destinazione, { recursive: true });

const fatti = [];
const sconosciuti = [];

for (const nome of file) {
  const slug = basename(nome, extname(nome));
  if (!CAPI.includes(slug)) {
    sconosciuti.push(nome);
    continue;
  }

  const dentro = join(cartella, nome);
  const fondo = await fondoDellaFoto(dentro);

  // `trim` toglie la cornice di sfondo uniforme attorno al soggetto. La
  // soglia è generosa: su una foto vera il «bianco» non è mai lo stesso
  // bianco in tutti gli angoli, e una soglia stretta non taglierebbe nulla.
  const ritagliato = await sharp(dentro)
    .trim({ threshold: 12 })
    .resize(LATO - MARGINE * 2, LATO - MARGINE * 2, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .toBuffer();

  const { width, height } = await sharp(ritagliato).metadata();

  await sharp({
    create: { width: LATO, height: LATO, channels: 4, background: fondo },
  })
    .composite([
      {
        input: ritagliato,
        left: Math.round((LATO - width) / 2),
        top: Math.round((LATO - height) / 2),
      },
    ])
    // WebP e non PNG. Il PNG non comprime le fotografie: lo stesso armadio
    // pesava 5,7 MB, che su una connessione di sala si vedono tutti. Qui la
    // qualità è alta e il peso scende di circa dieci volte — su capi su
    // fondo bianco la differenza non si vede, quella nell'attesa sì.
    .webp({ quality: 82, effort: 6 })
    .toFile(join(destinazione, `${slug}.webp`));

  fatti.push(slug);
  console.log(`  ${slug}`);
}

// L'elenco dice all'applicazione quali capi hanno una fotografia vera. Gli
// altri continuano a usare il disegno, senza che nessuno debba ricordarsi
// di aggiornare due posti.
fatti.sort();
writeFileSync(
  join(RADICE, "src", "lib", "demo", "foto.json"),
  JSON.stringify(fatti, null, 2) + "\n"
);

const mancanti = CAPI.filter((c) => !fatti.includes(c));

console.log(`\n${fatti.length} capi fotografati su ${CAPI.length}.`);
if (mancanti.length) console.log(`Restano al disegno: ${mancanti.join(", ")}`);
if (sconosciuti.length) {
  console.log(`\nNomi non riconosciuti (ignorati): ${sconosciuti.join(", ")}`);
  console.log(`I nomi validi sono:\n  ${CAPI.join("\n  ")}`);
}
