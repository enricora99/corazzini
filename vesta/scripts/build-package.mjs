#!/usr/bin/env node
/*
 * Costruisce il pacchetto sorgente scaricabile: public/vesta-codice.zip
 *
 * Gira automaticamente prima di ogni build (npm lo esegue grazie al nome
 * `prebuild` in package.json), così il file che si scarica corrisponde
 * sempre al codice pubblicato invece di essere una copia vecchia
 * dimenticata nel repository.
 *
 * Dentro non finisce niente di chi ospita l'applicazione: l'identità del
 * portale vive nelle variabili d'ambiente, non nei file.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { creaZip } from "./lib/zip.mjs";

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");
const destinazione = join(radice, "public", "vesta-codice.zip");

/** Cartelle da non includere: pesanti, rigenerabili o private. */
const CARTELLE_ESCLUSE = new Set([
  "node_modules",
  ".next",
  ".vercel",
  ".git",
  ".claude",
  "certificates",
  // Le fotografie di partenza dell'armadio demo: sono immagini di catalogo
  // altrui, servono solo a rigenerare le miniature e non vanno distribuite.
  "foto-demo",
]);

/** Il file dell'elenco delle fotografie, come lo scrive lo script d'import. */
const ELENCO_FOTO = join("src", "lib", "demo", "foto.json");

/** File da non includere. */
function fileEscluso(percorso) {
  const nome = percorso.split(sep).pop() ?? "";
  const relativo = relative(radice, percorso);

  return (
    // Le chiavi vere non escono da qui. .env.example sì: serve a chi legge.
    (nome.startsWith(".env") && nome !== ".env.example") ||
    nome === "vesta-codice.zip" ||
    nome.endsWith(".tsbuildinfo") ||
    nome.endsWith(".zip") ||
    // Le fotografie dei capi. Chi riceve il pacchetto trova i disegni, che
    // sono nostri: le foto dell'armadio sono immagini di catalogo, buone a
    // far vedere l'app dal vivo ma non da mettere dentro un file che gira.
    (relativo.startsWith(join("public", "demo")) && nome.endsWith(".png"))
  );
}

function raccogli(cartella, dentro = []) {
  for (const voce of readdirSync(cartella)) {
    const percorso = join(cartella, voce);
    const info = statSync(percorso);

    if (info.isDirectory()) {
      if (CARTELLE_ESCLUSE.has(voce)) continue;
      raccogli(percorso, dentro);
    } else if (!fileEscluso(percorso)) {
      dentro.push(percorso);
    }
  }
  return dentro;
}

// --- La guida al codice, scritta per chi lo riceve e non l'ha mai visto ----

const GUIDA = `# VESTA — guida al codice

Questo pacchetto contiene il sorgente completo di VESTA: un'applicazione che
compone outfit a partire dai capi che una persona ha già nell'armadio.

È il codice vero, quello che gira in produzione — non un estratto né una
versione ridotta per la consegna.

---

## Partire da zero

Serve **Node.js 24** (la versione esatta è in \`.nvmrc\`).

\`\`\`bash
npm install
cp .env.example .env.local     # poi riempi .env.local
npm run dev
\`\`\`

Apri http://localhost:3000/dev — l'applicazione vive sotto un sottopercorso,
vedi più avanti il perché.

Senza chiavi funzionano la landing, le pagine legali e **tutta la modalità
demo** (\`/demo\`), che gira senza database e senza modelli. Per l'applicazione
vera servono un progetto Supabase e una chiave Gemini: la procedura è in
\`README.md\`.

---

## Come è fatto

\`\`\`
src/
├─ app/                   le rotte (App Router di Next.js)
│  ├─ (marketing)/        landing pubblica, privacy, cookie
│  ├─ app/                l'applicazione vera, dietro autenticazione
│  ├─ demo/               la stessa interfaccia con dati finti, senza login
│  ├─ admin/              metriche e costi
│  ├─ auth/               accesso via link nell'email
│  ├─ accesso/            cancello a codice d'invito
│  ├─ actions/            server action
│  └─ api/                classificazione, proposte, immagini, esportazione
├─ components/
│  ├─ ui/                 componenti di base (shadcn/ui)
│  ├─ landing/            sezioni della landing
│  ├─ app/                l'interfaccia dell'applicazione
│  └─ demo/               i pezzi che esistono solo nella demo
├─ lib/
│  ├─ supabase/           client per browser, server e amministrazione
│  ├─ ai/                 fornitori dei modelli, prezzi, prompt, registro
│  ├─ dal.ts              Data Access Layer: qui si decide chi sei
│  ├─ items.ts            i capi e i collegamenti firmati alle foto
│  ├─ stats.ts            i numeri dell'armadio
│  ├─ quota.ts            tetto giornaliero e chiave di cache
│  └─ weather.ts          meteo da Open-Meteo
└─ proxy.ts               in Next.js 16 il middleware si chiama così
supabase/
├─ migrations/            schema, permessi, archivi delle immagini
└─ seed.mjs               account dimostrativo
tests/                    test sui permessi del database
\`\`\`

---

## Le sette decisioni che spiegano il resto

Se leggi solo una sezione, leggi questa: sono i punti in cui il codice fa
qualcosa di non ovvio, e il motivo per cui lo fa.

### 1. I permessi stanno nel database, non nell'applicazione

Ogni tabella ha la Row Level Security attiva. L'applicazione non filtra per
utente: chiede tutto e il database restituisce solo ciò che chi domanda ha il
diritto di vedere. Se domani una query venisse scritta male, i dati altrui
resterebbero comunque irraggiungibili.

Il punto delicato è la visibilità fra amici. Una policy su \`items\` che
interrogasse direttamente \`friendships\` scatenerebbe la policy di
\`friendships\`, che rileggerebbe la tabella: Postgres entra in ricorsione e la
query fallisce. Per questo la relazione passa da una funzione,
\`are_friends()\`, dichiarata \`security definer\`, che legge senza riattivare i
controlli.

Le policy di **scrittura** su \`items\` non citano \`are_friends()\`: un amico
guarda, non modifica.

\`npm test\` verifica tutto questo con tre utenti veri e tre sessioni vere,
compreso il caso che si sbaglia più spesso — **l'amicizia non è transitiva**:
se A è amico di B e B di C, C non vede i capi di A.

### 2. Ai modelli va solo il necessario

Per comporre gli outfit il modello riceve le *caratteristiche* dei capi —
categoria, colori, stagione, quanto coprono — mai le fotografie. La foto esce
una volta sola, al momento della classificazione, e non viene riusata.

È scritto nell'informativa privacy, quindi è un vincolo, non una preferenza.

### 3. Due freni ai costi, e uno è più importante dell'altro

- **Cache**: ogni immagine generata è indicizzata da
  \`sha256(id dei capi ordinati + occasione + modello)\`. La stessa richiesta
  non si rigenera. Gli id si ordinano prima di unirli: lo stesso outfit con i
  capi in ordine diverso è lo stesso outfit.
- **Tetto giornaliero**: un numero massimo di immagini al giorno per utente.

L'ordine dei controlli non è casuale — prima la cache, poi la quota. Una
richiesta già vista non consuma quota, perché non costa nulla.

### 4. Cambiare fornitore di modelli è configurazione, non codice

Sopra i fornitori c'è un'interfaccia sola (\`src/lib/ai/types.ts\"\`) e la scelta
si fa da \`.env.local\`. Non usiamo l'SDK di Google ma l'API REST con \`fetch\`:
una dipendenza in meno, e soprattutto sostituire il fornitore non richiede di
installare un SDK diverso per ognuno.

I prompt stanno fuori dai fornitori (\`src/lib/ai/prompts.ts\`) perché quello
dell'immagine è identico per tutti: cambia chi lo esegue, non cosa si chiede.

Quello che torna dal modello viene validato con zod anche quando il modello
dichiara di rispettare uno schema. Uno schema è una richiesta, non una
garanzia, e senza validazione un output malformato finirebbe dritto nel
database.

### 5. L'applicazione vive sotto un sottopercorso

\`basePath\` in \`next.config.ts\` la monta sotto \`/dev\`. Il valore viene
inlineato nel bundle al momento del build: si decide prima di costruire.

\`next/link\` aggiunge il prefisso da solo. Tre cose no, e per quelle c'è
\`conBase()\` in \`src/lib/base-path.ts\`:

- \`next/image\` con percorso assoluto
- le chiamate \`fetch\` verso le rotte API e gli \`<a href>\` nativi
- i percorsi dentro il manifest della web app

Il service worker è un file statico e non passa dal build: deduce il
sottopercorso da \`self.location.pathname\`, così il valore resta scritto in un
posto solo.

**Per servirla dalla radice di un dominio suo, basta mettere \`basePath\` a
stringa vuota.**

### 6. Chi sei lo decide il Data Access Layer, non il proxy

\`src/proxy.ts\` fa un controllo ottimistico sul cookie, solo per evitare il
lampo della pagina sbagliata. Il controllo che conta è in \`src/lib/dal.ts\`,
il più vicino possibile ai dati, e usa \`getClaims()\` — che verifica la firma
del token — invece di \`getSession()\`, che si limita a leggere il cookie. Un
cookie si fabbrica.

Un dettaglio che vale la pena conoscere: il filtro delle rotte del proxy
**non intercetta \`/\`** se scritto solo come modello generico. La radice va
elencata a parte, o la pagina che il cancello dovrebbe proteggere resta
aperta. È un inciampo noto di Next.js e costa caro perché non dà errori.

### 7. La modalità demo usa i componenti veri

\`/demo\` mostra l'applicazione con dati inventati, senza database, senza
chiavi e senza chiamare nessun modello — tutte le sue rotte sono statiche.

Ma non è un mockup: riusa i componenti di produzione (\`ItemGrid\`,
\`BottomNav\`, il form di revisione di \`add-item-sheet\`). Così quello che si
vede nella demo non può divergere da quello che vede un utente vero, e non
c'è una seconda interfaccia da tenere aggiornata.

Le immagini dei capi sono sagome disegnate da
\`scripts/build-demo-assets.mjs\`, non fotografie.

---

## I comandi

| Comando | Cosa fa |
|---|---|
| \`npm run dev\` | Sviluppo su http://localhost:3000/dev |
| \`npm run dev:https\` | Sviluppo in HTTPS, raggiungibile dal telefono |
| \`npm run build\` | Build di produzione |
| \`npm run lint\` | ESLint |
| \`npm run typecheck\` | TypeScript |
| \`npm run check\` | Lint + typecheck + build + controllo delle chiavi |
| \`npm test\` | Test sui permessi del database |
| \`npm run seed\` | Crea l'account dimostrativo |

\`npm run check:bundle\` merita una parola: prende i valori di tutte le
variabili di \`.env.local\` che **non** iniziano per \`NEXT_PUBLIC_\` e li cerca
dentro \`.next/static\`, cioè in ciò che viene servito a chiunque apra il sito.
Next dovrebbe già impedire che ci finiscano, ma «dovrebbe» non è una
garanzia: basta che qualcuno incolli una chiave in una costante dentro un
componente client e il meccanismo di Next non c'entra più nulla.

---

## Provare dal telefono

Non usare \`npm run dev\` con l'indirizzo IP: **la geolocalizzazione non
funziona su HTTP**, e senza posizione il meteo non parte. I browser la
concedono solo in contesto sicuro.

\`\`\`bash
npm run dev:https
\`\`\`

Vale anche per l'installazione come web app: per comparire fra le app
installabili servono un manifest valido **e** HTTPS.

---

## Cosa manca, detto chiaramente

- Le fotografie dei capi non sono incluse: nella demo ci sono disegni, e
  l'applicazione vera si riempie con le foto di chi la usa.
- I fornitori di immagini alternativi (Seedream, Qwen) sono scritti sulla
  forma documentata delle rispettive API ma **non sono mai stati eseguiti**.
  Gemini è l'unico percorso provato.
- Le pagine \`/privacy\` e \`/cookie\` riportano in cima l'avviso «Bozza da far
  verificare prima del lancio pubblico» e contengono segnaposto evidenziati
  dove serve una decisione. Vanno completate e fatte verificare da chi di
  dovere prima di aprire al pubblico.
- Il listino dei modelli in \`src/lib/ai/pricing.ts\` è una configurazione, non
  una verità: i fornitori cambiano i prezzi senza preavviso. I costi mostrati
  in \`/admin\` sono **stime**, ed è scritto anche lì.
`;

// --- Costruzione -----------------------------------------------------------

const file = raccogli(radice)
  .map((percorso) => ({
    nome: `vesta/${relative(radice, percorso).split(sep).join("/")}`,
    // L'elenco delle fotografie esce vuoto: i PNG non sono nel pacchetto, e
    // un elenco che li nomina farebbe cercare all'applicazione file che non
    // ci sono. Con l'elenco vuoto ogni capo ricade sul proprio disegno.
    contenuto:
      relative(radice, percorso) === ELENCO_FOTO
        ? Buffer.from("[]\n", "utf8")
        : readFileSync(percorso),
  }))
  .sort((a, b) => a.nome.localeCompare(b.nome));

file.unshift({
  nome: "vesta/GUIDA-AL-CODICE.md",
  contenuto: Buffer.from(GUIDA, "utf8"),
});

const zip = creaZip(file);

mkdirSync(dirname(destinazione), { recursive: true });
writeFileSync(destinazione, zip);

// Le informazioni sul pacchetto vanno accanto al pacchetto: chi sta per
// scaricare un file deve poter sapere quanto pesa e di quando è, senza
// doversi fidare di un numero scritto a mano da qualche parte nel codice.
const informazioni = {
  file: file.length,
  byte: zip.length,
  generatoIl: new Date().toISOString(),
};

writeFileSync(
  join(radice, "src", "lib", "pacchetto.json"),
  JSON.stringify(informazioni, null, 2) + "\n",
  "utf8"
);

const peso = (zip.length / 1024 / 1024).toFixed(2);
console.log(`vesta-codice.zip: ${file.length} file, ${peso} MB`);
