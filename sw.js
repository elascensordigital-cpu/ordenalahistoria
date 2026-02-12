// sw.js
const CACHE_VERSION = "v3";            // 👈 CAMBIA ESTO cada vez que publiques
const CACHE_NAME = `ordena-historia-${CACHE_VERSION}`;

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./cabecera.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting(); // usa el SW nuevo ya
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim(); // controla las pestañas abiertas
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ✅ Para index.html: "network-first" (así te llega la versión nueva)
  const isHTML =
    req.mode === "navigate" ||
    (url.pathname.endsWith("/index.html"));

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // ✅ Para el resto: cache-first (rápido y offline)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // cachea mismos-origen
        if (url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
