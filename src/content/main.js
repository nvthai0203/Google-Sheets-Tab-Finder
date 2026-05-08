function applyHiddenTabsFromStorage() {
  const hiddenTabs = JSON.parse(localStorage.getItem("hiddenTabs")) || [];

  const tryApply = () => {
    const tabs = document.querySelectorAll(".docs-sheet-tab");

    if (tabs.length === 0) return false;

    tabs.forEach((tab) => {
      const nameEl = tab.querySelector(".docs-sheet-tab-name");
      if (nameEl && hiddenTabs.includes(nameEl.textContent.trim())) {
        tab.style.display = "none";
      }
    });

    // Ẩn luôn context menu nếu lỡ bị mở ra
    const menu = document.querySelector(".goog-menu");
    if (menu) {
      menu.style.display = "none";
    }

    return true;
  };

  const interval = setInterval(() => {
    const success = tryApply();
    if (success) clearInterval(interval);
  }, 300);
}

//History tabs
function addToHistory(tabName) {
  let historyTabs = JSON.parse(localStorage.getItem("historyTabs")) || [];

  // Đưa tab mới lên đầu, tránh trùng lặp
  historyTabs = historyTabs.filter((name) => name !== tabName);
  historyTabs.unshift(tabName);

  // Giới hạn tối đa 10
  if (historyTabs.length > 10) {
    historyTabs = historyTabs.slice(0, 10);
  }

  localStorage.setItem("historyTabs", JSON.stringify(historyTabs));
}

function getThemeMode() {
  return localStorage.getItem("popupThemeMode") || "auto";
}

function getPopupFontScale() {
  const raw = localStorage.getItem("popupFontScale") || "1";
  const allowed = new Set(["0.9", "1", "1.1", "1.2", "1.3"]);
  return allowed.has(raw) ? raw : "1";
}

function getFavoriteTabs() {
  return JSON.parse(localStorage.getItem("favoriteTabs") || "[]");
}

function setFavoriteTabs(tabs) {
  localStorage.setItem("favoriteTabs", JSON.stringify(tabs));
}

function toggleFavoriteTab(tabName) {
  const favorites = new Set(getFavoriteTabs());
  if (favorites.has(tabName)) {
    favorites.delete(tabName);
  } else {
    favorites.add(tabName);
  }
  setFavoriteTabs([...favorites]);
  return favorites.has(tabName);
}

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

//Khi click vào button tất cả trang tính
function attachPopupTriggerToAllSheetsButton() {
  const observer = new MutationObserver(() => {
    const allSheetsBtn = document.querySelector(
      '.docs-sheet-menu-button[data-tooltip="Tất cả trang tính"], .docs-sheet-menu-button[data-tooltip="All Sheets"]'
    );

    if (allSheetsBtn && !allSheetsBtn.dataset.popupBound) {
      allSheetsBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Ngăn mở menu mặc định
        e.preventDefault(); // Ngăn hành vi gốc
        toggleSheetTabsPopup(); // Mở popup custom
      });

      allSheetsBtn.dataset.popupBound = "true";
      console.log("✅ Đã gắn toggleSheetTabsPopup() vào nút 'All Sheets'");

      // ⛔ Ngắt observer sau khi bind xong để tránh callback chạy suốt
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Hiển thị popup khi nhấn vào nút
function toggleSheetTabsPopup() {
  console.log("📜 Đang mở popup...");
  let popup = document.getElementById("sheetTabPopup");
  let searchInput;
  let popupReady = false;

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "sheetTabPopup";
    popup.dataset.ready = "false";

    document.body.appendChild(popup);

    // Load HTML from external file
    fetch(chrome.runtime.getURL("src/content/popup.html"))
      .then((response) => response.text())
      .then((html) => {
        popup.innerHTML = html;
        popup.dataset.ready = "true";
        popup.dataset.quickFilter = popup.dataset.quickFilter || "all";
        applyPopupTheme(popup);
        applyPopupFontScale(popup);

        const themeModeSelect = popup.querySelector("#themeMode");
        if (themeModeSelect) {
          themeModeSelect.value = getThemeMode();
          themeModeSelect.addEventListener("change", () => {
            const mode = themeModeSelect.value;
            localStorage.setItem("popupThemeMode", mode);
            applyPopupTheme(popup, mode);
          });
        }

        const fontSizeSelect = popup.querySelector("#fontSizeMode");
        if (fontSizeSelect) {
          fontSizeSelect.value = getPopupFontScale();
          fontSizeSelect.addEventListener("change", () => {
            const scale = fontSizeSelect.value;
            localStorage.setItem("popupFontScale", scale);
            applyPopupFontScale(popup, scale);
          });
        }

        // Xử lý toggle ẩn/hiện nút EagleX Dev Tool
        const toggleBtn = popup.querySelector("#toggleEagleXBtn");
        const devBtn = document.getElementById("openSheetPopup");

        if (toggleBtn && devBtn) {
          toggleBtn.checked = devBtn.style.display !== "none";

          toggleBtn.addEventListener("change", function () {
            devBtn.style.display = this.checked ? "block" : "none";
            localStorage.setItem("eaglexBtnVisible", this.checked);
          });
        }

        // event click nut X
        const closeBtn = document.getElementById("closePopup");
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            popup.style.display = "none";
          });
        }

        // Gắn handler filter input 1 lần
        searchInput = popup.querySelector("#searchTabs");

        // --- Helpers cho search chính xác hơn ---
        const normalize = (s) =>
          s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
            .trim();

        const scoreMatch = (queryRaw, textRaw) => {
          const q = normalize(queryRaw);
          const t = normalize(textRaw);
          if (!q) return 0;
          if (q === t) return 100; // exact
          if (t.startsWith(q)) return 90; // prefix
          // match theo từ đầy đủ
          const words = t.split(/\s+/);
          if (words.some((w) => w === q)) return 85;
          if (t.includes(q)) return 75; // substring

          // subsequence (fuzzy nhẹ)
          let qi = 0;
          for (let i = 0; i < t.length && qi < q.length; i++) {
            if (t[i] === q[qi]) qi++;
          }
          if (qi === q.length) {
            // phạt theo độ dài chênh lệch để bớt "loãng"
            const penalty = Math.min(20, Math.floor((t.length - q.length) / 2));
            return 60 - penalty;
          }

          return 0;
        };

        let selectedIndex = 0;

        if (searchInput) {
          searchInput.addEventListener("input", () => {
            const q = searchInput.value;
            const currentQuickFilter = popup.dataset.quickFilter || "all";
            const allLis = [
              ...document.querySelectorAll("#sheetTabPopup #tabList li"),
            ];
            const items = allLis.filter((li) => li.id !== "tabNotFound");

            // Tính điểm & ẩn/hiện
            const scored = [];
            items.forEach((li, index) => {
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

            // Sắp xếp theo điểm giảm dần (giữ thứ tự cũ nếu điểm bằng nhau)
            scored.sort((a, b) => b.s - a.s);

            const tabListEl = document.querySelector("#sheetTabPopup #tabList");
            // Re-append theo thứ tự mới (chỉ những li đang hiển thị)
            scored.forEach(({ li }) => tabListEl.appendChild(li));

            // Not found
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

            // Reset lựa chọn
            selectedIndex = 0;
            if (scored.length > 0) {
              scored[0].li.classList.add("selected-tab");
              scored[0].li.scrollIntoView({ block: "nearest" });
            }
          });

          // Keyboard navigation
          searchInput.addEventListener("keydown", (e) => {
            const visibleItems = [
              ...document.querySelectorAll("#sheetTabPopup #tabList li"),
            ].filter((li) => li.style.display !== "none" && li.id !== "tabNotFound");

            // 🛡️ Không có item thì bỏ qua
            if (!visibleItems.length) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              visibleItems[selectedIndex]?.classList.remove("selected-tab");
              selectedIndex = (selectedIndex + 1) % visibleItems.length;
              visibleItems[selectedIndex]?.classList.add("selected-tab");
              visibleItems[selectedIndex]?.scrollIntoView({
                block: "nearest",
              });
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              visibleItems[selectedIndex]?.classList.remove("selected-tab");
              selectedIndex =
                selectedIndex === 0 ? visibleItems.length - 1 : selectedIndex - 1;
              visibleItems[selectedIndex]?.classList.add("selected-tab");
              visibleItems[selectedIndex]?.scrollIntoView({
                block: "nearest",
              });
            } else if (e.key === "Enter") {
              e.preventDefault();
              visibleItems[selectedIndex]?.click();
            }
          });
        }

        const quickFilterButtons = popup.querySelectorAll(".quick-filter-btn");
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

        // Now populate the popup content
        populatePopupContent(popup);
      })
      .catch((error) => {
        console.error("❌ Error loading popup HTML:", error);
      });

    // ESC để đóng popup
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup.style.display === "block") {
        popup.style.display = "none";
      }
    });

    return; // Exit after creating popup, wait for HTML to load
  }

  // Check if popup is ready
  if (popup.dataset.ready !== "true") {
    console.warn("⚠️ Popup HTML chưa load xong, vui lòng đợi...");
    return;
  }

  if (popup.style.display === "block") {
    popup.style.display = "none";
    return;
  }

  applyPopupTheme(popup);
  applyPopupFontScale(popup);

  // Now populate content since HTML is ready
  populatePopupContent(popup);
}

// Function to populate popup content
function populatePopupContent(popup) {
  const tabList = popup.querySelector("ul");
  const searchInput = popup.querySelector("#searchTabs");
  
  if (!tabList || !searchInput) {
    console.error("❌ Popup elements not found");
    return;
  }
  
  tabList.innerHTML = "";

  const historyList = popup.querySelector("#historyList");
  if (historyList) {
    historyList.innerHTML = "";
  }
  const historyTabs = JSON.parse(localStorage.getItem("historyTabs")) || [];

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
      const tab = [...document.querySelectorAll(".docs-sheet-tab-name")].find(
        (el) => el.textContent.trim() === tabName
      );

      if (tab) {
        const elTab = tab.closest(".docs-sheet-tab");
        if (elTab) {
          elTab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          elTab.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          elTab.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          addToHistory(tabName); // cập nhật lại lịch sử
          popup.style.display = "none";
        }
      } else {
        alert("Not found in this Sheet!");
      }
    });

    if (historyList) {
      historyList.appendChild(li);
    }
  });

  tabList.style.display = "block";

  // Add sorting functionality
  const sortSelect = popup.querySelector("#sortTabs");
  sortSelect?.addEventListener("change", (e) => {
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

      case "recent":
        const historyTabs =
          JSON.parse(localStorage.getItem("historyTabs")) || [];
        sortedItems = items.sort((a, b) => {
          const textA = a.querySelector("strong").textContent;
          const textB = b.querySelector("strong").textContent;
          const indexA = historyTabs.indexOf(textA);
          const indexB = historyTabs.indexOf(textB);

          // If both are in history, sort by history order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // If only A is in history, A comes first
          if (indexA !== -1) return -1;
          // If only B is in history, B comes first
          if (indexB !== -1) return 1;
          // If neither is in history, maintain alphabetical order
          return textA.localeCompare(textB);
        });
        break;

      case "default":
      default:
        // Get original order from DOM
        const tabs = document.querySelectorAll(".docs-sheet-tab");
        const originalOrder = [...tabs].map((tab) =>
          tab.querySelector(".docs-sheet-tab-name").textContent.trim()
        );

        sortedItems = items.sort((a, b) => {
          const textA = a.querySelector("strong").textContent;
          const textB = b.querySelector("strong").textContent;
          const indexA = originalOrder.indexOf(textA);
          const indexB = originalOrder.indexOf(textB);
          return indexA - indexB;
        });
        break;
    }

    // Clear and re-append sorted items
    tabListElement.innerHTML = "";
    sortedItems.forEach((item) => tabListElement.appendChild(item));

    // Reset selection after sorting
    selectedIndex = 0;
    const visibleItems = sortedItems.filter(
      (item) => item.style.display !== "none"
    );
    if (visibleItems.length > 0) {
      visibleItems.forEach((item) => item.classList.remove("selected-tab"));
      visibleItems[0].classList.add("selected-tab");
    }
  });

  // Add bulk action handlers
  setTimeout(() => {
    const hideAllBtn = popup.querySelector("#hideAllTabs");
    const showAllBtn = popup.querySelector("#showAllTabs");
    const undoBar = popup.querySelector("#undoBar");
    const undoMessage = popup.querySelector("#undoMessage");
    const undoActionBtn = popup.querySelector("#undoActionBtn");

    let lastUndoHiddenTabs = null;
    let undoTimer = null;

    const restoreHiddenTabs = (hiddenTabsSnapshot) => {
      const hiddenSet = new Set(hiddenTabsSnapshot || []);
      localStorage.setItem("hiddenTabs", JSON.stringify([...hiddenSet]));

      document.querySelectorAll(".docs-sheet-tab").forEach((tab) => {
        const name = tab.querySelector(".docs-sheet-tab-name")?.textContent?.trim();
        if (!name) return;
        tab.style.display = hiddenSet.has(name) ? "none" : "";
      });

      document.querySelectorAll("#tabList li").forEach((li) => {
        const tabName = li.querySelector("strong")?.textContent?.trim();
        if (!tabName) return;
        const isHidden = hiddenSet.has(tabName);
        li.dataset.isHidden = isHidden ? "true" : "false";
        const cb = li.querySelector(".tabCheckbox");
        if (cb) cb.checked = isHidden;
        const st = li.querySelector("strong");
        if (st) st.style.color = isHidden ? "var(--ui-text-muted)" : "var(--ui-text)";
      });

      searchInput?.dispatchEvent(new Event("input"));
      updateStats();
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

    hideAllBtn?.addEventListener("click", () => {
      const previousHiddenTabs =
        JSON.parse(localStorage.getItem("hiddenTabs") || "[]") || [];
      // Tên tab đang active (luôn giữ lại)
      const activeName = document
        .querySelector(".docs-sheet-active-tab .docs-sheet-tab-name")
        ?.textContent?.trim();

      // Các item đang hiện trong danh sách (đang lọc theo Search => chỉ ẩn phần đang thấy)
      const visibleLis = [...document.querySelectorAll("#tabList li")].filter(
        (li) => li.style.display !== "none" && li.id !== "tabNotFound"
      );

      // Danh sách tên tab sẽ ẩn (loại trừ tab đang active)
      const namesToHide = visibleLis
        .map((li) => li.querySelector("strong")?.textContent?.trim())
        .filter(Boolean)
        .filter((name) => name !== activeName);

      // Cập nhật localStorage.hiddenTabs: union các tab cần ẩn, nhưng đảm bảo loại bỏ active
      const currentHidden = new Set(
        JSON.parse(localStorage.getItem("hiddenTabs") || "[]")
      );
      if (activeName) currentHidden.delete(activeName);
      namesToHide.forEach((n) => currentHidden.add(n));
      localStorage.setItem("hiddenTabs", JSON.stringify([...currentHidden]));

      // Ẩn trực tiếp trên DOM & set checkbox + màu chữ cho những tab bị ẩn
      namesToHide.forEach((name) => {
        const label = [
          ...document.querySelectorAll(".docs-sheet-tab-name"),
        ].find((el) => el.textContent.trim() === name);
        if (label) {
          const elTab = label.closest(".docs-sheet-tab");
          if (elTab) elTab.style.display = "none";
        }
        const li = [...document.querySelectorAll("#tabList li")].find(
          (item) => item.querySelector("strong")?.textContent.trim() === name
        );
        if (li) {
          const cb = li.querySelector(".tabCheckbox");
          if (cb) cb.checked = true;
          li.dataset.isHidden = "true";
          const st = li.querySelector("strong");
          if (st) st.style.color = "var(--ui-text-muted)";
        }
      });

      // Đảm bảo tab active LUÔN hiển thị & UI của nó không bị tô xám
      if (activeName) {
        const activeLabel = [
          ...document.querySelectorAll(".docs-sheet-tab-name"),
        ].find((el) => el.textContent.trim() === activeName);
        if (activeLabel) {
          const activeTabEl = activeLabel.closest(".docs-sheet-tab");
          if (activeTabEl) activeTabEl.style.display = ""; // chắc chắn đang hiện
        }
        const activeLi = [...document.querySelectorAll("#tabList li")].find(
          (item) =>
            item.querySelector("strong")?.textContent.trim() === activeName
        );
        if (activeLi) {
          const cb = activeLi.querySelector(".tabCheckbox");
          if (cb) cb.checked = false;
          activeLi.dataset.isHidden = "false";
          const st = activeLi.querySelector("strong");
          if (st) st.style.color = "var(--ui-text)";
        }
      }

      showUndo("Hidden visible tabs.", previousHiddenTabs);
      searchInput?.dispatchEvent(new Event("input"));
      updateStats();
    });

    showAllBtn?.addEventListener("click", () => {
      const previousHiddenTabs =
        JSON.parse(localStorage.getItem("hiddenTabs") || "[]") || [];
      // Xóa danh sách ẩn trong localStorage
      localStorage.removeItem("hiddenTabs");

      // Hiện tất cả tab trên DOM
      document.querySelectorAll(".docs-sheet-tab").forEach((tab) => {
        tab.style.display = ""; // trả lại mặc định
      });

      // Bỏ check & màu nhạt trong list
      document.querySelectorAll("#tabList li").forEach((li) => {
        const cb = li.querySelector(".tabCheckbox");
        if (cb) cb.checked = false;
        li.dataset.isHidden = "false";
        const st = li.querySelector("strong");
        if (st) st.style.color = "var(--ui-text)";
      });

      showUndo("Shown all hidden tabs.", previousHiddenTabs);
      searchInput?.dispatchEvent(new Event("input"));
      updateStats();
    });

    // Giới hạn tần suất gọi để tránh spam
    const debounce = (fn, delay = 200) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
      };
    };

    // Lấy container chứa các .docs-sheet-tab để observer chỉ nghe khu vực tab
    const getTabsContainer = () => {
      const firstTab = document.querySelector(".docs-sheet-tab");
      return firstTab ? firstTab.parentElement : null;
    };

    const getActualHiddenCount = () => {
      const tabs = document.querySelectorAll(".docs-sheet-tab");
      let hidden = 0;
      tabs.forEach((tab) => {
        const ariaHidden = tab.getAttribute("aria-hidden") === "true";
        const styleHidden = window.getComputedStyle(tab).display === "none";
        if (ariaHidden || styleHidden) hidden++;
      });
      return hidden;
    };

    // Update statistics
    const updateStats = () => {
      const totalTabs = document.querySelectorAll(".docs-sheet-tab").length;
      const hiddenCount = getActualHiddenCount(); // đếm "ẩn thật"
      const statsEl = popup.querySelector("#tabStats");
      if (statsEl) {
        statsEl.innerHTML = `Total: ${totalTabs} | Hidden: ${hiddenCount} | Visible: ${
          totalTabs - hiddenCount
        }`;
      }
    };

    const debouncedUpdateStats = debounce(updateStats, 200);
    const tabsContainer = getTabsContainer();
    if (tabsContainer) {
      const statsObserver = new MutationObserver(() => {
        // Không theo dõi popup; chỉ theo dõi khu vực tab để tránh vòng lặp
        debouncedUpdateStats();
      });
      // Chỉ nghe thay đổi danh sách con của khu vực tab; KHÔNG dùng subtree
      statsObserver.observe(tabsContainer, { childList: true });
    }

    // Gọi 1 lần để đồng bộ ngay khi mở
    updateStats();

    const hiddenTabs = JSON.parse(localStorage.getItem("hiddenTabs")) || [];
    const favoriteTabs = new Set(getFavoriteTabs());
    applyHiddenTabsFromStorage();

    const tabs = document.querySelectorAll(".docs-sheet-tab");
    console.log(`🔍 Tìm thấy ${tabs.length} tabs trong Google Sheets`);
    if (tabs.length === 0) {
      console.warn("⚠️ Không tìm thấy tab nào trong Google Sheets!");
    }

    tabs.forEach((tab) => {
      const li = document.createElement("li");
      const tabName = tab.querySelector(".docs-sheet-tab-name");
      const colorIndicator = tab.querySelector(".docs-sheet-tab-color");
      const isHidden =
        tab.getAttribute("aria-hidden") === "true" ||
        tab.style.display === "none";
      const isActive = tab.classList.contains("docs-sheet-active-tab");

      let color = "black";
      let textColor = isHidden ? "var(--ui-text-muted)" : "var(--ui-text)";

      if (colorIndicator) {
        color = window.getComputedStyle(colorIndicator).backgroundColor;
      }

      const tabText = tabName.textContent.trim();
      const isChecked = hiddenTabs.includes(tabText);
      const isFavorite = favoriteTabs.has(tabText);

      // Check for duplicates
      const allTabNames = [
        ...document.querySelectorAll(".docs-sheet-tab-name"),
      ].map((el) => el.textContent.trim());
      const isDuplicate =
        allTabNames.filter((name) => name === tabText).length > 1;

      if (isDuplicate) {
        li.style.borderLeft = "3px solid #ff9800";
        li.title = `${tabText} ⚠️ Duplicate name detected`;
      } else {
        li.title = tabText;
      }

      li.innerHTML = `
                <input type="checkbox" class="tabCheckbox" ${
                  isChecked ? "checked" : ""
                }>
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

      // Xử lý chuyển tab khi click ngoài checkbox
      li.addEventListener("click", (e) => {
        // Ngăn nếu click vào checkbox
        if (
          e.target.classList.contains("tabCheckbox") ||
          e.target.classList.contains("favorite-btn")
        )
          return;

        console.log(`✅ Chuyển sang tab: ${tabText}`);
        tab.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
        tab.dispatchEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
        tab.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
        addToHistory(tabText); // cập nhật lại lịch sử
        popup.style.display = "none";
      });

      // Gắn sự kiện riêng cho checkbox
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
        e.stopPropagation(); // Ngăn lan event click checkbox
        let currentHiddenTabs =
          JSON.parse(localStorage.getItem("hiddenTabs")) || [];

        const isChecked = e.target.checked;

        // Cập nhật localStorage
        if (isChecked) {
          if (!currentHiddenTabs.includes(tabText)) {
            currentHiddenTabs.push(tabText);
          }
        } else {
          currentHiddenTabs = currentHiddenTabs.filter(
            (name) => name !== tabText
          );
        }
        localStorage.setItem("hiddenTabs", JSON.stringify(currentHiddenTabs));

        // Ẩn/hiện tab ngay lập tức
        const matchingTab = [
          ...document.querySelectorAll(".docs-sheet-tab-name"),
        ].find((el) => el.textContent.trim() === tabText);
        if (matchingTab) {
          const elTab = matchingTab.closest(".docs-sheet-tab");
          if (elTab) elTab.style.display = isChecked ? "none" : "";
        }
        li.dataset.isHidden = isChecked ? "true" : "false";

        // trong checkbox.addEventListener("change", ...)
        const labelStrong = li.querySelector("strong");
        if (labelStrong) {
          labelStrong.style.color = isChecked
            ? "var(--ui-text-muted)"
            : "var(--ui-text)";
        }
        searchInput?.dispatchEvent(new Event("input"));
        updateStats();
      });

      if (isActive) {
        li.classList.add("active-tab-item");
        li.style.fontWeight = "bold";
      }

      tabList.appendChild(li);
    });

    popup.style.display = "block";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus(); // Focus input khi mở
    }
  }, 0);
}

// Tổ hợp phím mở Popup Ctrl + S
// Bắt tổ hợp phím Ctrl + S
document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault(); // Ngăn hành vi lưu trang
    toggleSheetTabsPopup(); // Mở popup tab finder
  }
});

// Thêm nút mở popup
function addPopupButton() {
  let existingButton = document.getElementById("openSheetPopup");
  if (!existingButton) {
    const button = document.createElement("button");
    button.id = "openSheetPopup";
    button.textContent = "All Tabs (Ctrl + S)";
    button.style.display =
      localStorage.getItem("eaglexBtnVisible") === "false" ? "none" : "block";
    button.addEventListener("click", toggleSheetTabsPopup);
    document.body.appendChild(button);
    console.log("✅ Nút Show Tabs đã được thêm vào trang!");
  }
}

// Đợi trang tải hoàn toàn trước khi chạy script
window.addEventListener("load", () => {
  localStorage.removeItem("historyTabs"); // Reset khi reload
  setTimeout(() => {
    console.log("🚀 Extension khởi chạy, thêm nút mở popup...");
    addPopupButton();
    applyHiddenTabsFromStorage();
    attachPopupTriggerToAllSheetsButton();
  }, 3000);
});
