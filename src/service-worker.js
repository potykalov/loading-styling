const CACHE_NAME = "loading-styling-v1";

const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  console.log("Service Worker: install");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: activate");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API не кэшируем — запрос идёт напрямую на сервер
  if (url.pathname.includes("/api/")) return;

  // Не кэшируем сторонние ресурсы
  if (url.origin !== self.location.origin) return;

  // HTML: сначала сеть, при отсутствии соединения — кэш
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("./index.html"))
          );
        }),
    );

    return;
  }

  // Статические ресурсы: сначала кэш, затем сеть
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      const response = await fetch(request);

      if (response.ok) {
        const copy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, copy);
        });
      }

      return response;
    }),
  );
});
