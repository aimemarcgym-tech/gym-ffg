import type { NextConfig } from "next";

// Sur GitHub Pages le site vit dans un sous-dossier (https://compte.github.io/gym-ffg/) : NEXT_PUBLIC_BASE_PATH vaut alors « /gym-ffg ».
// En local il est vide et le site reste à la racine.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
