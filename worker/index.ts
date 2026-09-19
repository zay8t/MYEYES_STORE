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

// ─────────────────────────────────────────────────────────────────────────────
// Web Push Notifications Handling
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "👓 New Order Received!", body: event.data.text() };
  }

  const title = data.title || "👓 New Order Received!";
  const options: NotificationOptions = {
    body: data.body || "New order received at My Eyes.",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || "/admin/orders",
    },
    actions: [
      { action: "open", title: "View Order" }
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If admin tab already open, focus it; otherwise open new window/tab
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

