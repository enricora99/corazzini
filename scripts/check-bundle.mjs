#!/usr/bin/env node
/**
 * Verifica che nessun segreto sia finito nel codice che arriva al browser.
 *
 *   npm run check:bundle    (dopo npm run build)
 *
 * Prende i valori di tutte le variabili di .env.local che NON iniziano per
 * NEXT_PUBLIC_ e li cerca dentro .next/static, che è esattamente ciò che
 * viene servito a chiunque apra il sito.
 *
 * Next dovrebbe già impedirlo da solo, sostituendo con `undefined` ogni
 * variabile senza quel prefisso. Questo controllo esiste perché «dovrebbe»
 * non è una garanzia: basta che qualcuno incolli una chiave in una costante
 * dentro un componente client e il meccanismo di Next non c'entra più nulla.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");
const statica = join(radice, ".next", "static");

// --- I segreti da cercare ---------------------------------------------------

let segreti = [];

try {
  const testo = readFileSync(join(radice, ".env.local"), "utf8");

  for (const riga of testo.split("\n")) {
    const trovato = riga.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!trovato) continue;

    const [, nome, grezzo] = trovato;
    const valore = grezzo.replace(/^["']|["']$/g, "").trim();

    if (nome.startsWith("NEXT_PUBLIC_")) continue;
    // Valori corti o vuoti darebbero falsi allarmi: "5" si trova ovunque.
    if (valore.length < 12) continue;

    segreti.push({ nome, valore });
  }
} catch {
  console.log(
    "\nNessun .env.local da controllare. Il controllo ha senso solo con le chiavi vere.\n"
  );
  process.exit(0);
}

if (segreti.length === 0) {
  console.log("\nNessun segreto lungo abbastanza da cercare in .env.local.\n");
  process.exit(0);
}

// --- La scansione -----------------------------------------------------------

function tuttiIFile(cartella) {
  const risultato = [];
  let voci;
  try {
    voci = readdirSync(cartella);
  } catch {
    return risultato;
  }
  for (const voce of voci) {
    const percorso = join(cartella, voce);
    if (statSync(percorso).isDirectory()) {
      risultato.push(...tuttiIFile(percorso));
    } else {
      risultato.push(percorso);
    }
  }
  return risultato;
}

const file = tuttiIFile(statica).filter((f) =>
  /\.(js|mjs|css|json|map)$/.test(f)
);

if (file.length === 0) {
  console.error(
    "\n.next/static è vuoto. Esegui prima `npm run build`.\n"
  );
  process.exit(1);
}

const trovati = [];

for (const percorso of file) {
  const contenuto = readFileSync(percorso, "utf8");
  for (const segreto of segreti) {
    if (contenuto.includes(segreto.valore)) {
      trovati.push({ nome: segreto.nome, file: percorso.replace(radice, ".") });
    }
  }
}

// --- Esito ------------------------------------------------------------------

console.log(
  `\nControllati ${file.length} file di .next/static per ${segreti.length} segreti.`
);

if (trovati.length > 0) {
  console.error("\n  UNA CHIAVE È NEL BUNDLE DEL BROWSER\n");
  for (const t of trovati) {
    console.error(`  ${t.nome}  →  ${t.file}`);
  }
  console.error(
    "\nQuesto codice lo scarica chiunque apra il sito. Non pubblicare.\n" +
      "Cerca dove quella variabile viene usata da un componente client e spostala sul server.\n"
  );
  process.exit(1);
}

console.log("Nessun segreto nel codice servito al browser.\n");
