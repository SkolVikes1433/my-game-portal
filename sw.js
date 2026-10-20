
const VERSION = "void-network-v2";
const SITE_CACHE = `${VERSION}-site`;
const GAME_CACHE = `${VERSION}-games`;

const APP_FILES = [
  "./",
  "./index.html",
  "./settings.html",
  "./void-logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SITE_CACHE);

    // Cache files individually so one missing optional file
    // does not prevent the rest of the site from being saved.
    await Promise.allSettled(
      APP_FILES.map(async file => {
        const response = await fetch(file, { cache: "reload" });
        if (response.ok && response.type === "basic") {
          await cache.put(file, response);
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
          key !== GAME_CACHE &&
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

  // Only handle same-origin GET requests.
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    request.headers.has("range")
  ) {
    return;
  }

  // Pages and assets are served from cache when available.
  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      // Save successful files from this website for later.
      if (response.ok && response.type === "basic") {
        const copy = response.clone();

        const destination =
          url.pathname.includes("/games/")
            ? GAME_CACHE
            : SITE_CACHE;

        const cache = await caches.open(destination);
        await cache.put(request, copy);
      }

      return response;
    } catch (error) {
      // A missing page cannot be loaded without a cached copy.
      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }

      return new Response(
        "This file is not available offline. Connect to the internet and open it first.",
        {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        }
      );
    }
  })());
});
