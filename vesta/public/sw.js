/*
 * Service worker di VESTA.
 *
 * Fa due cose sole: tiene in cache gli asset statici e la landing, e mostra una
 * pagina di cortesia quando la rete non c'è. Serve soprattutto alla demo: se la
 * connessione della sala è ballerina, la landing si apre lo stesso.
 *
 * REGOLA CHE NON VA TOCCATA: qui dentro non entra niente di autenticato.
 * /app, /auth e /api restano fuori dalla cache. La cache del service worker è
 * per dispositivo, non per utente: se due persone usassero lo stesso telefono,
 * una si ritroverebbe in cache l'armadio dell'altra.
 */

// Cambiare questo numero butta via tutte le cache vecchie alla prossima
// visita. Va alzato quando cambia il modo di mettere in cache, non a ogni
// pubblicazione: i file con l'impronta nel nome si rinnovano da soli.
const VERSION = "vesta-v3";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;

/*
 * Questo file è statico: non passa dal build, quindi non può leggere la
 * variabile con il sottopercorso. Se lo deduce da solo da dove si trova:
 * servito da /dev/sw.js, BASE diventa "/dev"; dalla radice, stringa vuota.
 * Così l'unico posto dove il percorso è scritto resta next.config.ts.
 */
const BASE = self.location.pathname.replace(/\/sw\.js$/, "");

const OFFLINE_URL = `${BASE}/offline`;

const PRECACHE = [
  OFFLINE_URL,
  `${BASE}/brand/vesta-logo-alpha.png`,
  `${BASE}/icons/icon-192.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** Rotte che non devono mai finire in cache. */
function isPrivate(pathname) {
  return (
    pathname.startsWith(`${BASE}/api/`) ||
    pathname.startsWith(`${BASE}/app`) ||
    pathname.startsWith(`${BASE}/auth`) ||
    pathname.startsWith(`${BASE}/admin`)
  );
}

/**
 * File con l'impronta nel nome: quando il contenuto cambia, cambia l'indirizzo.
 * Si possono tenere in cache per sempre senza rischiare di servirne uno vecchio.
 */
function isImmutabile(pathname) {
  return pathname.startsWith(`${BASE}/_next/static/`);
}

/**
 * File nostri che vivono a un indirizzo fisso: icone, marchio, capi della demo.
 *
 * Questi NON si possono trattare come i precedenti. `demo/jeans-chiari.png`
 * resta `demo/jeans-chiari.png` anche quando la fotografia dentro cambia: con
 * la cache che vince sempre, chi ha aperto la demo una volta si ritroverebbe
 * l'immagine vecchia per sempre, e non avrebbe modo di accorgersene. È
 * successo, e davanti a una giuria sarebbe successo al momento peggiore.
 */
function isNostro(pathname) {
  return (
    pathname.startsWith(`${BASE}/icons/`) ||
    pathname.startsWith(`${BASE}/brand/`) ||
    pathname.startsWith(`${BASE}/demo/`)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url.pathname)) return;

  // La scrittura in cache viene attesa invece che lasciata andare per conto
  // suo: è quella che deve finire perché l'aggiornamento serva a qualcosa, e
  // `waitUntil` più sotto può tenere in vita il worker solo se la promessa
  // che riceve la comprende. Costa il tempo di una scrittura locale.
  async function scarica() {
    const response = await fetch(request);

    if (response.ok) {
      const copia = response.clone();
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, copia);
    }

    return response;
  }

  if (isImmutabile(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit ?? scarica()));
    return;
  }

  if (isNostro(url.pathname)) {
    // Si risponde subito con la copia in cache, ma intanto si va a vedere se
    // ne esiste una nuova e la si mette da parte per la volta dopo. Resta
    // veloce e funziona senza rete, e una versione vecchia dura al massimo
    // una visita invece che per sempre.
    event.respondWith(
      caches.match(request).then((hit) => {
        const rete = scarica();

        if (!hit) return rete;

        // `waitUntil` tiene in vita il worker finché l'aggiornamento non è
        // finito: senza, il browser può spegnerlo appena consegnata la
        // risposta, e la copia nuova non verrebbe mai salvata.
        event.waitUntil(rete.catch(() => undefined));
        return hit;
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    // Rete per prima: la landing cambia spesso in questi giorni e non voglio
    // che il team veda una versione vecchia dopo un deploy.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ??
            new Response("Sei offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        })
    );
  }
});
