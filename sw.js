
"use strict";

const VERSION = "void-network-v3";
const SITE_CACHE = VERSION + "-site";

const APP_FILES = [
  "./",
  "./index.html",
  "./settings.html",
  "./manifest.json",
  "./void-logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SITE_CACHE);

    for (const file of APP_FILES) {
      try {
        const response = await fetch(file, { cache: "reload" });
        if (response.ok && response.type === "basic") {
          await cache.put(file, response);
        }
      } catch (error) {
        // Continue if an optional file is unavailable.
      }
    }

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
          key !== "void-network-game-pages-v2"
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
  ) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        const cache = await caches.open(SITE_CACHE);
        await cache.put(request, copy);
      }

      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }

      return new Response("This page is not saved for offline use.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
