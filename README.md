# VESTA

L'app che sceglie l'outfit con i vestiti che hai già.

Landing pubblica su `/`, applicazione su `/app`. Web app installabile (PWA),
niente app nativa.

---

## Cosa serve

- **Node.js 24** (la versione esatta sta in `.nvmrc`). Su Windows:
  `winget install OpenJS.NodeJS.LTS --source winget`
- Un progetto **Supabase** in regione Europe (Francoforte)
- Una chiave **Gemini** da [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

Il meteo arriva da Open-Meteo, che non richiede chiavi.

## Avvio

```bash
npm install
cp .env.example .env.local   # poi riempi .env.local
npm run dev
```

Apri http://localhost:3000.

Poi crea le tabelle: apri il progetto su Supabase, vai su **SQL Editor → New
query**, incolla tutto il contenuto di
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) ed
esegui. Crea tabelle, permessi, funzioni e i due archivi delle immagini.

Infine, in **Authentication → URL Configuration**, aggiungi
`http://localhost:3000/auth/callback` (e più avanti il dominio vero) fra i
*Redirect URLs*: senza, i link di accesso via email non tornano indietro.

La landing e le pagine legali funzionano anche senza chiavi. Il form della
lista d'attesa, l'accesso e tutta l'area `/app` hanno bisogno di Supabase:
senza, il form dice chiaramente che non riesce a registrarti invece di fingere
che sia andata bene.

## Variabili d'ambiente

Sono tutte documentate in [`.env.example`](.env.example), con scritto a cosa
servono. Le essenziali:

| Variabile | A cosa serve |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Dominio del sito, senza barra finale |
| `NEXT_PUBLIC_SUPABASE_URL` | Indirizzo del progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave pubblica (può stare nel browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave di amministrazione, **solo server** |
| `GEMINI_API_KEY` | Chiave per classificazione, proposte e immagini |
| `AI_IMAGE_DAILY_LIMIT` | Immagini generate al giorno per utente |
| `ADMIN_EMAILS` | Chi può aprire `/admin`, separate da virgola |

> **Regola:** solo le variabili con prefisso `NEXT_PUBLIC_` arrivano al
> browser. Se aggiungi una chiave, non darle mai quel prefisso.
>
> `SUPABASE_SERVICE_ROLE_KEY` scavalca tutte le regole di sicurezza del
> database e legge i dati di chiunque. Non va in chat, non va su git, non va
> su una chiavetta.

`npm run check:bundle` verifica che nessuno di quei valori sia finito nel
codice servito al browser. Gira da solo dentro `npm run check`.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Sviluppo su http://localhost:3000 |
| `npm run dev:https` | Sviluppo in HTTPS, raggiungibile dal telefono |
| `npm run build` | Build di produzione |
| `npm start` | Serve la build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run check` | Lint + typecheck + build + controllo delle chiavi |
| `npm test` | Test sui permessi del database |
| `npm run seed` | Crea l'account dimostrativo |
| `npm run pack:usb` | Zip pulito da portare su un altro PC |

## Provare dal telefono

Non usare `npm run dev` e l'indirizzo IP: **la geolocalizzazione non funziona
su HTTP**, e senza posizione il meteo non parte. I browser la concedono solo
in contesto sicuro. Quindi:

```bash
npm run dev:https
```

Poi apri `https://<ip-del-pc>:3000` dal telefono, sulla stessa rete. Il
certificato è autofirmato: il browser avvisa, accetti e prosegui. L'indirizzo
IP te lo stampa Next all'avvio, alla riga `Network`.

Vale anche per l'installazione della PWA: per comparire fra le app
installabili servono un manifest valido **e** HTTPS. Su iPhone si installa da
Safari con *Condividi → Aggiungi alla schermata Home*.

## Account dimostrativo

```bash
npm run seed                      # crea l'account, armadio vuoto
npm run seed -- ./foto-demo       # crea l'account e carica le foto
```

Le fotografie **le mette il team**: non sono nel repository e non usiamo
immagini prese dal web. Metti i file in una cartella e passala allo script:
li carica e li fa classificare dal modello, uno per uno.

## Portare il progetto su un altro PC

```bash
npm run pack:usb
```

Produce `vesta-AAAA-MM-GG.zip` **senza** `node_modules` (decine di migliaia di
file, lentissimi da copiare su USB, e con dentro binari compilati per questa
macchina), senza `.next` e senza `.env.local`.

Sull'altro PC:

1. scompatta lo zip
2. `npm install`
3. copia `.env.example` in `.env.local` e rimetti le chiavi
4. `npm run dev`

Le chiavi non sono nello zip di proposito. Se copi la cartella a mano invece
di usare lo script, **salta `node_modules` e `.next`**: si rigenerano da soli.

## Struttura

```
src/
├─ app/
│  ├─ (marketing)/       landing, privacy, cookie
│  ├─ app/               area riservata: armadio, outfit, amici, impostazioni
│  ├─ admin/             metriche e costi
│  ├─ auth/              accesso via link, conferma dei 18 anni
│  ├─ actions/           server action
│  └─ api/               classificazione, proposte, immagini, esportazione
├─ components/
│  ├─ ui/                shadcn/ui
│  ├─ landing/           sezioni della landing
│  ├─ auth/              form di accesso
│  └─ app/               componenti dell'area riservata
├─ lib/
│  ├─ supabase/          client browser, server, amministrazione
│  ├─ ai/                fornitori, prezzi, prompt, registro chiamate
│  ├─ dal.ts             Data Access Layer: qui il controllo di chi sei
│  ├─ items.ts           capi e collegamenti firmati
│  ├─ quota.ts           tetto giornaliero e chiave di cache
│  └─ weather.ts         Open-Meteo
└─ proxy.ts              in Next 16 il middleware si chiama così
supabase/
├─ migrations/           schema, permessi, archivi
└─ seed.mjs              account dimostrativo
tests/                   test sui permessi
scripts/                 pacchetto USB, controllo delle chiavi
```

## Come cambiare fornitore AI

Il codice non sa chi produce le risposte. Sopra i fornitori c'è un'interfaccia
sola, in `src/lib/ai/types.ts`, e la scelta si fa da `.env.local`:

```bash
# Testo e visione: classificazione dei capi e proposte di outfit
AI_TEXT_PROVIDER=gemini
AI_TEXT_MODEL=gemini-2.5-flash

# Immagini: gemini | seedream | qwen
AI_IMAGE_PROVIDER=gemini
AI_IMAGE_MODEL=gemini-2.5-flash-image
```

Cambiando `AI_IMAGE_PROVIDER` in `seedream` o `qwen` e mettendo la chiave
corrispondente (`SEEDREAM_API_KEY`, `QWEN_API_KEY`), l'immagine la genera
l'altro modello. Nessuna modifica al codice.

Le chiamate partono solo da route lato server. Non usiamo l'SDK di Google ma
l'API REST con `fetch`: una dipendenza in meno, e soprattutto sostituire il
fornitore resta davvero una questione di configurazione, invece di installare
un SDK diverso per ognuno.

> **Gemini è l'unico percorso provato.** Seedream e Qwen sono scritti sulla
> forma documentata delle rispettive API, ma non sono stati eseguiti perché
> non avevamo le chiavi. Prima di usarli, confronta indirizzo e nome del
> modello con la documentazione: stanno tutti in
> `src/lib/ai/providers/openai-compatible.ts`, in un posto solo.

### Per aggiungerne uno nuovo

1. Scrivi una classe che implementa `TextProvider` o `ImageProvider`
   (`src/lib/ai/types.ts`)
2. Aggiungila allo `switch` in `src/lib/ai/index.ts`
3. Metti il suo listino in `src/lib/ai/pricing.ts`

I prompt non si toccano: stanno in `src/lib/ai/prompts.ts` e sono gli stessi
per tutti.

## Dove leggere i costi

Ogni chiamata a un modello finisce nella tabella `ai_calls`, con fornitore,
modello, tipo, durata, token e **costo stimato in dollari**. Ci scrive solo il
server con la chiave di amministrazione: la tabella non ha policy di
inserimento, quindi un utente non può gonfiarsi né azzerarsi i costi.

La pagina **`/admin`** — aperta solo alle email in `ADMIN_EMAILS` — mostra:

- iscritti alla lista d'attesa e utenti registrati
- capi caricati, totale e media per utente
- proposte e immagini generate
- costo totale e costo medio per utente attivo, mese per mese

> Il costo è una **stima**, calcolata dal listino in
> [`src/lib/ai/pricing.ts`](src/lib/ai/pricing.ts). I fornitori cambiano i
> prezzi senza preavviso: prima di portare quelle cifre in un business plan,
> confrontatele con la fattura vera. Il file dice dove guardare.

«Utente attivo» vuol dire che quel mese ha fatto almeno una richiesta a un
modello. Chi si iscrive e non carica niente non entra nella media, altrimenti
il costo per utente sembrerebbe più basso di quello che è.

### I due freni ai costi

- **Tetto giornaliero**: `AI_IMAGE_DAILY_LIMIT` immagini generate al giorno
  per utente (5 di serie). Le proposte con le foto dei capi restano
  illimitate, perché non costano immagini.
- **Cache**: ogni immagine è indicizzata da `sha256(id dei capi ordinati +
  occasione + modello)`. La stessa richiesta non si rigenera, e non consuma
  quota.

## Sicurezza dei dati

Row Level Security attiva su tutte e sette le tabelle. Ognuno legge e scrive
solo i propri dati, più i capi degli amici **in sola lettura**.

Il punto delicato è proprio quello. Una policy su `items` che interrogasse
direttamente `friendships` scatenerebbe la policy di `friendships`, che
rileggerebbe la tabella: Postgres va in ricorsione e la query fallisce. Per
questo la relazione passa da una funzione, `are_friends()`, dichiarata
`security definer`, che legge senza riattivare la RLS.

Le policy di **scrittura** su `items` non citano `are_friends()`: un amico
guarda, non modifica.

```bash
npm test
```

crea tre utenti veri, tre sessioni vere, e verifica che:

- chi non è amico non veda i capi altrui, né chiedendoli per id né chiedendo
  tutto l'armadio
- un amico accettato li veda, ma non possa modificarli né cancellarli
- **l'amicizia non sia transitiva**: se A è amico di B e B di C, C non vede i
  capi di A
- sciogliendo l'amicizia i capi tornino invisibili
- la lista d'attesa non sia leggibile da nessun utente
- nessuno possa scriversi righe nel registro dei costi

Senza le chiavi in `.env.local` il test si **salta** stampando un avviso
evidente: un verde che non significa niente è peggio di un rosso.

Le foto stanno in due archivi privati (`items` e `outfits`) e si servono con
collegamenti firmati che scadono dopo un'ora. `outfits` è separato di
proposito: dentro `items` gli amici hanno accesso in lettura, e un outfit
generato non è un capo di nessuno.

## Deploy

Vercel, regione **`fra1`** (Francoforte), la stessa del database: ogni query
che attraversa l'Atlantico si paga in millisecondi.

1. Importa il repository su Vercel
2. Copia le variabili di `.env.local` nelle impostazioni del progetto
3. In *Settings → Functions*, imposta la regione su `fra1`
4. Metti `NEXT_PUBLIC_SITE_URL` al dominio vero
5. In Supabase, aggiungi `https://<dominio>/auth/callback` fra i *Redirect
   URLs* dell'autenticazione, altrimenti i link di accesso rimandano a
   localhost

## Brand

Colori e font stanno in `src/app/globals.css`, in cima, con i nomi del brand.

| Uso | Colore |
|---|---|
| Primario | `#FCC723` |
| Primario al passaggio del mouse | `#E0AE12` |
| Testo | `#1A1A1A` |
| Testo secondario | `#383F47` |
| Sfondo | `#FAF8F3` |
| Superfici | `#FFFFFF` |

**Il giallo non va mai usato per il testo su sfondo chiaro**: darebbe un
contrasto di 1,6:1, sotto qualsiasi soglia di leggibilità. Va usato come fondo
di pulsanti e blocchi, con il testo scuro sopra, che dà 10,9:1. I token sono
già impostati così: `--primary-foreground` è scuro apposta.

Font: **Montserrat**, servito dal nostro dominio con `next/font` — il browser
non contatta mai Google. Titoli in 800, il claim in 700 corsivo, il testo
corrente in 400 e 500.

### Da chiedere al team: il logo vettoriale

`public/brand/vesta-logo.png` è un raster di **200×200 pixel con fondo bianco
pieno**, senza trasparenza. Siamo partiti da quello, come concordato, e ne
abbiamo generato in automatico:

- `vesta-logo-alpha.png` — stesso disegno, fondo reso trasparente, per poterlo
  mettere sullo sfondo crema senza vedere il quadrato bianco attorno
- le icone della PWA in `public/icons/`

**A 200×200 il logo è al limite.** L'icona da 512 è un ingrandimento, e su uno
schermo ad alta densità si ammorbidisce. Quando il team ha la versione
vettoriale (SVG o PDF), sostituendola si rigenerano icone nitide a qualsiasi
dimensione. È la cosa che più alza la resa visiva a parità di lavoro.

L'immagine per le anteprime social (`src/app/opengraph-image.png`) è composta
a partire da `vesta-banner.png`.

## Privacy

- Nessun cookie di profilazione, nessun banner, nessuno strumento di terze
  parti
- I font sono serviti dal nostro dominio
- Le foto stanno in archivi privati, con collegamenti firmati a scadenza
- Ai modelli mandiamo solo il necessario: per le proposte di outfit vanno le
  **caratteristiche** dei capi, mai le fotografie. La foto esce una volta
  sola, al momento della classificazione.
- La posizione per il meteo è arrotondata a due decimali (circa un
  chilometro): per sapere se piove basta, e non consegniamo a nessuno il
  civico di casa di un utente
- Il service worker non mette mai in cache `/app`, `/auth`, `/api` o `/admin`:
  la sua cache è per dispositivo, non per utente

Le pagine `/privacy` e `/cookie` riportano in cima l'avviso **«Bozza da far
verificare prima del lancio pubblico»** e contengono segnaposto evidenziati in
giallo dove serve una decisione del team (ragione sociale, sede, partita IVA,
tempi di conservazione, base giuridica del trasferimento dati verso Google).
Vanno completati e fatti verificare prima di aprire al pubblico.

Da **Impostazioni** ogni utente può scaricare tutti i suoi dati in JSON e
cancellare l'account: la cancellazione porta via anche le foto, da entrambi
gli archivi.

## Stato

| | |
|---|---|
| Landing, Lighthouse mobile | **100 / 100 / 100 / 100** |
| Lint, typecheck, build | puliti |
| Migration, permessi, accesso | scritti, **da eseguire su Supabase** |
| Armadio, outfit, amici, impostazioni, admin | scritti, **da provare con le chiavi** |
| Test sui permessi | scritto, si salta senza chiavi |

Tutto ciò che tocca il database è stato scritto ma non eseguito: non avevamo
un progetto Supabase. Il primo giro con le chiavi vere va fatto nell'ordine
della sezione **Avvio**, e `npm test` è il modo più rapido per sapere se i
permessi reggono davvero.
