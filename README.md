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

La landing e le pagine legali funzionano anche senza chiavi. Il form della
lista d'attesa, l'accesso e tutta l'area `/app` hanno bisogno di Supabase: senza,
il form dice chiaramente che non riesce a registrarti invece di fingere che sia
andata bene.

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

> **Regola:** solo le variabili con prefisso `NEXT_PUBLIC_` arrivano al browser.
> Se aggiungi una chiave, non darle mai quel prefisso.
>
> `SUPABASE_SERVICE_ROLE_KEY` scavalca tutte le regole di sicurezza del
> database e legge i dati di chiunque. Non va in chat, non va su git, non va su
> una chiavetta.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Sviluppo su http://localhost:3000 |
| `npm run dev:https` | Sviluppo in HTTPS, raggiungibile dal telefono |
| `npm run build` | Build di produzione |
| `npm start` | Serve la build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run check` | Lint + typecheck + build, tutto insieme |
| `npm test` | Test, incluso quello sui permessi del database |
| `npm run seed` | Crea l'account dimostrativo |
| `npm run pack:usb` | Zip pulito da portare su un altro PC |

## Provare dal telefono

Non usare `npm run dev` e l'indirizzo IP: **la geolocalizzazione non funziona
su HTTP**, e senza posizione il meteo non parte. I browser la concedono solo in
contesto sicuro. Quindi:

```bash
npm run dev:https
```

Poi apri `https://<ip-del-pc>:3000` dal telefono, sulla stessa rete. Il
certificato è autofirmato: il browser avvisa, accetti e prosegui.
L'indirizzo IP te lo stampa Next all'avvio, alla riga `Network`.

Vale anche per l'installazione della PWA: per comparire tra le app
installabili servono un manifest valido **e** HTTPS.

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

Le chiavi non sono nello zip di proposito. Se copi la cartella a mano invece di
usare lo script, **salta `node_modules` e `.next`**: si rigenerano da soli.

## Struttura

```
src/
├─ app/                  rotte (App Router)
│  ├─ (marketing)/       landing, privacy, cookie
│  ├─ app/               area riservata
│  ├─ admin/             metriche e costi
│  ├─ actions/           server action
│  └─ api/               route handler
├─ components/
│  ├─ ui/                shadcn/ui
│  ├─ landing/           sezioni della landing
│  └─ app/               componenti dell'area riservata
└─ lib/
   ├─ supabase/          client (browser, server, amministrazione)
   ├─ ai/                fornitori dei modelli, prezzi, registro chiamate
   └─ …
supabase/migrations/     schema, permessi, storage
tests/                   test, incluso quello sui permessi
```

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
pieno**, senza trasparenza. Sono partito da quello, come concordato, e ho
generato in automatico:

- `vesta-logo-alpha.png` — stesso disegno, fondo reso trasparente, per poterlo
  mettere sullo sfondo crema senza vedere il quadrato bianco attorno
- le icone della PWA in `public/icons/`

**A 200×200 il logo è al limite.** L'icona da 512 è un ingrandimento, e su uno
schermo ad alta densità si ammorbidisce. Quando il team ha la versione
vettoriale (SVG o PDF), sostituendola si rigenerano icone nitide a qualsiasi
dimensione. È la cosa che più alza la resa visiva a parità di lavoro.

L'immagine per le anteprime social (`src/app/opengraph-image.png`) è composta a
partire da `vesta-banner.png`.

## Deploy

Vercel, regione **`fra1`** (Francoforte), la stessa del database: ogni query che
attraversa l'Atlantico si paga in millisecondi.

1. Importa il repository su Vercel
2. Copia le variabili di `.env.local` nelle impostazioni del progetto
3. In *Settings → Functions*, imposta la regione su `fra1`
4. Metti `NEXT_PUBLIC_SITE_URL` al dominio vero
5. In Supabase, aggiungi quel dominio tra i *Redirect URLs* dell'autenticazione,
   altrimenti i link di accesso via email rimandano a localhost

## Privacy

- Nessun cookie di profilazione, nessun banner, nessuno strumento di terze parti
- I font sono serviti dal nostro dominio
- Le foto dei capi stanno in un archivio privato e si servono con collegamenti
  firmati a scadenza
- Ai modelli mandiamo solo il necessario: per le proposte di outfit vanno le
  caratteristiche dei capi, non le fotografie

Le pagine `/privacy` e `/cookie` riportano in cima l'avviso **«Bozza da far
verificare prima del lancio pubblico»** e contengono segnaposto evidenziati in
giallo dove serve una decisione del team (ragione sociale, sede, partita IVA,
tempi di conservazione). Vanno completati e fatti verificare prima di aprire al
pubblico.

## Stato dei lavori

- [x] Fondamenta, brand, PWA
- [x] Landing, privacy, cookie, lista d'attesa — **Lighthouse mobile 100/100/100/100**
- [ ] Database, permessi, accesso via email
- [ ] Armadio
- [ ] Outfit
- [ ] Amici
- [ ] Impostazioni, amministrazione, costi
- [ ] Test, seed, verifiche finali

Le sezioni **fornitori AI** e **dove leggere i costi** arrivano con i passi
corrispondenti.
