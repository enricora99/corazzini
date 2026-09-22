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

const VERSION = "vesta-v2";
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

/** Asset con hash nel nome, o immagini del brand: non cambiano mai sotto i piedi. */
function isStaticAsset(pathname) {
  return (
    pathname.startsWith(`${BASE}/_next/static/`) ||
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

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
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
