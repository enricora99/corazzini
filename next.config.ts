import type { NextConfig } from "next";

/**
 * VESTA vive sotto un sottopercorso del dominio: corazzini.it/dev
 *
 * `basePath` viene inlineato nel bundle al momento del build, quindi si
 * decide qui e non si può cambiare a caldo. Lo ripubblichiamo come variabile
 * pubblica perché il codice ha bisogno dello stesso valore in tre casi che
 * Next NON sistema da solo:
 *
 *   - `next/image` con src assoluto (a differenza di `next/link`)
 *   - le chiamate `fetch` verso le nostre rotte API
 *   - i percorsi dentro il manifest della PWA
 *
 * Così il valore è scritto una volta sola: cambiarlo qui lo cambia ovunque.
 * Per servire VESTA dalla radice di un dominio suo, basta metterlo a "".
 */
const basePath = "/dev";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
