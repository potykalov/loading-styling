const CACHE_NAME = "loading-styling-v2";

const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Получаем HTML приложения
      const response = await fetch("./index.html");
      const html = await response.text();

      // Находим JS-файлы, добавленные Webpack
      const scripts = [
        ...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g),
      ].map((match) => match[1]);

      // Кэшируем HTML и JS
      await cache.addAll([...APP_SHELL, ...scripts]);

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter(
            (key) => key.startsWith("loading-styling-") && key !== CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Не кэшируем POST и запросы к API
  if (request.method !== "GET" || url.pathname.includes("/api/")) {
    return;
  }

  // Обрабатываем только ресурсы своего сайта
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        // При навигации без интернета возвращаем закэшированную страницу
        if (request.mode === "navigate") {
          const cachedPage = await caches.match("./index.html");

          if (cachedPage) {
            return cachedPage;
          }
        }

        throw error;
      }
    })(),
  );
});
