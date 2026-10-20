
"use strict";

const VERSION = "void-network-v3";
const SITE_CACHE = VERSION + "-site";

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

    // Save each available local file independently.
    // A missing optional image won't block the other files.
    await Promise.allSettled(
      APP_FILES.map(async file => {
        try {
          const response = await fetch(file, {
            cache: "reload"
          });

          if (response.ok && response.type === "basic") {
            await cache.put(file, response);
          }
        } catch (error) {
          // Ignore unavailable optional files.
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
          key !== SITE_CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle this website's GET requests.
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    request.headers.has("range")
  ) {
    return;
  }

  // Don't cache requests that are not ordinary page or asset requests.
  if (
    request.destination === "document" ||
    ["style", "script", "image", "font"].includes(request.destination)
  ) {
    event.respondWith((async () => {
      const cache = await caches.open(SITE_CACHE);
      const cached = await cache.match(request);

      // Prefer the network when available for normal navigation.
      try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        if (cached) return cached;

        if (request.mode === "navigate") {
          const home = await cache.match("./index.html");
          if (home) return home;
        }

        return new Response(
          "This file is not saved for offline use. Connect to the internet and open it first.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })());
  }
});
