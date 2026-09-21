import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VESTA — l'outfit con i vestiti che hai già",
    short_name: "VESTA",
    description:
      "Fotografi i tuoi vestiti, dici dove vai, ricevi l'outfit in pochi secondi.",
    lang: "it",
    dir: "ltr",
    // Si apre direttamente sull'app, non sulla landing: chi l'ha installata
    // l'ha già scelta, non ha bisogno di rileggere la presentazione.
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF8F3",
    theme_color: "#FAF8F3",
    categories: ["lifestyle", "shopping", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android ritaglia l'icona nella forma del sistema: in questa versione
        // il logo sta nell'80% centrale, così non perde le punte della V.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
