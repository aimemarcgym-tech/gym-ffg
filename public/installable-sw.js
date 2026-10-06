// Service worker minimal : aucune mise en cache, il laisse passer toutes les requêtes. Il sert uniquement à rendre l'application installable.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
