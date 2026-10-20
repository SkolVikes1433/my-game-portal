
const VERSION = "void-network-v3";
const SITE_CACHE = `${VERSION}-site`;

const APP_FILES = [
  "./",
  "./index.html",
  "./settings.html",
  "./void-logo.png",
  "./khan-academy.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SITE_CACHE);

    await Promise.allSettled(
      APP_FILES.map(async path => {
        const response = await fetch(path, {
          cache: "reload"
        });

        if (response.ok && response.type === "basic") {
          await cache.put(path, response);
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("void-network-") &&
          key !== SITE_CACHE &&
          key !== "void-network-offline-v1"
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    request.headers.has("range")
  ) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        const cache = await caches.open(SITE_CACHE);
        await cache.put(request, response.clone());
      }

      return response;
    } catch {
      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }

      return new Response(
        "This page is not saved for offline use. Reconnect to the internet and open it first.",
        {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }
  })());
});
