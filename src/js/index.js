import "../css/styles.css";

const API_URL = process.env.API_URL;

const loadingElement = document.querySelector("#loading");
const contentElement = document.querySelector("#content");
const errorElement = document.querySelector("#error");
const retryButton = document.querySelector("#retry");

let isLoading = false;

async function loadData() {
  if (isLoading) return;

  isLoading = true;
  retryButton.disabled = true;

  loadingElement.hidden = false;
  contentElement.hidden = true;
  errorElement.hidden = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_URL}/api/status`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();

    contentElement.innerHTML = `
      <h1>${data.message}</h1>
      <p>Статус сервера: ${data.status}</p>
    `;

    loadingElement.hidden = true;
    contentElement.hidden = false;
  } catch (error) {
    console.error("Не удалось получить данные:", error);

    loadingElement.hidden = true;
    errorElement.hidden = false;

    if (error.name === "AbortError") {
      console.error("Превышено время ожидания ответа сервера");
    }
  } finally {
    clearTimeout(timeoutId);
    isLoading = false;
    retryButton.disabled = false;
  }
}

retryButton.addEventListener("click", loadData);

loadData();

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js",
      );

      console.log("Service Worker зарегистрирован:", registration.scope);
    } catch (error) {
      console.error("Ошибка регистрации Service Worker:", error);
    }
  });
}
