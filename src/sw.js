// sw.js — service worker. workbox precache injected by vite-plugin-pwa.
// adds push handler + notification click + offline fallback.

import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = { title: "fret", body: "time to practice." };
  try {
    if (event.data)
      data = { ...data, ...event.data.json() };
  } catch {
    /* plain-text payload */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || "fret-default",
      data: { url: data.url || "/" },
      vibrate: [80, 40, 80],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window" })
      .then((clients) => {
        for (const c of clients) {
          if (c.url.includes(target) && "focus" in c)
            return c.focus();
        }
        if (self.clients.openWindow)
          return self.clients.openWindow(target);
      }),
  );
});
