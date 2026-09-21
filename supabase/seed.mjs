/**
 * Crea l'account dimostrativo per la presentazione.
 *
 *   npm run seed
 *
 * Crea l'utente, conferma l'email e la maggiore età, e — se gli passi una
 * cartella di fotografie — carica i capi e li classifica col modello.
 *
 *   npm run seed -- ./foto-demo
 *
 * Le foto NON sono incluse nel repository: le mette il team, come da
 * specifica. Nessuna immagine presa dal web.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");

function caricaEnv() {
  try {
    const testo = readFileSync(join(radice, ".env.local"), "utf8");
    for (const riga of testo.split("\n")) {
      const trovato = riga.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!trovato) continue;
      const [, chiave, valore] = trovato;
      if (!process.env[chiave]) {
        process.env[chiave] = valore.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* le variabili possono arrivare dall'ambiente */
  }
}

caricaEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE) {
  console.error(
    "\nMancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY in .env.local.\n"
  );
  process.exit(1);
}

const EMAIL = process.env.SEED_EMAIL ?? "demo@vesta.test";
const PASSWORD = process.env.SEED_PASSWORD ?? "VestaDemo2026!";

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

// --- 1. L'utente ------------------------------------------------------------

console.log(`\nAccount dimostrativo: ${EMAIL}`);

const { data: esistenti } = await admin.auth.admin.listUsers({ perPage: 1000 });
let utente = esistenti?.users?.find((u) => u.email === EMAIL);

if (utente) {
  console.log("  già presente, lo riuso.");
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) {
    console.error(`  creazione fallita: ${error.message}`);
    process.exit(1);
  }
  utente = data.user;
  console.log("  creato.");
}

// Il trigger crea il profilo alla registrazione; la conferma di maggiore età
// la mettiamo noi, altrimenti la demo si ferma al gate.
const { error: erroreProfilo } = await admin
  .from("profiles")
  .update({
    display_name: "Demo",
    adult_confirmed_at: new Date().toISOString(),
  })
  .eq("id", utente.id);

if (erroreProfilo) {
  console.error(`  profilo non aggiornato: ${erroreProfilo.message}`);
} else {
  console.log("  profilo pronto, maggiore età confermata.");
}

// --- 2. Le foto, se ce ne sono ---------------------------------------------

const cartella = process.argv[2];

if (!cartella) {
  console.log(
    [
      "",
      "Nessuna cartella di foto indicata: l'account è pronto ma l'armadio è vuoto.",
      "",
      "Per riempirlo, metti le foto dei capi in una cartella e rilancia:",
      "",
      "    npm run seed -- ./foto-demo",
      "",
      "Le foto le fornisce il team: non usiamo immagini prese dal web.",
      "",
      `Credenziali: ${EMAIL} / ${PASSWORD}`,
      "",
    ].join("\n")
  );
  process.exit(0);
}

const percorso = resolve(process.cwd(), cartella);

let file;
try {
  file = readdirSync(percorso).filter((f) =>
    [".jpg", ".jpeg", ".png", ".webp"].includes(extname(f).toLowerCase())
  );
} catch {
  console.error(`\nNon riesco a leggere la cartella: ${percorso}\n`);
  process.exit(1);
}

if (file.length === 0) {
  console.error(`\nNessuna immagine in ${percorso}\n`);
  process.exit(1);
}

console.log(`\n${file.length} immagini da caricare.\n`);

const CHIAVE_AI = process.env.GEMINI_API_KEY;
const MODELLO = process.env.AI_TEXT_MODEL ?? "gemini-2.5-flash";

if (!CHIAVE_AI) {
  console.log(
    "  GEMINI_API_KEY assente: carico le foto senza classificarle.\n" +
      "  I capi finiranno come «top» e li correggerai dall'app.\n"
  );
}

const TIPI = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function classifica(bytes, mimeType) {
  if (!CHIAVE_AI) return null;

  const risposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELLO}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": CHIAVE_AI,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Cataloga il capo di abbigliamento in questa foto.",
                  "Rispondi in JSON con: category (top, pantaloni, gonna, vestito, giacca, scarpe, accessorio),",
                  "subcategory (due o tre parole in italiano), colors (array di colori in italiano),",
                  "seasons (array fra primavera, estate, autunno, inverno),",
                  "style (casual, formale, sportivo, elegante), warmth (intero da 1 a 5).",
                ].join(" "),
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: bytes.toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!risposta.ok) return null;

  const dati = await risposta.json();
  const testo = dati?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");

  try {
    return JSON.parse(testo.replace(/^```(?:json)?|```$/g, "").trim());
  } catch {
    return null;
  }
}

let caricati = 0;

for (const nome of file) {
  const completo = join(percorso, nome);
  if (!statSync(completo).isFile()) continue;

  const bytes = readFileSync(completo);
  const mimeType = TIPI[extname(nome).toLowerCase()] ?? "image/jpeg";

  const id = randomUUID();
  const photoPath = `${utente.id}/${id}${extname(nome).toLowerCase()}`;

  const { error: erroreFile } = await admin.storage
    .from("items")
    .upload(photoPath, bytes, { contentType: mimeType, upsert: true });

  if (erroreFile) {
    console.log(`  ✗ ${basename(nome)} — ${erroreFile.message}`);
    continue;
  }

  const attributi = await classifica(bytes, mimeType);

  const { error: erroreRiga } = await admin.from("items").insert({
    id,
    user_id: utente.id,
    photo_path: photoPath,
    category: attributi?.category ?? "top",
    subcategory: attributi?.subcategory ?? null,
    colors: attributi?.colors ?? [],
    seasons: attributi?.seasons ?? [],
    style: attributi?.style ?? null,
    warmth: attributi?.warmth ?? null,
    ai_classified: Boolean(attributi),
  });

  if (erroreRiga) {
    console.log(`  ✗ ${basename(nome)} — ${erroreRiga.message}`);
    continue;
  }

  caricati++;
  console.log(
    `  ✓ ${basename(nome)} → ${attributi?.subcategory ?? attributi?.category ?? "da correggere"}`
  );
}

console.log(
  [
    "",
    `${caricati} capi nell'armadio dell'account dimostrativo.`,
    "",
    `Credenziali: ${EMAIL} / ${PASSWORD}`,
    "",
    "Nota: l'app entra con un link via email. Per la demo puoi entrare con",
    "la password da Supabase, oppure chiedere il link e aprirlo dalla casella.",
    "",
  ].join("\n")
);
