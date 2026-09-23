# Deploy

Questa repo contiene due cose diverse, servite dallo stesso dominio:

| Cartella | Cos'è | Dove risponde |
|---|---|---|
| radice | Il sito dello studio: HTML statico, nessun build | `www.corazzini.it` |
| `vesta/` | VESTA, applicazione Next.js | `www.corazzini.it/dev` |

Su Vercel sono **due progetti distinti che partono dalla stessa repo**,
ciascuno con la propria *Root Directory*. Il sito resta HTML puro: per
cambiarlo basta modificare un file, senza toccare la catena di build di Next.

---

## Prima volta: dalla situazione attuale a Vercel

Oggi il dominio è servito da GitHub Pages. Si passa a Vercel in quest'ordine,
e **l'ordine conta**: si sposta il DNS solo quando Vercel è già pronto e
verificato. Al contrario, il sito dello studio va offline nel frattempo.

### 1. Progetto «vesta»

1. Su Vercel: *Add New → Project* → importa `enricora99/corazzini`
2. **Root Directory: `vesta`**
3. Framework: Next.js (lo riconosce da solo)
4. Variabili d'ambiente: copia quelle di `vesta/.env.example` che ti servono.
   Per far girare la demo bastano:
   - `ACCESS_CODE` — il codice d'invito
   - `NEXT_PUBLIC_SITE_URL` = `https://www.corazzini.it/dev`

   Le chiavi di Supabase e Gemini servono solo quando vuoi l'app vera, non la
   demo.
5. Deploy. Annota l'indirizzo che ti dà, del tipo `vesta-xxxx.vercel.app`

### 2. Progetto «corazzini»

1. *Add New → Project* → importa **la stessa repo**
2. **Root Directory: `/`** (la radice)
3. Framework: *Other* — non c'è niente da costruire
4. Deploy

### Le due regole di inoltro, e perché sono due

In [`vercel.json`](vercel.json) ci sono due righe quasi identiche. La prima,
quella per `/dev` liscio, **deve restare e deve stare prima dell'altra**.

Senza, `/dev` non viene inoltrato: Vercel lo tratta come una cartella e ci
aggiunge la barra finale, VESTA la toglie perché Next normalizza al
contrario, e si rimbalza all'infinito. Il browser si arrende dopo qualche
giro con un errore di troppi reindirizzamenti.

`/dev` è proprio l'indirizzo che si manda in giro, quindi è il caso che non
può rompersi. (In `vercel.json` non si possono mettere commenti: il file
viene validato e qualsiasi proprietà in più lo fa rifiutare. Per questo la
spiegazione sta qui.)

### 3. Collega i due

In [`vercel.json`](vercel.json), sostituisci
`SOSTITUIRE-CON-IL-PROGETTO-VESTA.vercel.app` con l'indirizzo del punto 1.
Poi fai commit e push: Vercel ricostruisce da solo.

### 4. Verifica PRIMA di toccare il DNS

Sull'indirizzo `.vercel.app` del progetto «corazzini», controlla:

- [ ] la homepage
- [ ] tutte e cinque le pagine sotto `/strumenti/`
- [ ] le immagini in `assets/`
- [ ] `/dev` porta al cancello del codice
- [ ] inserito il codice, la demo di VESTA funziona

È l'ultimo momento in cui un problema non costa niente.

### 5. Domini su Vercel

Nel progetto «corazzini», *Settings → Domains*, aggiungi **entrambi**:

- `www.corazzini.it` ← impostalo come **principale**
- `corazzini.it` ← reindirizza al www

> Il www come principale non è un dettaglio: il `CNAME` di GitHub Pages e i
> `<link rel="canonical">` del sito puntano da sempre a `www.corazzini.it`.
> Invertirli sposta il posizionamento accumulato su un indirizzo nuovo.

Vercel ti mostra i record DNS esatti da creare. **Usa quelli**, non valori
presi altrove: cambiano nel tempo.

### 6. DNS, su Aruba

Una copia dello stato attuale è in
`Documents/corazzini-dns-backup-2026-09-22.txt`: da lì si torna indietro.

Nel pannello vedrai righe «A» di due tipi che si somigliano:

| IP che inizia per | Cos'è | Si tocca? |
|---|---|---|
| `185.199.` | GitHub Pages, il sito | **sì** |
| `62.149.` | Aruba, la posta dello studio | **MAI** |

> **Non toccare i record MX né il TXT che inizia con `v=spf1`.** Sono la posta
> elettronica dello studio. Sito e email convivono sugli stessi record DNS ma
> su righe diverse, e cancellare la riga sbagliata fa sparire le email senza
> nessun avviso.

I TTL sono sui 35-55 minuti: la propagazione, e anche un eventuale ritorno
indietro, richiede fino a un'ora.

### 7. Dopo, a cose funzionanti

- Su GitHub, *Settings → Pages*: togli il dominio personalizzato, così GitHub
  non se lo tiene prenotato
- Puoi eliminare il file `CNAME`, che serviva solo a GitHub Pages

---

## Poi, ogni giorno

```bash
node scripts/pubblica.mjs
```

Pubblica **tutti e due** i progetti, uno dopo l'altro, e dice come è andata.

Va lanciato a mano perché nessuno dei due progetti è collegato a GitHub:
`git push` manda il codice su GitHub e basta, su Vercel non arriva niente.
Sembra una distinzione da poco finché non aggiorni qualcosa, vedi il push
riuscito e resti convinto che sia online — è già successo con la biografia
in home, rimasta invisibile per ore.

Pubblicarne uno solo è la stessa trappola in versione più insidiosa: il
sito si aggiorna, `/dev` no, o viceversa. Per questo lo script li fa
entrambi e non accetta di considerarsi riuscito se uno dei due fallisce.

Il giorno in cui i progetti verranno collegati a GitHub, questo script e
questa sezione si possono buttare.
