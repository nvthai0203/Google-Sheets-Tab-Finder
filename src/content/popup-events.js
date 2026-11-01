// Popup event bindings: settings, search, filters, keyboard nav

function bindPopupHandlers(popup) {
  bindPopupSettings(popup);
  bindSearchHandlers(popup);
  bindQuickFilters(popup);
}

function bindFloatingButtonToggle(popup) {
  const toggleBtn = popup?.querySelector("#toggleEagleXBtn");
  if (!toggleBtn) return false;

  const syncToggle = () => {
    const devBtn = document.getElementById("openSheetPopup");
    toggleBtn.checked = devBtn ? devBtn.style.display !== "none" : isButtonVisible();
  };

  if (!toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = "true";
    toggleBtn.addEventListener("change", function () {
      const devBtn = document.getElementById("openSheetPopup");
      if (devBtn) {
        devBtn.style.display = this.checked ? "block" : "none";
      }
      setButtonVisible(this.checked);
    });
  }

  syncToggle();
  return true;
}

function bindPopupSettings(popup) {
  const themeModeSelect = popup.querySelector("#themeMode");
  if (themeModeSelect && !themeModeSelect.dataset.bound) {
    themeModeSelect.dataset.bound = "true";
    themeModeSelect.value = getThemeMode();
    themeModeSelect.addEventListener("change", () => {
      const mode = themeModeSelect.value;
      setThemeMode(mode);
      applyPopupTheme(popup, mode);
    });
  }

  const fontSizeSelect = popup.querySelector("#fontSizeMode");
  if (fontSizeSelect && !fontSizeSelect.dataset.bound) {
    fontSizeSelect.dataset.bound = "true";
    fontSizeSelect.value = getPopupFontScale();
    fontSizeSelect.addEventListener("change", () => {
      const scale = fontSizeSelect.value;
      setPopupFontScale(scale);
      applyPopupFontScale(popup, scale);
    });
  }

  bindFloatingButtonToggle(popup);

  const closeBtn = document.getElementById("closePopup");
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "true";
    closeBtn.addEventListener("click", () => hidePopup(popup));
  }
}

function refreshTabListView(popup) {
  const searchInput = popup.querySelector("#searchTabs");
  const tabListEl = popup.querySelector("#tabList");
  if (!tabListEl) return [];

  const q = searchInput?.value || "";
  const currentQuickFilter = popup.dataset.quickFilter || "all";
  const items = [...tabListEl.querySelectorAll("li")].filter((li) => li.id !== "tabNotFound");
  const hits = filterAndSortTabs(q, items, { quickFilter: currentQuickFilter });

  const ordered = isBlankSearchQuery(q)
    ? sortTabItems(hits.map((hit) => hit.li), popup.querySelector("#sortTabs")?.value || "default")
    : hits.map((hit) => hit.li);

  ordered.forEach((li) => tabListEl.appendChild(li));

  let notFound = document.getElementById("tabNotFound");
  if (ordered.length === 0 && !isBlankSearchQuery(q)) {
    if (!notFound) {
      notFound = document.createElement("li");
      notFound.id = "tabNotFound";
      notFound.textContent = "🔍 Not found this Sheet";
      notFound.style.textAlign = "center";
      notFound.style.padding = "20px";
      notFound.style.color = "#888";
      notFound.style.fontSize = "18px";
      tabListEl.appendChild(notFound);
    }
  } else if (notFound) {
    notFound.remove();
  }

  popupSelectedIndex = 0;
  if (ordered.length > 0) {
    ordered.forEach((li) => li.classList.remove("selected-tab"));
    ordered[0].classList.add("selected-tab");
    ordered[0].scrollIntoView?.({ block: "nearest" });
  }

  return ordered;
}

function bindSearchHandlers(popup) {
  const searchInput = popup.querySelector("#searchTabs");
  if (!searchInput || searchInput.dataset.bound) return;

  searchInput.dataset.bound = "true";

  searchInput.addEventListener("input", () => {
    refreshTabListView(popup);
  });

  searchInput.addEventListener("keydown", (e) => {
    const visibleItems = [
      ...document.querySelectorAll("#sheetTabPopup #tabList li"),
    ].filter((li) => li.style.display !== "none" && li.id !== "tabNotFound");

    if (!visibleItems.length) return;

    if (e.key === CONFIG.SHORTCUTS.NAVIGATE_DOWN) {
      e.preventDefault();
      visibleItems[popupSelectedIndex]?.classList.remove("selected-tab");
      popupSelectedIndex = (popupSelectedIndex + 1) % visibleItems.length;
      visibleItems[popupSelectedIndex]?.classList.add("selected-tab");
      visibleItems[popupSelectedIndex]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === CONFIG.SHORTCUTS.NAVIGATE_UP) {
      e.preventDefault();
      visibleItems[popupSelectedIndex]?.classList.remove("selected-tab");
      popupSelectedIndex =
        popupSelectedIndex === 0
          ? visibleItems.length - 1
          : popupSelectedIndex - 1;
      visibleItems[popupSelectedIndex]?.classList.add("selected-tab");
      visibleItems[popupSelectedIndex]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === CONFIG.SHORTCUTS.SELECT) {
      e.preventDefault();
      visibleItems[popupSelectedIndex]?.click();
    }
  });
}

function bindQuickFilters(popup) {
  const quickFilterButtons = popup.querySelectorAll(".quick-filter-btn");
  if (!quickFilterButtons.length || popup.dataset.filtersBound) return;

  popup.dataset.filtersBound = "true";

  quickFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      popup.dataset.quickFilter = filter;
      quickFilterButtons.forEach((btn) =>
        btn.classList.toggle("active", btn === button)
      );
      refreshTabListView(popup);
    });
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    bindPopupHandlers,
    bindFloatingButtonToggle,
    bindPopupSettings,
    refreshTabListView,
    bindSearchHandlers,
    bindQuickFilters
  };
}
