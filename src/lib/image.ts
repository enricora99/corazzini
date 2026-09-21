/**
 * Ridimensionamento delle foto nel browser, prima di caricarle.
 *
 * Tre motivi per farlo qui invece che sul server:
 * - una foto di un telefono moderno pesa 3-5 MB, e su rete mobile il
 *   caricamento si sente;
 * - al modello di visione arriva solo quello che gli serve per riconoscere
 *   un capo, come promesso nell'informativa privacy;
 * - non serve `sharp` né nessun'altra dipendenza: lo fa il browser.
 */

export type FotoPronta = {
  blob: Blob;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
};

/** Sopra i 1024 pixel di lato il modello non riconosce niente di più,
 *  e ogni pixel in più è banda e costo. */
const LATO_MASSIMO = 1024;

/** WebP a questa qualità è indistinguibile su schermo e pesa un terzo. */
const QUALITA = 0.82;

export async function preparaFoto(
  file: File,
  latoMassimo = LATO_MASSIMO
): Promise<FotoPronta> {
  // `imageOrientation: "from-image"` applica l'orientamento EXIF: senza,
  // le foto scattate in verticale con certi telefoni arrivano coricate, e
  // il modello classifica un capo storto.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  const scala = Math.min(1, latoMassimo / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scala);
  const height = Math.round(bitmap.height * scala);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Il browser non riesce a elaborare l'immagine.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITA)
  );

  if (!blob) throw new Error("Non siamo riusciti a convertire l'immagine.");

  return {
    blob,
    base64: await blobInBase64(blob),
    mimeType: "image/webp",
    width,
    height,
  };
}

async function blobInBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // A blocchi: `String.fromCharCode(...bytes)` su un array da qualche
  // centinaio di migliaia di elementi supera il limite di argomenti e
  // fa saltare la chiamata.
  let binario = "";
  const BLOCCO = 8192;
  for (let i = 0; i < bytes.length; i += BLOCCO) {
    binario += String.fromCharCode(...bytes.subarray(i, i + BLOCCO));
  }

  return btoa(binario);
}
