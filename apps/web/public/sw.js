/* Minte în joacă — service worker, cache-first, complet offline. */
const VERSION = "minte-in-joaca-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Response.error();
        });
    }),
  );
});

/* Pagina trimite lista resurselor curente pentru încălzirea cache-ului
   (prima vizită: SW devine activ după ce fișierele au fost deja încărcate). */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "warm" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(VERSION).then((cache) =>
        Promise.allSettled(
          event.data.urls.map((url) =>
            cache.add(new Request(url, { credentials: "same-origin" })),
          ),
        ),
      ),
    );
  }
});
