import "../css/styles.css";

const API_URL = process.env.API_URL;
const REQUEST_TIMEOUT = 8000;

const status = document.querySelector("#status");
const loader = document.querySelector("#loader");
const title = document.querySelector("#status-title");
const description = document.querySelector("#status-text");
const retryButton = document.querySelector("#retry-button");

function showLoading() {
  status.classList.remove("status--error");
  status.setAttribute("aria-busy", "true");

  loader.hidden = false;

  title.textContent = "Загружаем данные";
  description.textContent = "Пожалуйста, подождите…";

  retryButton.hidden = true;
}

function showError() {
  status.classList.add("status--error");
  status.setAttribute("aria-busy", "false");

  loader.hidden = true;

  title.textContent = "Не удалось загрузить данные";

  description.textContent =
    "Проверьте подключение к интернету и попробуйте ещё раз.";

  retryButton.hidden = false;
}

async function loadData() {
  showLoading();

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_URL}/api/status`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    status.setAttribute("aria-busy", "false");

    title.textContent = data.message || "Данные успешно загружены";

    description.textContent = "Соединение установлено.";

    loader.hidden = true;
    retryButton.hidden = true;
  } catch (error) {
    console.error("Не удалось получить данные:", error);

    showError();
  } finally {
    clearTimeout(timeoutId);
  }
}

retryButton.addEventListener("click", loadData);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Не удалось зарегистрировать Service Worker:", error);
    });
  });
}

loadData();
