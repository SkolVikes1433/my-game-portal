
"use strict";

const CACHE_NAME = "void-network-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./settings.html",
  "./manifest.json",
  "./void-logo.png"
];

// Install the new service worker and activate it immediately.
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache files individually so one missing file
      // does not prevent the entire worker from installing.
      await Promise.allSettled(
        APP_FILES.map(async file => {
          const response = await fetch(file, {
            cache: "reload"
          });

          if (response.ok) {
            await cache.put(file, response);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

// Take control of open site tabs.
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      // Remove old versions of this site's app cache.
      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("void-network-v") &&
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

  // Only handle requests for this website.
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  // Always check the network first for page navigation.
  // This prevents the old home page from being served
  // when the internet is available.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request, {
            cache: "no-cache"
          });

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("./index.html", response.clone());
          }

          return response;
        } catch (error) {
          const cachedPage = await caches.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          const cachedHome = await caches.match("./index.html");

          if (cachedHome) {
            return cachedHome;
          }

          return new Response(
            "You are offline. Reconnect to load VOID NETWORK V6.",
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

    return;
  }

  // For other local files, prefer the cached copy but
  // refresh it from the network when possible.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      const networkRequest = fetch(request).then(async response => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      });

      if (cached) {
        event.waitUntil(networkRequest.catch(() => {}));
        return cached;
      }

      try {
        return await networkRequest;
      } catch (error) {
        return new Response("File unavailable offline.", {
          status: 503
        });
      }
    })()
  );
});
