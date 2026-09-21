"use client";

import { useEffect } from "react";

/**
 * Registra il service worker, ma solo in produzione.
 *
 * In sviluppo lo disinstalla: un service worker che serve pagine dalla cache
 * mentre stai modificando il codice fa impazzire, perché vedi la versione
 * precedente e credi che la modifica non sia passata.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) registration.unregister();
        })
        .catch(() => {
          /* niente da fare: in sviluppo non è un problema */
        });
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Se fallisce, l'app funziona lo stesso: si perde solo l'offline. */
      });
    };

    // Dopo il load, per non contendere banda al primo disegno della pagina.
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
