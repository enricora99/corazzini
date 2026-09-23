#!/usr/bin/env node
/*
 * Genera le immagini segnaposto dei capi per la modalità demo.
 *
 *   node scripts/build-demo-assets.mjs
 *
 * Sono sagome disegnate qui, non fotografie: appartengono al progetto e
 * possono essere distribuite senza pensarci.
 *
 * Nella demo dal vivo non si vedono quasi mai, perché sopra ci sono le
 * fotografie vere dell'armadio (vedi `import-foto-demo.mjs`). Si vedono nel
 * pacchetto che si scarica, dove le fotografie non entrano, e ogni volta
 * che un capo la sua foto non ce l'ha ancora.
 *
 * Basta rilanciare lo script dopo aver cambiato CAPI qui sotto, e tenere
 * l'elenco allineato a quello di `import-foto-demo.mjs`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");
const cartella = join(radice, "public", "demo");

/** Sagome in un riquadro 400×400, coordinate già centrate. */
const SAGOME = {
  top: `<path d="M140 110 L110 140 L85 115 L130 70 L160 62 Q200 92 240 62 L270 70 L315 115 L290 140 L260 110 L260 330 L140 330 Z"/>`,

  camicia: `<path d="M140 110 L110 140 L85 115 L130 70 L165 60 L200 105 L235 60 L270 70 L315 115 L290 140 L260 110 L260 330 L140 330 Z"/>
            <path d="M200 105 L200 330" stroke-width="5" stroke-linecap="round" fill="none"/>`,

  giacca: `<path d="M138 108 L104 140 L78 112 L128 66 L168 56 L200 112 L232 56 L272 66 L322 112 L296 140 L262 108 L262 340 L138 340 Z"/>
           <path d="M168 56 L200 112 L232 56" stroke-width="6" fill="none" stroke-linejoin="round"/>`,

  pantaloni: `<path d="M136 66 L264 66 L258 340 L212 340 L200 176 L188 340 L142 340 Z"/>`,

  gonna: `<path d="M148 70 L252 70 L296 316 L104 316 Z"/>
          <path d="M148 104 L252 104" stroke-width="5" fill="none"/>`,

  vestito: `<path d="M146 104 L116 134 L92 110 L136 68 L164 60 Q200 88 236 60 L264 68 L308 110 L284 134 L254 104 L286 344 L114 344 Z"/>`,

  scarpe: `<path d="M84 196 L150 196 L186 232 L286 250 Q316 256 316 278 L316 296 L84 296 Z"/>
           <path d="M84 272 L316 272" stroke-width="5" fill="none"/>`,

  accessorio: `<path d="M136 128 L264 128 L286 168 L286 312 Q286 328 270 328 L130 328 Q114 328 114 312 L114 168 Z"/>
               <path d="M160 128 Q160 78 200 78 Q240 78 240 128" stroke-width="12" fill="none" stroke-linecap="round"/>`,
};

/** I capi dell'armadio dimostrativo. La chiave diventa il nome del file. */
const CAPI = [
  { slug: "t-shirt-bianca", sagoma: "top", colore: "#EFEDE6", bordo: "#C9C4B6" },
  { slug: "t-shirt-marrone", sagoma: "top", colore: "#5C3B35" },
  { slug: "polo-righe", sagoma: "camicia", colore: "#3B3F46" },
  { slug: "camicia-righe", sagoma: "camicia", colore: "#4A4E55" },
  { slug: "maglione-righe", sagoma: "top", colore: "#C6B49B" },
  { slug: "jeans-chiari", sagoma: "pantaloni", colore: "#A8C1D8" },
  { slug: "jeans-scuri", sagoma: "pantaloni", colore: "#2B3450" },
  { slug: "jeans-larghi", sagoma: "pantaloni", colore: "#6C89A8" },
  { slug: "pantaloni-tuta", sagoma: "pantaloni", colore: "#7B3B47" },
  { slug: "shorts-denim", sagoma: "pantaloni", colore: "#9FBBD3" },
  { slug: "giacca-denim", sagoma: "giacca", colore: "#86A7C4" },
  { slug: "sneakers-bianche", sagoma: "scarpe", colore: "#E4E6E9", bordo: "#B4B8BE" },
  { slug: "scarpe-corsa", sagoma: "scarpe", colore: "#EFEDE6", bordo: "#C9C4B6" },
  { slug: "borsa-denim", sagoma: "accessorio", colore: "#5E7B99" },

  // Degli amici: nella griglia compaiono con «di …».
  { slug: "jeans-paisley", sagoma: "pantaloni", colore: "#5D7FA6" },
  { slug: "sneakers-rosa", sagoma: "scarpe", colore: "#C9908E" },
  { slug: "sneakers-multicolore", sagoma: "scarpe", colore: "#3D63C4" },

  // Questi tre non stanno nell'armadio di partenza: servono al flusso
  // «fotografa un capo», dove l'utente ne aggiunge uno che non c'era.
  { slug: "felpa-beige", sagoma: "top", colore: "#CFC0AC" },
  { slug: "sneakers-marroni", sagoma: "scarpe", colore: "#7A4F35" },
  { slug: "borsa-rosa", sagoma: "accessorio", colore: "#E3A6BC" },
];

/** Fondo: una velatura chiarissima del colore del capo, così le miniature
 *  nella griglia non sembrano tutte lo stesso rettangolo grigio. */
function fondo(colore) {
  const n = parseInt(colore.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const verso = (v) => Math.round(v + (250 - v) * 0.88);
  return `rgb(${verso(r)}, ${verso(g)}, ${verso(b)})`;
}

mkdirSync(cartella, { recursive: true });

for (const capo of CAPI) {
  const sagoma = SAGOME[capo.sagoma];
  if (!sagoma) throw new Error(`sagoma sconosciuta: ${capo.sagoma}`);

  const tratto = capo.bordo ?? capo.colore;

  // Inquadratura stretta sul contenuto (che vive fra 78-322 e 56-344):
  // a tutto riquadro il capo resterebbe piccolo in mezzo al vuoto.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="52 46 296 296" width="400" height="400" role="img">
  <rect x="0" y="0" width="400" height="400" fill="${fondo(capo.colore)}"/>
  <g fill="${capo.colore}" stroke="${tratto}" stroke-width="7" stroke-linejoin="round">
    ${sagoma.trim()}
  </g>
</svg>
`;

  writeFileSync(join(cartella, `${capo.slug}.svg`), svg, "utf8");
}

console.log(`${CAPI.length} segnaposto scritti in public/demo/`);
