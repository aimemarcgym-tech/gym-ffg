import { generateSW } from "workbox-build";

const { count, size } = await generateSW({
  globDirectory: "out",
  globPatterns: ["**/*.{html,js,css,json,svg,png,ico,woff2,txt,mp3}"],
  swDest: "out/sw.js",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  // Pas de skipWaiting : l'appli affiche une bannière « Actualiser » plutôt que de recharger en pleine saisie.
  skipWaiting: false,
  navigateFallback: undefined,
});

console.log(`Service worker : ${count} fichiers précachés (${(size / 1024).toFixed(0)} Ko)`);
