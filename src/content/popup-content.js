// Popup content: history, tab list, sort, bulk hide/show

function findListItemByTabName(tabName) {
  return [...document.querySelectorAll("#tabList li")].find(
    (item) => item.querySelector("strong")?.textContent.trim() === tabName
  );
}

function updateListItemHiddenState(li, isHidden) {
  if (!li) return;
  li.dataset.isHidden = isHidden ? "true" : "false";
  const cb = li.querySelector(".tabCheckbox");
  if (cb) cb.checked = isHidden;
  const st = li.querySelector("strong");
  if (st) {
    st.style.color = isHidden ? "var(--ui-text-muted)" : "var(--ui-text)";
  }
}

function syncTabListFromHiddenSet(hiddenSet, searchInput, updateStats) {
  document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB).forEach((tab) => {
    const name = tab.querySelector(CONFIG.SELECTORS.TAB_NAME)?.textContent?.trim();
    if (!name) return;
    tab.style.display = hiddenSet.has(name) ? "none" : "";
  });

  document.querySelectorAll("#tabList li").forEach((li) => {
    const tabName = li.querySelector("strong")?.textContent?.trim();
    if (!tabName) return;
    updateListItemHiddenState(li, hiddenSet.has(tabName));
  });

  searchInput?.dispatchEvent(new Event("input"));
  updateStats?.();
}

function renderHistoryList(popup, historyList) {
  if (!historyList) return;

  historyList.innerHTML = "";
  const historyTabs = getHistoryTabs();

  historyTabs.forEach((tabName, index) => {
    const li = document.createElement("li");
    li.classList.add("history-item");
    li.innerHTML = `
      <div class="history-item-content">
        <span class="history-rank">${index + 1}</span>
        <span class="history-tab-name">${tabName}</span>
      </div>
    `;
    li.title = `Click to switch to "${tabName}"`;

    li.addEventListener("click", () => {
      const tab = [...document.querySelectorAll(CONFIG.SELECTORS.TAB_NAME)].find(
        (el) => el.textContent.trim() === tabName
      );

      if (tab) {
        const elTab = tab.closest(CONFIG.SELECTORS.SHEET_TAB);
        if (elTab) {
          simulateClick(elTab);
          addToHistory(tabName);
          hidePopup(popup);
        }
      } else {
        alert("Not found in this Sheet!");
      }
    });

    historyList.appendChild(li);
  });
}

function bindSortHandler(popup) {
  const sortSelect = popup.querySelector("#sortTabs");
  if (!sortSelect || sortSelect.dataset.bound) return;

  sortSelect.dataset.bound = "true";
  sortSelect.addEventListener("change", (e) => {
    const sortType = e.target.value;
    const tabListElement = popup.querySelector("#tabList");
    const items = [...tabListElement.querySelectorAll("li:not(#tabNotFound)")];

    let sortedItems = [];

    switch (sortType) {
      case "alphabetical":
        sortedItems = items.sort((a, b) => {
          const textA = a.querySelector("strong").textContent.toLowerCase();
          const textB = b.querySelector("strong").textContent.toLowerCase();
          return textA.localeCompare(textB);
        });
        break;

      case "color":
        sortedItems = items.sort((a, b) => {
          const colorA = a.querySelector("span").style.color || "black";
          const colorB = b.querySelector("span").style.color || "black";
          return colorA.localeCompare(colorB);
        });
        break;

      case "recent": {
        const recentTabs = getHistoryTabs();
        sortedItems = items.sort((a, b) => {
          const textA = a.querySelector("strong").textContent;
          const textB = b.querySelector("strong").textContent;
          const indexA = recentTabs.indexOf(textA);
          const indexB = recentTabs.indexOf(textB);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return textA.localeCompare(textB);
        });
        break;
      }

      case "default":
      default: {
        const tabs = document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB);
        const originalOrder = [...tabs].map((tab) =>
          tab.querySelector(CONFIG.SELECTORS.TAB_NAME).textContent.trim()
        );

        sortedItems = items.sort((a, b) => {
          const textA = a.querySelector("strong").textContent;
          const textB = b.querySelector("strong").textContent;
          return originalOrder.indexOf(textA) - originalOrder.indexOf(textB);
        });
        break;
      }
    }

    tabListElement.innerHTML = "";
    sortedItems.forEach((item) => tabListElement.appendChild(item));

    popupSelectedIndex = 0;
    const visibleItems = sortedItems.filter((item) => item.style.display !== "none");
    if (visibleItems.length > 0) {
      visibleItems.forEach((item) => item.classList.remove("selected-tab"));
      visibleItems[0].classList.add("selected-tab");
    }
  });
}

function ensureBulkActions(popup, searchInput) {
  if (popup._updateStats) return popup._updateStats;

  const hideAllBtn = popup.querySelector("#hideAllTabs");
  const showAllBtn = popup.querySelector("#showAllTabs");
  const undoBar = popup.querySelector("#undoBar");
  const undoMessage = popup.querySelector("#undoMessage");
  const undoActionBtn = popup.querySelector("#undoActionBtn");

  if (!hideAllBtn) return () => {};

  let lastUndoHiddenTabs = null;
  let undoTimer = null;

  const updateStats = () => {
    const totalTabs = document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB).length;
    const hiddenCount = getActualHiddenCount();
    const statsEl = popup.querySelector("#tabStats");
    if (statsEl) {
      statsEl.innerHTML = `Total: ${totalTabs} | Hidden: ${hiddenCount} | Visible: ${
        totalTabs - hiddenCount
      }`;
    }
  };

  const restoreHiddenTabs = (hiddenTabsSnapshot) => {
    const hiddenSet = new Set(hiddenTabsSnapshot || []);
    setHiddenTabs([...hiddenSet]);
    syncTabListFromHiddenSet(hiddenSet, searchInput, updateStats);
  };

  const showUndo = (message, hiddenTabsSnapshot) => {
    if (!undoBar || !undoMessage || !undoActionBtn) return;
    lastUndoHiddenTabs = [...hiddenTabsSnapshot];
    undoMessage.textContent = message;
    undoBar.classList.add("show");
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      undoBar.classList.remove("show");
      lastUndoHiddenTabs = null;
    }, 5000);
  };

  undoActionBtn?.addEventListener("click", () => {
    if (!lastUndoHiddenTabs) return;
    restoreHiddenTabs(lastUndoHiddenTabs);
    undoBar?.classList.remove("show");
    lastUndoHiddenTabs = null;
    clearTimeout(undoTimer);
  });

  hideAllBtn.addEventListener("click", () => {
    const previousHiddenTabs = getHiddenTabs();
    const activeName = getActiveTabName();

    const visibleLis = [...document.querySelectorAll("#tabList li")].filter(
      (li) => li.style.display !== "none" && li.id !== "tabNotFound"
    );

    const namesToHide = visibleLis
      .map((li) => li.querySelector("strong")?.textContent?.trim())
      .filter(Boolean)
      .filter((name) => name !== activeName);

    const currentHidden = new Set(getHiddenTabs());
    if (activeName) currentHidden.delete(activeName);
    namesToHide.forEach((n) => currentHidden.add(n));
    setHiddenTabs([...currentHidden]);

    namesToHide.forEach((name) => {
      const label = [...document.querySelectorAll(CONFIG.SELECTORS.TAB_NAME)].find(
        (el) => el.textContent.trim() === name
      );
      if (label) {
        const elTab = label.closest(CONFIG.SELECTORS.SHEET_TAB);
        if (elTab) elTab.style.display = "none";
      }
      updateListItemHiddenState(findListItemByTabName(name), true);
    });

    if (activeName) {
      const activeLabel = [...document.querySelectorAll(CONFIG.SELECTORS.TAB_NAME)].find(
        (el) => el.textContent.trim() === activeName
      );
      if (activeLabel) {
        const activeTabEl = activeLabel.closest(CONFIG.SELECTORS.SHEET_TAB);
        if (activeTabEl) activeTabEl.style.display = "";
      }
      updateListItemHiddenState(findListItemByTabName(activeName), false);
    }

    showUndo("Hidden visible tabs.", previousHiddenTabs);
    searchInput?.dispatchEvent(new Event("input"));
    updateStats();
  });

  showAllBtn.addEventListener("click", () => {
    const previousHiddenTabs = getHiddenTabs();
    setHiddenTabs([]);

    document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB).forEach((tab) => {
      tab.style.display = "";
    });

    document.querySelectorAll("#tabList li").forEach((li) => {
      updateListItemHiddenState(li, false);
    });

    showUndo("Shown all hidden tabs.", previousHiddenTabs);
    searchInput?.dispatchEvent(new Event("input"));
    updateStats();
  });

  const debouncedUpdateStats = debounce(updateStats, CONFIG.STATS_UPDATE_DEBOUNCE);
  const tabsContainer = getTabsContainer();
  if (tabsContainer) {
    const statsObserver = new MutationObserver(() => {
      debouncedUpdateStats();
    });
    statsObserver.observe(tabsContainer, { childList: true });
  }

  updateStats();
  popup._updateStats = updateStats;
  return updateStats;
}

function renderTabList(popup, tabList, searchInput, updateStats) {
  const hiddenTabs = getHiddenTabs();
  const favoriteTabs = new Set(getFavoriteTabs());
  applyHiddenTabsFromStorage();

  const tabs = document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB);

  tabs.forEach((tab) => {
    const li = document.createElement("li");
    const tabName = tab.querySelector(CONFIG.SELECTORS.TAB_NAME);
    const colorIndicator = tab.querySelector(CONFIG.SELECTORS.TAB_COLOR);
    const isHidden =
      tab.getAttribute("aria-hidden") === "true" || tab.style.display === "none";
    const isActive = tab.classList.contains("docs-sheet-active-tab");

    let color = "black";
    let textColor = isHidden ? "var(--ui-text-muted)" : "var(--ui-text)";

    if (colorIndicator) {
      color = window.getComputedStyle(colorIndicator).backgroundColor;
    }

    const tabText = tabName.textContent.trim();
    const isChecked = hiddenTabs.includes(tabText);
    const isFavorite = favoriteTabs.has(tabText);
    const isDuplicate = isDuplicateTabName(tabText);

    if (isDuplicate) {
      li.style.borderLeft = "3px solid #ff9800";
      li.title = `${tabText} ⚠️ Duplicate name detected`;
    } else {
      li.title = tabText;
    }

    li.innerHTML = `
      <input type="checkbox" class="tabCheckbox" ${isChecked ? "checked" : ""}>
      <button class="favorite-btn ${
        isFavorite ? "is-favorite" : ""
      }" title="Toggle favorite" aria-label="Toggle favorite">★</button>
      <span class="tab-color-dot" style='color: ${color};'>●</span>
      <strong class="tab-name" style='color: ${textColor};'>${tabText}</strong>
    `;
    li.classList.add("tab-item");
    li.dataset.isHidden = isChecked ? "true" : "false";
    li.dataset.isFavorite = isFavorite ? "true" : "false";
    li.dataset.tabName = tabText;

    li.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("tabCheckbox") ||
        e.target.classList.contains("favorite-btn")
      ) {
        return;
      }

      simulateClick(tab);
      addToHistory(tabText);
      hidePopup(popup);
    });

    const checkbox = li.querySelector(".tabCheckbox");
    const favoriteBtn = li.querySelector(".favorite-btn");

    favoriteBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const favorite = toggleFavoriteTab(tabText);
      li.dataset.isFavorite = favorite ? "true" : "false";
      favoriteBtn.classList.toggle("is-favorite", favorite);
      searchInput?.dispatchEvent(new Event("input"));
    });

    checkbox.addEventListener("change", (e) => {
      e.stopPropagation();
      const checked = e.target.checked;

      if (checked) {
        hideTab(tabText);
      } else {
        showTab(tabText);
      }

      const matchingTab = [...document.querySelectorAll(CONFIG.SELECTORS.TAB_NAME)].find(
        (el) => el.textContent.trim() === tabText
      );
      if (matchingTab) {
        const elTab = matchingTab.closest(CONFIG.SELECTORS.SHEET_TAB);
        if (elTab) elTab.style.display = checked ? "none" : "";
      }

      updateListItemHiddenState(li, checked);
      searchInput?.dispatchEvent(new Event("input"));
      updateStats();
    });

    if (isActive) {
      li.classList.add("active-tab-item");
      li.style.fontWeight = "bold";
    }

    tabList.appendChild(li);
  });
}

function populatePopupContent(popup) {
  const tabList = popup.querySelector("ul");
  const searchInput = popup.querySelector("#searchTabs");

  if (!tabList || !searchInput) {
    console.error("❌ Popup elements not found");
    return;
  }

  tabList.innerHTML = "";

  const historyList = popup.querySelector("#historyList");
  renderHistoryList(popup, historyList);
  tabList.style.display = "block";

  bindSortHandler(popup);

  setTimeout(() => {
    const updateStats = ensureBulkActions(popup, searchInput);
    renderTabList(popup, tabList, searchInput, updateStats);

    showPopup(popup);
    searchInput.value = "";
    searchInput.focus();
  }, 0);
}
