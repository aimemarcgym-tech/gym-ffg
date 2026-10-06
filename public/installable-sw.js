// Ancien service worker minimal, retiré : il se désinscrit tout seul sur les appareils où il avait été installé.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.registration.unregister()));
