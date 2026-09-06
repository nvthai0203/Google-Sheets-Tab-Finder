// Extension entry point: floating button, shortcuts, init

function addPopupButton() {
  if (document.getElementById("openSheetPopup")) return;

  const button = document.createElement("button");
  button.id = "openSheetPopup";
  button.textContent = "All Tabs (Ctrl + S)";
  button.style.display = isButtonVisible() ? "block" : "none";
  button.addEventListener("click", toggleSheetTabsPopup);
  document.body.appendChild(button);
}

document.addEventListener("keydown", (event) => {
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === CONFIG.SHORTCUTS.OPEN_POPUP
  ) {
    event.preventDefault();
    toggleSheetTabsPopup();
  }
});

window.addEventListener("load", () => {
  setTimeout(() => {
    addPopupButton();
    applyHiddenTabsFromStorage();
    attachPopupTriggerToAllSheetsButton();
  }, CONFIG.INIT_DELAY);
});
