
const CACHE_NAME = "void-network-v7";
const APP_FILES = [
  "./",
  "./index.html",
  "./settings.html",
  "./manifest.json",
  "./void-logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        APP_FILES.map(async file => {
          const response = await fetch(file, { cache: "reload" });

          if (response.ok && response.type === "basic") {
            await cache.put(file, response);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("void-network-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (
    request.method !== "GET" ||
    request.headers.has("range")
  ) {
    return;
  }

  const requestURL = new URL(request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        if (request.mode === "navigate") {
          const home = await caches.match("./index.html");

          if (home) {
            return home;
          }
        }

        return new Response(
          "This page is not cached yet. Connect to the internet and reload.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});
