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

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "sheetTabPopup";

    popup.innerHTML = `
            <div id="popupHeader" style="
                position: sticky;
                top: 0;
                background: linear-gradient(135deg, #CCCCCC 0%, #CCCCCC 100%);
                z-index: 1000;
                padding: 16px;
                border-bottom: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                box-sizing: border-box;
                border-top-left-radius: 16px;
                border-top-right-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                margin-left: -20px;
                margin-right: -20px;
                width: calc(100% + 40px);
            ">

                <input type="text" id="searchTabs" placeholder="🔍 Search tabs..." style="
                    flex: 1;
                    padding: 14px 18px;
                    border: none;
                    border-radius: 25px;
                    font-size: 15px;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(10px);
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                    outline: none;
                    margin: 0 12px;
                ">
                <button id="closePopup" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    font-size: 18px;
                    color: white;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                " title="Close (ESC)">&times;</button>
            </div>
            <div style="display: flex; height: calc(100% - 65px); gap: 10px;">
                <ul id="tabList" style="padding:0;margin:0;list-style:none;overflow-y:auto;flex:2;"></ul>
                <div id="historySection" style="
                    flex: 1; 
                    border-left: 1px solid #e8ecef; 
                    padding-left: 20px; 
                    overflow-y: auto; 
                    position: relative; 
                    display: flex; 
                    flex-direction: column;
                    background: linear-gradient(180deg, #ffffff 0%, #ffffff 100%);
                    border-radius: 0 0 16px 0;
                ">
                    <div style="flex: 1; overflow-y: auto; padding: 16px 0;">
                        <div style="
                            margin-bottom: 20px; 
                            padding: 16px; 
                            background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
                            border-radius: 12px;
                            border: 1px solid #e8ecef;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        ">
                            <div id="tabStats" style="
                                font-size: 13px; 
                                color: #718096;
                                font-family: 'SF Mono', monospace;
                                background: rgba(255,255,255,0.7);
                                padding: 8px 12px;
                                border-radius: 6px;
                            "></div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; gap: 8px;">
                                <button id="hideAllTabs" style="
                                    flex: 1; 
                                    padding: 10px 16px; 
                                    border: none; 
                                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                                    color: white;
                                    border-radius: 8px; 
                                    cursor: pointer; 
                                    font-size: 13px;
                                    font-weight: 500;
                                    transition: all 0.2s ease;
                                    box-shadow: 0 2px 4px rgba(255,107,107,0.15);
                                ">🙈 Hide All Visible</button>

                                <button id="showAllTabs" style="
                                    flex: 1; 
                                    padding: 10px 16px; 
                                    border: none; 
                                    background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
                                    color: white;
                                    border-radius: 8px; 
                                    cursor: pointer; 
                                    font-size: 13px;
                                    font-weight: 500;
                                    transition: all 0.2s ease;
                                    box-shadow: 0 2px 4px rgba(64,192,87,0.15);
                                ">👁️ Show All Hidden</button>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                            <span style="font-size: 18px;">🕒</span>
                            <h3 style="margin: 0; font-size: 15px; color: #4a5568; font-weight: 600;">Recent Searches</h3>
                        </div>
                        <div style="height: 2px; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 1px; margin-bottom: 16px;"></div>
                        <ul id="historyList" style="
                            list-style: none; 
                            padding: 0; 
                            font-size: 14px; 
                            font-weight: 500;
                        "></ul>
                    </div>

                    <div style="
                        position: sticky; 
                        bottom: 0; 
                        background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, #ffffff 100%);
                        backdrop-filter: blur(10px);
                        padding: 16px 0; 
                        margin-top: auto; 
                        border-top: 1px solid #e8ecef;
                        border-radius: 0 0 16px 0;
                    ">
                        <div style="margin-bottom: 16px;">
                            <select id="sortTabs" style="
                                width: 100%; 
                                padding: 10px 12px; 
                                border: 1px solid #e2e8f0; 
                                border-radius: 8px;
                                background: white;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                cursor: pointer;
                            ">
                                <option value="default">📋 Default Order</option>
                                <option value="alphabetical">🔤 Alphabetical</option>
                                <option value="color">🎨 By Color</option>
                                <option value="recent">⏰ Recently Used</option>
                            </select>
                        </div>
                        <label style="
                            display: flex; 
                            align-items: center; 
                            justify-content: space-between;
                            padding: 12px;
                            background: rgba(102, 126, 234, 0.05);
                            border-radius: 8px;
                            transition: all 0.2s ease;
                            cursor: pointer;
                        ">
                            <span style="font-size: 13px; color: #4a5568; font-weight: 500;">
                                Hide/Show Button Show All Tabs
                            </span>
                            <label class="switch">
                                <input type="checkbox" id="toggleEagleXBtn" checked>
                                <span class="slider round"></span>
                            </label>
                        </label>
                    </div>
                </div>

                <style>
                    /* Modern Switch Styling */
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 44px;
                        height: 24px;
                    }
                    .switch input { display: none; }
                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: linear-gradient(135deg, #cbd5e0, #a0aec0);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        border-radius: 24px;
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 18px;
                        width: 18px;
                        left: 3px;
                        bottom: 3px;
                        background: linear-gradient(135deg, #ffffff, #f7fafc);
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        border-radius: 50%;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    input:checked + .slider {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
                    }
                    input:checked + .slider:before {
                        transform: translateX(20px);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                    }

                    /* Enhanced Tab Selection */
                    .selected-tab {
                        background: linear-gradient(135deg, #667eea20, #764ba220) !important;
                        border-left: 4px solid #667eea !important;
                        transform: translateX(4px) !important;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15) !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }

                    /* Smooth Hover Effects */
                    .tab-item {
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        border-radius: 8px;
                        margin-bottom: 2px;
                    }
                    .tab-item:hover {
                        background: linear-gradient(135deg, #f7fafc, #edf2f7);
                        transform: translateX(2px);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }

                    .history-item {
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        border-radius: 6px;
                        margin-bottom: 1px;
                    }
                    .history-item:hover {
                        background: linear-gradient(135deg, #667eea15, #764ba215);
                        transform: translateX(2px);
                        color: #667eea;
                    }

                    /* Input Focus Effects */
                    #searchTabs:focus {
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), inset 0 2px 4px rgba(0,0,0,0.05);
                        background: white;
                    }

                    /* Button Hover Effects */
                    #hideAllTabs:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(255,107,107,0.3);
                    }
                    #showAllTabs:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(64,192,87,0.3);
                    }

                    /* Close Button Effects */
                    #closePopup:hover {
                        background: rgba(255,255,255,0.3) !important;
                        transform: scale(1.1);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    /* Select Dropdown Styling */
                    #sortTabs:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    }
                    #sortTabs:hover {
                        border-color: #a0aec0;
                    }

                    /* Scrollbar Styling */
                    ::-webkit-scrollbar {
                        width: 6px;
                        height: 0px; /* Hide horizontal scrollbar */
                    }
                    ::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 3px;
                    }
                    ::-webkit-scrollbar-thumb {
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border-radius: 3px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(135deg, #5a67d8, #6b46c1);
                    }

                    /* Animation for popup appearance */
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -60%) scale(0.9);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, -50%) scale(1);
                        }
                    }
                </style>

            </div>
            <ul style="
                                padding:0;
                                margin:0;
                                list-style:none;
                                overflow-y: auto;
                            ">
            </ul>
        `;

    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "linear-gradient(145deg, #ffffff, #ffffff)";
    popup.style.border = "1px solid #e2e8f0";
    popup.style.borderRadius = "20px";
    popup.style.padding = "0 20px 20px 20px";
    popup.style.boxShadow =
      "0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.05)";
    popup.style.zIndex = "100000";
    popup.style.width = "min(100vw, 1050px)";
    popup.style.height = "min(95vh, 900px)";
    popup.style.maxHeight = "95vh";
    popup.style.overflowY = "hidden";
    popup.style.overflowX = "hidden";
    popup.style.display = "none";
    popup.style.boxSizing = "border-box";
    popup.style.backdropFilter = "blur(20px)";
    popup.style.animation = "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    document.body.appendChild(popup);

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
    document.getElementById("closePopup").addEventListener("click", () => {
      popup.style.display = "none";
    });

    // Js cho nut X
    const closeBtn = document.getElementById("closePopup");
    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.color = "#e74c3c";
      closeBtn.style.transform = "scale(1.2)";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.color = "#555";
      closeBtn.style.transform = "scale(1)";
    });

    // ESC để đóng popup
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup.style.display === "block") {
        popup.style.display = "none";
      }
    });

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
        // phạt theo độ dài chênh lệch để bớt “loãng”
        const penalty = Math.min(20, Math.floor((t.length - q.length) / 2));
        return 60 - penalty;
      }

      return 0;
    };

    let selectedIndex = 0;

    searchInput.addEventListener("input", () => {
      const q = searchInput.value;
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
        const isHit = s > 0 || q === "";
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

  if (popup.style.display === "block") {
    popup.style.display = "none";
    return;
  }

  const tabList = popup.querySelector("ul");
  searchInput = popup.querySelector("#searchTabs");
  tabList.innerHTML = "";

  const historyList = popup.querySelector("#historyList");
  historyList.innerHTML = "";
  const historyTabs = JSON.parse(localStorage.getItem("historyTabs")) || [];

  historyTabs.forEach((tabName, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: bold;
                ">${index + 1}</span>
                <span style="flex: 1; font-weight: 500;">${tabName}</span>
            </div>
        `;
    li.style.padding = "12px";
    li.style.cursor = "pointer";
    li.style.borderBottom = "1px solid #f1f5f9";
    li.style.borderRadius = "8px";
    li.style.marginBottom = "4px";
    li.title = `Click to switch to "${tabName}"`;
    li.classList.add("history-item");

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

    historyList.appendChild(li);
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

    hideAllBtn?.addEventListener("click", () => {
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
          const st = li.querySelector("strong");
          if (st) st.style.color = "#A0A0A0";
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
          const st = activeLi.querySelector("strong");
          if (st) st.style.color = "#000";
        }
      }

      updateStats();
    });

    showAllBtn?.addEventListener("click", () => {
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
        const st = li.querySelector("strong");
        if (st) st.style.color = "#000";
      });

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
      const hiddenCount = getActualHiddenCount(); // đếm “ẩn thật”
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
      let textColor = isHidden ? "#A0A0A0" : "#000";

      if (colorIndicator) {
        color = window.getComputedStyle(colorIndicator).backgroundColor;
      }

      const tabText = tabName.textContent.trim();
      const isChecked = hiddenTabs.includes(tabText);

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
                <input type="checkbox" class="tabCheckbox" style="margin-right: 10px; width:20px; height:20px; cursor: pointer;" ${
                  isChecked ? "checked" : ""
                }>
                <span style='color: ${color}; font-size: 20px;'>●</span>
                <strong style='font-size: 18px; color: ${textColor};'>${tabText}</strong>
            `;

      li.style.padding = "10px";
      li.style.cursor = "pointer";
      li.style.borderBottom = "1px solid #ddd";
      li.classList.add("tab-item");

      // Xử lý chuyển tab khi click ngoài checkbox
      li.addEventListener("click", (e) => {
        // Ngăn nếu click vào checkbox
        if (e.target.classList.contains("tabCheckbox")) return;

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

        // trong checkbox.addEventListener("change", ...)
        const labelStrong = li.querySelector("strong");
        if (labelStrong) {
          labelStrong.style.color = isChecked ? "#A0A0A0" : "#000";
        }
        updateStats();
      });

      if (isActive) {
        li.style.backgroundColor = "#e6f7ff";
        li.style.fontWeight = "bold";
        li.style.borderLeft = "5px solid #1890ff";
      }

      tabList.appendChild(li);
    });

    popup.style.display = "block";
    searchInput.value = "";
    searchInput.focus(); // Focus input khi mở
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
    button.style.position = "fixed";
    button.style.bottom = "50px";
    button.style.right = "10px";
    button.style.padding = "14px 20px";
    button.style.border = "none";
    button.style.background =
      "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)";
    button.style.color = "white";
    button.style.borderRadius = "50px";
    button.style.cursor = "pointer";
    button.style.zIndex = "99999";
    button.style.boxShadow =
      "0 8px 25px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255,255,255,0.05)";
    button.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    button.style.fontSize = "14px";
    button.style.fontWeight = "600";
    button.style.backdropFilter = "blur(10px)";

    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px) scale(1.05)";
      button.style.boxShadow =
        "0 12px 35px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255,255,255,0.1)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0) scale(1)";
      button.style.boxShadow =
        "0 8px 25px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255,255,255,0.05)";
    });
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
