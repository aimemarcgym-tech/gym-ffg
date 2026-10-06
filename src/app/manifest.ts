import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Permet d'installer l'application sur l'écran d'accueil (Android, Chrome, Edge ; iPhone via « Sur l'écran d'accueil »).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestion Compétitions & Entraînements",
    short_name: "FFG Gestion",
    description: "Suivi des gymnastes, mouvements et compétitions FFG",
    lang: "fr",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#0a0a10",
    theme_color: "#0a0a10",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
