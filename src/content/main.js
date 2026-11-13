// Extension entry point: floating button, shortcuts, init

function applyFloatingButtonVisibility(button) {
  if (!button || !button.style) return button;
  button.style.display = isButtonVisible() ? "block" : "none";
  return button;
}

function addPopupButton() {
  if (typeof document === "undefined" || !document.body) return null;
  const existing = document.getElementById("openSheetPopup");
  if (existing) {
    existing.textContent = `All Tabs (${getOpenPopupShortcutLabel()})`;
    // Re-apply after chrome.storage hydrate: an early boot may have created
    // the button with the default visible state before preference was loaded.
    return applyFloatingButtonVisibility(existing);
  }

  const button = document.createElement("button");
  button.id = "openSheetPopup";
  button.textContent = `All Tabs (${getOpenPopupShortcutLabel()})`;
  applyFloatingButtonVisibility(button);
  button.addEventListener("click", toggleSheetTabsPopup);
  document.body.appendChild(button);
  return button;
}

function onOpenPopupShortcut(event) {
  if (!shouldOpenPopupShortcut(event)) return false;
  event.preventDefault();
  toggleSheetTabsPopup();
  return true;
}

document.addEventListener("keydown", onOpenPopupShortcut);

function bootExtensionUi() {
  addPopupButton();
}

function bootExtensionAfterSheetsReady() {
  addPopupButton();
  applyHiddenTabsFromStorage();
  attachPopupTriggerToAllSheetsButton();
}

if (typeof hydrateExtensionStorage === "function") {
  hydrateExtensionStorage()
    .then(() => {
      bootExtensionUi();
      // Re-apply after cache is ready so early empty reads cannot skip hides.
      if (typeof applyHiddenTabsFromStorage === "function") {
        applyHiddenTabsFromStorage();
      }
    })
    .catch(bootExtensionUi);
} else {
  bootExtensionUi();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootExtensionUi, { once: true });
  } else {
    bootExtensionUi();
  }
}

window.addEventListener("load", () => {
  setTimeout(bootExtensionAfterSheetsReady, CONFIG.INIT_DELAY);
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    applyFloatingButtonVisibility,
    addPopupButton,
    onOpenPopupShortcut,
    bootExtensionUi,
    bootExtensionAfterSheetsReady
  };
}
