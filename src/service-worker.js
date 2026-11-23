const CACHE_NAME = "loading-styling-v1";
const PRECACHE_URLS = __PRECACHE_MANIFEST__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("loading-styling-") && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Запросы к API и сторонним ресурсам не кэшируем.
  if (url.origin !== self.location.origin) return;

  // Для страницы используем сеть, а при отсутствии интернета — precache.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        } catch {
          const cache = await caches.open(CACHE_NAME);

          return (
            (await cache.match(request)) ||
            (await cache.match(
              new URL("./index.html", self.registration.scope).href,
            ))
          );
        }
      })(),
    );

    return;
  }

  // Собранные JS/CSS и прочие статические файлы уже лежат в precache.
  const isPrecached = PRECACHE_URLS.some(
    (asset) =>
      new URL(asset, self.registration.scope).href === request.url,
  );

  if (!isPrecached) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);

      return cachedResponse || fetch(request);
    })(),
  );
});
