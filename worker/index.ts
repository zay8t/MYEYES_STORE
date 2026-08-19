/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Enforce instant updates
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Any request targeting /api/*, backend routes, cart mutations, or order creation
  // MUST bypass CacheStorage completely and fetch live from the network
  if (url.pathname.includes("/api/") || event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. For HTML navigation requests, implement a Network-First strategy
  // with a fallback to offline page so updated app versions load on every launch
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const fallback = await caches.match("/");
        if (fallback) return fallback;
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
    );
    return;
  }
});
