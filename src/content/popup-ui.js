// Popup shell: create element, toggle visibility, theme/font

let popupSelectedIndex = 0;
let allSheetsObserver = null;
let allSheetsObserveTimer = null;

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

function getExtensionVersion() {
  try {
    return chrome?.runtime?.getManifest?.().version || "";
  } catch (error) {
    return "";
  }
}

function applyPopupVersion(popup, version = getExtensionVersion()) {
  const versionEl = popup?.querySelector("#popupVersion");
  if (!versionEl || !version) return false;
  versionEl.textContent = `v${version}`;
  versionEl.hidden = false;
  versionEl.setAttribute("title", `Search Tabs ${version}`);
  return true;
}

function hidePopup(popup) {
  if (popup) popup.style.display = "none";
  if (typeof stopApplyingHiddenTabs === "function") {
    stopApplyingHiddenTabs();
  }
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

function loadPopupHtml(popup) {
  return fetch(chrome.runtime.getURL("src/content/popup.html"))
    .then((response) => response.text())
    .then((html) => {
      popup.innerHTML = html;
      popup.dataset.ready = "true";
      popup.dataset.quickFilter = popup.dataset.quickFilter || "all";
      applyPopupTheme(popup);
      applyPopupFontScale(popup);
      applyPopupVersion(popup);
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
  bindFloatingButtonToggle(popup);
  populatePopupContent(popup);
}

function bindAllSheetsButton(btn) {
  if (!btn || btn.dataset.popupBound === "true") return false;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleSheetTabsPopup();
  });
  btn.dataset.popupBound = "true";
  return true;
}

function stopAllSheetsObserver() {
  allSheetsObserver?.disconnect();
  allSheetsObserver = null;
  if (allSheetsObserveTimer != null) {
    clearTimeout(allSheetsObserveTimer);
    allSheetsObserveTimer = null;
  }
}

function attachPopupTriggerToAllSheetsButton() {
  if (typeof document === "undefined" || !document.body) return;

  const tryBind = () => {
    document.querySelectorAll(".docs-sheet-menu-button").forEach((btn) => {
      if (isAllSheetsButton(btn)) {
        bindAllSheetsButton(btn);
      }
    });
  };

  stopAllSheetsObserver();
  tryBind();

  allSheetsObserver = new MutationObserver(tryBind);
  allSheetsObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  allSheetsObserveTimer = setTimeout(() => {
    stopAllSheetsObserver();
  }, CONFIG.ALL_SHEETS_OBSERVE_MS);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    applyPopupTheme,
    applyPopupFontScale,
    getExtensionVersion,
    applyPopupVersion,
    hidePopup,
    showPopup,
    getSheetTabPopup,
    createSheetTabPopup,
    toggleSheetTabsPopup,
    bindAllSheetsButton,
    stopAllSheetsObserver,
    attachPopupTriggerToAllSheetsButton
  };
}
