// Popup event bindings: settings, search, filters, keyboard nav

function bindPopupHandlers(popup) {
  bindPopupSettings(popup);
  bindSearchHandlers(popup);
  bindQuickFilters(popup);
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

  const toggleBtn = popup.querySelector("#toggleEagleXBtn");
  const devBtn = document.getElementById("openSheetPopup");
  if (toggleBtn && devBtn && !toggleBtn.dataset.bound) {
    toggleBtn.dataset.bound = "true";
    toggleBtn.checked = devBtn.style.display !== "none";
    toggleBtn.addEventListener("change", function () {
      devBtn.style.display = this.checked ? "block" : "none";
      setButtonVisible(this.checked);
    });
  }

  const closeBtn = document.getElementById("closePopup");
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "true";
    closeBtn.addEventListener("click", () => hidePopup(popup));
  }
}

function bindSearchHandlers(popup) {
  const searchInput = popup.querySelector("#searchTabs");
  if (!searchInput || searchInput.dataset.bound) return;

  searchInput.dataset.bound = "true";

  searchInput.addEventListener("input", () => {
    const q = searchInput.value;
    const currentQuickFilter = popup.dataset.quickFilter || "all";
    const allLis = [...document.querySelectorAll("#sheetTabPopup #tabList li")];
    const items = allLis.filter((li) => li.id !== "tabNotFound");

    const scored = [];
    items.forEach((li) => {
      const tabText = li.querySelector("strong").textContent;
      const s = scoreMatch(q, tabText);
      li.dataset.searchScore = String(s);
      const isHidden = li.dataset.isHidden === "true";
      const isFavorite = li.dataset.isFavorite === "true";
      const passQuickFilter =
        currentQuickFilter === "all" ||
        (currentQuickFilter === "visible" && !isHidden) ||
        (currentQuickFilter === "hidden" && isHidden) ||
        (currentQuickFilter === "favorite" && isFavorite);
      const isHit = (s > 0 || q === "") && passQuickFilter;
      li.style.display = isHit ? "block" : "none";
      li.classList.remove("selected-tab");
      if (isHit) scored.push({ li, s });
    });

    scored.sort((a, b) => b.s - a.s);

    const tabListEl = document.querySelector("#sheetTabPopup #tabList");
    scored.forEach(({ li }) => tabListEl.appendChild(li));

    let notFound = document.getElementById("tabNotFound");
    if (scored.length === 0 && q !== "") {
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
    if (scored.length > 0) {
      scored[0].li.classList.add("selected-tab");
      scored[0].li.scrollIntoView({ block: "nearest" });
    }
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
  const searchInput = popup.querySelector("#searchTabs");

  quickFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      popup.dataset.quickFilter = filter;
      quickFilterButtons.forEach((btn) =>
        btn.classList.toggle("active", btn === button)
      );
      searchInput?.dispatchEvent(new Event("input"));
    });
  });
}
