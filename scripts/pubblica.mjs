#!/usr/bin/env node
/*
 * Pubblica entrambi i progetti Vercel di questa repo.
 *
 *   node scripts/pubblica.mjs
 *
 * PERCHÉ ESISTE: questa repo alimenta due progetti Vercel distinti — il sito
 * dello studio (radice) e VESTA (cartella vesta/) — e nessuno dei due è
 * collegato a GitHub, quindi `git push` non pubblica niente.
 *
 * È già successo di modificare il sito, pubblicare solo VESTA e credere che
 * fosse online: la biografia aggiornata è rimasta invisibile per ore. Uno
 * script che li fa tutti e due toglie di mezzo quella classe di errore.
 *
 * Quando i progetti saranno collegati a GitHub questo file non servirà più.
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");

const PROGETTI = [
  { nome: "sito dello studio", cartella: radice },
  { nome: "VESTA", cartella: join(radice, "vesta") },
];

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
let falliti = 0;

for (const p of PROGETTI) {
  console.log(`\n── ${p.nome} ──`);

  const esito = spawnSync(
    npx,
    ["--yes", "vercel", "deploy", "--prod", "--yes"],
    { cwd: p.cartella, encoding: "utf8", shell: false }
  );

  const uscita = `${esito.stdout ?? ""}${esito.stderr ?? ""}`;
  const indirizzo = uscita.match(/https:\/\/[a-z0-9-]+\.vercel\.app/i)?.[0];

  if (esito.status === 0) {
    console.log(`   pubblicato${indirizzo ? `: ${indirizzo}` : ""}`);
  } else {
    falliti++;
    console.error(`   FALLITO`);
    // Solo le righe che dicono qualcosa: il resto è rumore del CLI.
    for (const riga of uscita.split("\n")) {
      if (/error|Error|failed/i.test(riga)) console.error(`   ${riga.trim()}`);
    }
  }
}

if (falliti > 0) {
  console.error(`\n${falliti} progetto/i non pubblicato/i.\n`);
  process.exit(1);
}

console.log("\nEntrambi i progetti sono online.\n");
