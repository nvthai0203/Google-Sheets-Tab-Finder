// Popup content: history, tab list, sort, bulk hide/show

function getListItemName(li) {
  return li?.dataset?.tabName || li?.querySelector("strong")?.textContent?.trim() || "";
}

function findListItemByTabIndex(index) {
  return document.querySelector(`#tabList li[data-tab-index="${index}"]`);
}

function findListItemByTabName(tabName) {
  return [...document.querySelectorAll("#tabList li")].find(
    (item) => getListItemName(item) === tabName
  );
}

function updateListItemHiddenState(li, isHidden) {
  if (!li) return;
  li.dataset.isHidden = isHidden ? "true" : "false";
  const st = li.querySelector("strong");
  if (st) {
    st.style.color = isHidden ? "var(--ui-text-muted)" : "var(--ui-text)";
  }
}

function syncTabListFromHiddenSet(hiddenSet, searchInput, updateStats) {
  getSheetTabs().forEach((tab, index) => {
    const name = getSheetTabName(tab);
    if (!name) return;
    tab.style.display = hiddenSet.has(name) ? "none" : "";
    const li = findListItemByTabIndex(index) || findListItemByTabName(name);
    updateListItemHiddenState(li, hiddenSet.has(name));
  });

  const popup = getSheetTabPopup?.() || searchInput?.closest("#sheetTabPopup");
  if (popup && typeof refreshTabListView === "function") {
    refreshTabListView(popup);
  } else {
    searchInput?.dispatchEvent(new Event("input"));
  }
  updateStats?.();
}

function renderHistoryList(popup, historyList) {
  if (!historyList) return;

  historyList.replaceChildren();
  const historyTabs = getHistoryTabs();

  historyTabs.forEach((tabName, index) => {
    const li = document.createElement("li");
    li.classList.add("history-item");

    const content = document.createElement("div");
    content.className = "history-item-content";

    const rank = document.createElement("span");
    rank.className = "history-rank";
    rank.textContent = String(index + 1);

    const name = document.createElement("span");
    name.className = "history-tab-name";
    name.textContent = tabName;

    content.append(rank, name);
    li.appendChild(content);
    li.title = `Click to switch to "${tabName}"`;

    li.addEventListener("click", () => {
      const elTab = findSheetTabByName(tabName);
      if (elTab) {
        activateSheetTab(elTab, tabName, popup);
      } else {
        alert("Not found in this Sheet!");
      }
    });

    historyList.appendChild(li);
  });
}

function sortTabItems(items, sortType = "default") {
  const list = [...items];

  switch (sortType) {
    case "alphabetical":
      return list.sort((a, b) =>
        getListItemName(a).toLowerCase().localeCompare(getListItemName(b).toLowerCase())
      );

    case "color":
      return list.sort((a, b) => {
        const colorA = a.dataset?.tabColor || a.querySelector("span")?.style.color || "black";
        const colorB = b.dataset?.tabColor || b.querySelector("span")?.style.color || "black";
        return colorA.localeCompare(colorB);
      });

    case "recent": {
      const recentTabs = getHistoryTabs();
      return list.sort((a, b) => {
        const textA = getListItemName(a);
        const textB = getListItemName(b);
        const indexA = recentTabs.indexOf(textA);
        const indexB = recentTabs.indexOf(textB);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return textA.localeCompare(textB);
      });
    }

    case "default":
    default:
      return list.sort((a, b) => {
        const indexA = Number(a.dataset?.tabIndex);
        const indexB = Number(b.dataset?.tabIndex);
        if (Number.isFinite(indexA) && Number.isFinite(indexB)) {
          return indexA - indexB;
        }
        const originalOrder = getAllTabNames();
        return originalOrder.indexOf(getListItemName(a)) - originalOrder.indexOf(getListItemName(b));
      });
  }
}

function bindSortHandler(popup) {
  const sortSelect = popup.querySelector("#sortTabs");
  if (!sortSelect || sortSelect.dataset.bound) return;

  sortSelect.dataset.bound = "true";
  sortSelect.addEventListener("change", () => {
    refreshTabListView(popup);
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
    const { totalTabs, hiddenCount, visibleCount } =
      typeof getHiddenTabStats === "function"
        ? getHiddenTabStats()
        : {
            totalTabs: getSheetTabs().length,
            hiddenCount: getActualHiddenCount(),
            visibleCount: getSheetTabs().length - getActualHiddenCount()
          };
    const statsEl = popup.querySelector("#tabStats");
    if (statsEl) {
      statsEl.textContent = `Total: ${totalTabs} | Hidden: ${hiddenCount} | Visible: ${visibleCount}`;
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

  const setQuickFilter = (filter) => {
    popup.dataset.quickFilter = filter;
    popup.querySelectorAll(".quick-filter-btn").forEach((btn) => {
      btn.classList.toggle("active", (btn.dataset.filter || "all") === filter);
    });
  };

  hideAllBtn.addEventListener("click", () => {
    const previousHiddenTabs = getHiddenTabs();
    const activeName = getActiveTabName();

    const visibleLis = [...document.querySelectorAll("#tabList li")].filter(
      (li) => li.style.display !== "none" && li.id !== "tabNotFound"
    );

    const currentHidden = new Set(getHiddenTabs());
    if (activeName) currentHidden.delete(activeName);

    visibleLis.forEach((li) => {
      const name = getListItemName(li);
      if (!name) return;

      if (name === activeName) {
        updateListItemHiddenState(li, false);
        return;
      }

      currentHidden.add(name);
      updateListItemHiddenState(li, true);
    });

    setHiddenTabs([...currentHidden]);
    applyHiddenTabsNow();
    showUndo("Hidden visible tabs.", previousHiddenTabs);

    // Keep the list readable after bulk hide (Visible filter would go empty).
    if ((popup.dataset.quickFilter || "all") === "visible") {
      setQuickFilter("all");
    }

    refreshTabListView(popup);
    updateStats();
  });

  showAllBtn.addEventListener("click", () => {
    const previousHiddenTabs = getHiddenTabs();
    setHiddenTabs([]);

    document.querySelectorAll("#tabList li").forEach((li) => {
      updateListItemHiddenState(li, false);
    });

    if (typeof showAllExtensionHiddenSheetTabs === "function") {
      showAllExtensionHiddenSheetTabs();
    } else {
      getSheetTabs().forEach((tab) => {
        tab.style.display = "";
      });
    }

    showUndo("Shown all hidden tabs.", previousHiddenTabs);

    // Hidden filter would show an empty list after everything is unhidden.
    if ((popup.dataset.quickFilter || "all") === "hidden") {
      setQuickFilter("all");
    }

    refreshTabListView(popup);
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

function appendTabListItem(popup, tabList, updateStats, options) {
  const {
    tab = null,
    tabText,
    index,
    isHidden = false,
    isActive = false,
    color = "black",
    isFavorite = false,
    missingFromBar = false
  } = options;

  const li = document.createElement("li");
  const textColor = isHidden ? "var(--ui-text-muted)" : "var(--ui-text)";
  const isDuplicate = !missingFromBar && isDuplicateTabName(tabText);

  if (isDuplicate) {
    li.style.borderLeft = "3px solid #ff9800";
    li.title = `${tabText} ⚠️ Duplicate name detected`;
  } else if (missingFromBar) {
    li.title = `${tabText} (hidden — not in tab bar)`;
  } else {
    li.title = tabText;
  }

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = isFavorite ? "favorite-btn is-favorite" : "favorite-btn";
  favoriteBtn.title = "Toggle favorite";
  favoriteBtn.setAttribute("aria-label", "Toggle favorite");
  favoriteBtn.textContent = "★";

  const colorDot = document.createElement("span");
  colorDot.className = "tab-color-dot";
  colorDot.textContent = "●";
  colorDot.style.color = color;

  const nameEl = document.createElement("strong");
  nameEl.className = "tab-name";
  nameEl.textContent = tabText;
  nameEl.style.color = textColor;

  li.append(favoriteBtn, colorDot, nameEl);
  li.classList.add("tab-item");
  li.dataset.isHidden = isHidden ? "true" : "false";
  li.dataset.isFavorite = isFavorite ? "true" : "false";
  li.dataset.tabName = tabText;
  li.dataset.tabIndex = String(index);
  li.dataset.tabColor = color;
  if (missingFromBar) li.dataset.missingFromBar = "true";

  li.addEventListener("click", (e) => {
    if (e.target.classList.contains("favorite-btn")) {
      return;
    }

    const elTab = tab || findSheetTabByName(tabText);
    if (elTab) {
      activateSheetTab(elTab, tabText, popup);
      return;
    }

    // Storage-only row: clear hide state; Sheets may need All Sheets to restore the node.
    showTab(tabText);
    updateListItemHiddenState(li, false);
    refreshTabListView(popup);
    updateStats?.();
  });

  favoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const favorite = toggleFavoriteTab(tabText);
    li.dataset.isFavorite = favorite ? "true" : "false";
    favoriteBtn.classList.toggle("is-favorite", favorite);
    refreshTabListView(popup);
  });

  if (isActive) {
    li.classList.add("active-tab-item");
    li.style.fontWeight = "bold";
  }

  tabList.appendChild(li);
  return li;
}

function renderTabList(popup, tabList, searchInput, updateStats) {
  const hiddenTabs = typeof reconcileHiddenTabsWithDom === "function"
    ? reconcileHiddenTabsWithDom()
    : getHiddenTabs();
  const hiddenSet = new Set(hiddenTabs);
  const favoriteTabs = new Set(getFavoriteTabs());
  applyHiddenTabsFromStorage();

  const renderedNames = new Set();

  getSheetTabs().forEach((tab, index) => {
    const tabName = tab.querySelector(CONFIG.SELECTORS.TAB_NAME);
    const colorIndicator = tab.querySelector(CONFIG.SELECTORS.TAB_COLOR);
    const tabText = tabName?.textContent.trim() || "";
    if (!tabText) return;

    renderedNames.add(tabText);
    let color = "black";
    if (colorIndicator) {
      color = window.getComputedStyle(colorIndicator).backgroundColor;
    }

    appendTabListItem(popup, tabList, updateStats, {
      tab,
      tabText,
      index,
      isHidden: hiddenSet.has(tabText) || isExtensionHiddenTabElement(tab),
      isActive: tab.classList.contains("docs-sheet-active-tab"),
      color,
      isFavorite: favoriteTabs.has(tabText)
    });
  });

  // Tabs still in storage but removed from the bar must appear for Hidden filter/stats.
  hiddenTabs.forEach((tabText) => {
    if (!tabText || renderedNames.has(tabText)) return;
    appendTabListItem(popup, tabList, updateStats, {
      tabText,
      index: renderedNames.size,
      isHidden: true,
      isFavorite: favoriteTabs.has(tabText),
      missingFromBar: true
    });
    renderedNames.add(tabText);
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
  bindFloatingButtonToggle(popup);

  setTimeout(() => {
    const updateStats = ensureBulkActions(popup, searchInput);
    renderTabList(popup, tabList, searchInput, updateStats);

    showPopup(popup);
    searchInput.value = "";
    refreshTabListView(popup);
    updateStats();
    searchInput.focus();
  }, 0);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    findListItemByTabIndex,
    findListItemByTabName,
    updateListItemHiddenState,
    syncTabListFromHiddenSet,
    renderHistoryList,
    sortTabItems,
    bindSortHandler,
    ensureBulkActions,
    appendTabListItem,
    renderTabList,
    populatePopupContent
  };
}
