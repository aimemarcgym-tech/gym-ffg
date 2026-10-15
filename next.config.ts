import type { NextConfig } from "next";

// Sur GitHub Pages le site vit dans un sous-dossier (https://compte.github.io/gym-ffg/) : NEXT_PUBLIC_BASE_PATH vaut alors « /gym-ffg ».
// En local il est vide et le site reste à la racine.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Date et heure de fabrication, affichée en bas de page pour savoir quelle version tourne sur un appareil.
  env: { NEXT_PUBLIC_VERSION: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
