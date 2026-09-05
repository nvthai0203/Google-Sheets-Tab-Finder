// Popup shell: create element, toggle visibility, theme/font

let popupSelectedIndex = 0;

function applyPopupTheme(popup, mode = getThemeMode()) {
  if (!popup) return;
  if (mode === "auto") {
    popup.removeAttribute("data-theme");
  } else {
    popup.setAttribute("data-theme", mode);
  }

  const themeModeSelect = popup.querySelector("#themeMode");
  if (themeModeSelect) {
    themeModeSelect.value = mode;
  }
}

function applyPopupFontScale(popup, scale = getPopupFontScale()) {
  if (!popup) return;
  popup.style.setProperty("--ui-font-scale", scale);

  const fontSizeSelect = popup.querySelector("#fontSizeMode");
  if (fontSizeSelect) {
    fontSizeSelect.value = scale;
  }
}

function hidePopup(popup) {
  if (popup) popup.style.display = "none";
}

function showPopup(popup) {
  if (popup) popup.style.display = "block";
}

function getSheetTabPopup() {
  return document.getElementById("sheetTabPopup");
}

function createSheetTabPopup() {
  const popup = document.createElement("div");
  popup.id = "sheetTabPopup";
  popup.dataset.ready = "false";
  document.body.appendChild(popup);
  return popup;
}

const SNOWFLAKE_COUNT = 36;
const SNOWFLAKE_GLYPHS = ["❄", "❅", "❆", "•"];

function initPopupSnowfall(popup) {
  const layer = popup?.querySelector("#snowfall");
  if (!layer || layer.dataset.ready === "true") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < SNOWFLAKE_COUNT; i += 1) {
    const flake = document.createElement("span");
    flake.className = "snowflake";
    flake.textContent = SNOWFLAKE_GLYPHS[i % SNOWFLAKE_GLYPHS.length];
    flake.style.setProperty("--snow-left", `${Math.random() * 100}%`);
    flake.style.setProperty("--snow-duration", `${8 + Math.random() * 10}s`);
    flake.style.setProperty("--snow-delay", `${-Math.random() * 14}s`);
    flake.style.setProperty("--snow-size", `${0.55 + Math.random() * 0.95}em`);
    flake.style.setProperty("--snow-drift", `${-36 + Math.random() * 72}px`);
    flake.style.setProperty("--snow-opacity", `${0.4 + Math.random() * 0.45}`);
    fragment.appendChild(flake);
  }

  layer.appendChild(fragment);
  layer.dataset.ready = "true";
}

function loadPopupHtml(popup) {
  return fetch(chrome.runtime.getURL("src/content/popup.html"))
    .then((response) => response.text())
    .then((html) => {
      popup.innerHTML = html;
      popup.dataset.ready = "true";
      popup.dataset.quickFilter = popup.dataset.quickFilter || "all";
      applyPopupTheme(popup);
      applyPopupFontScale(popup);
      initPopupSnowfall(popup);
      bindPopupHandlers(popup);
      populatePopupContent(popup);
    });
}

function toggleSheetTabsPopup() {
  let popup = getSheetTabPopup();

  if (!popup) {
    popup = createSheetTabPopup();
    loadPopupHtml(popup).catch((error) => {
      console.error("❌ Error loading popup HTML:", error);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === CONFIG.SHORTCUTS.CLOSE_POPUP && popup.style.display === "block") {
        hidePopup(popup);
      }
    });

    return;
  }

  if (popup.dataset.ready !== "true") {
    console.warn("⚠️ Popup HTML chưa load xong, vui lòng đợi...");
    return;
  }

  if (popup.style.display === "block") {
    hidePopup(popup);
    return;
  }

  applyPopupTheme(popup);
  applyPopupFontScale(popup);
  populatePopupContent(popup);
}

function attachPopupTriggerToAllSheetsButton() {
  const observer = new MutationObserver(() => {
    const allSheetsBtn = document.querySelector(CONFIG.SELECTORS.ALL_SHEETS_BTN);

    if (allSheetsBtn && !allSheetsBtn.dataset.popupBound) {
      allSheetsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleSheetTabsPopup();
      });

      allSheetsBtn.dataset.popupBound = "true";
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
