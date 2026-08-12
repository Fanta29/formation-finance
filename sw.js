/* sw.js — mise en cache pour consultation hors ligne.
   Stratégie : « network first » sur les données et les scripts (pour que la
   mise à jour des paramètres fiscaux se propage immédiatement), repli sur le
   cache si le réseau manque. */
const VERSION = "ff-2026-08-12-d";
const SOCLE = [
  "./", "index.html", "cours.html", "qcm.html", "outils.html",
  "parametres.html", "mentions-legales.html",
  "assets/css/app.css", "assets/icone.svg", "manifest.webmanifest",
  "assets/js/params.js", "assets/js/calculs.js", "assets/js/ui.js",
  "assets/js/store.js", "assets/js/cours.js", "assets/js/qcm.js",
  "assets/js/outils.js", "assets/js/parametres.js", "assets/js/pyramide.js",
  "data/cours/index.json", "data/qcm/index.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SOCLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(rep => {
        const copie = rep.clone();
        caches.open(VERSION).then(c => c.put(req, copie));
        return rep;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
