#!/usr/bin/env node
/*
 * Prepara uno zip del progetto da portare su un altro PC.
 *
 * Esclude `node_modules` (decine di migliaia di file, lentissimi da copiare su
 * USB, e con dentro binari compilati per questa macchina) e `.next`, che si
 * rigenera da solo. Esclude anche `.env.local`: contiene la chiave di
 * amministrazione di Supabase, e una chiavetta si perde.
 *
 * Sull'altro PC: scompatti, `npm install`, ricrei `.env.local` da
 * `.env.example`, `npm run dev`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const EXCLUDE = [
  "node_modules",
  ".next",
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  "certificates",
  "*.zip",
  "*.tsbuildinfo",
];

const stamp = new Date().toISOString().slice(0, 10);
const outName = `vesta-${stamp}.zip`;
const outPath = join(root, outName);

if (existsSync(outPath)) rmSync(outPath);

// bsdtar è presente in Windows 10+, macOS e nella gran parte delle distro
// Linux, e con -a deduce il formato zip dall'estensione. Un solo comando,
// nessuna dipendenza da installare.
const args = [
  "-a",
  "-c",
  "-f",
  outPath,
  ...EXCLUDE.flatMap((pattern) => ["--exclude", pattern]),
  ".",
];

try {
  execFileSync("tar", args, { cwd: root, stdio: "inherit" });
} catch (error) {
  console.error(
    "\nNon sono riuscito a creare lo zip con `tar`.\n" +
      "In alternativa copia la cartella a mano, saltando node_modules, .next e .env.local.\n"
  );
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log(`
Pronto: ${outName}

Sull'altro PC:
  1. scompatta lo zip
  2. npm install
  3. copia .env.example in .env.local e rimetti le chiavi
  4. npm run dev

Le chiavi non sono nello zip, di proposito.
`);
