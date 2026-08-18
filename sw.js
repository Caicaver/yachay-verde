// Service Worker de Yachay Verde — habilita catálogo y app shell sin conexión
const CACHE_NAME = "yachay-verde-v1";
const ARCHIVOS_A_GUARDAR = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./model/model.json",
  "./model/metadata.json",
  "./model/weights.bin"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS_A_GUARDAR))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(nombres =>
      Promise.all(nombres.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(respuestaCache => {
      return respuestaCache || fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
