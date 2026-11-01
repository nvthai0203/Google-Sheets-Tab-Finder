// Utility Helper Functions

/**
 * Extract the Google Sheets spreadsheet ID from a URL pathname.
 * Supports /spreadsheets/d/{id}, /spreadsheets/u/0/d/{id},
 * and published URLs /spreadsheets/d/e/{id}/pubhtml.
 * @param {string} [pathname]
 * @returns {string} Spreadsheet ID or empty string
 */
function getSpreadsheetId(pathname = typeof location !== "undefined" ? location.pathname : "") {
    const path = String(pathname);
    const published = path.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/e\/([a-zA-Z0-9-_]+)/);
    if (published) return published[1];

    const match = path.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
    if (!match || match[1] === "e") return "";
    return match[1];
}

/**
 * Normalize text by converting to lowercase and removing Vietnamese diacritics.
 * Maps đ/Đ to d before stripping combining marks.
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalize(text) {
    return String(text ?? "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Debounce function to limit execution frequency
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 200) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Get the container element that holds all sheet tabs
 * @returns {HTMLElement|null} Container element or null
 */
function getTabsContainer() {
    const firstTab = document.querySelector(CONFIG.SELECTORS.SHEET_TAB);
    return firstTab ? firstTab.parentElement : null;
}

function getSheetTabs() {
    return [...document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB)];
}

function getSheetTabByIndex(index) {
    return getSheetTabs()[Number(index)] || null;
}

function getSheetTabName(tab) {
    return tab?.querySelector(CONFIG.SELECTORS.TAB_NAME)?.textContent?.trim() || "";
}

/**
 * Count tabs hidden by this extension (storage or display we set).
 * Ignores Sheets-owned aria-hidden.
 * @returns {number} Number of hidden tabs
 */
function getActualHiddenCount() {
    const hiddenNames = new Set(typeof getHiddenTabs === "function" ? getHiddenTabs() : []);
    let hidden = 0;
    getSheetTabs().forEach((tab) => {
        const name = getSheetTabName(tab);
        if ((name && hiddenNames.has(name)) || tab.style.display === "none") {
            hidden += 1;
        }
    });
    return hidden;
}

/**
 * Simulate mouse click events on an element
 * @param {HTMLElement} element - Element to click
 */
function simulateClick(element) {
    element.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window
    }));
    element.dispatchEvent(new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        view: window
    }));
    element.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
    }));
}

/**
 * Get all sheet tab names from the current spreadsheet
 * @returns {string[]} Array of tab names
 */
function getAllTabNames() {
    return getSheetTabs().map((tab) => getSheetTabName(tab)).filter(Boolean);
}

/**
 * Check if a tab name is duplicated across sheet tabs
 * @param {string} tabName - Name to check
 * @returns {boolean} True if duplicate exists
 */
function isDuplicateTabName(tabName) {
    return getAllTabNames().filter((name) => name === tabName).length > 1;
}

/**
 * Get the currently active tab name
 * @returns {string|null} Active tab name or null
 */
function getActiveTabName() {
    const activeTab = document.querySelector(
        `${CONFIG.SELECTORS.ACTIVE_TAB} ${CONFIG.SELECTORS.TAB_NAME}`
    );
    return activeTab ? activeTab.textContent.trim() : null;
}

function findSheetTabByName(tabName) {
    const matches = getSheetTabs().filter((tab) => getSheetTabName(tab) === tabName);
    return matches.find((tab) => tab.style.display !== "none") || matches[0] || null;
}

function activateSheetTab(tab, tabName, popup) {
    if (!tab || !tabName) return false;
    if (typeof showTab === "function") showTab(tabName);
    tab.style.display = "";
    simulateClick(tab);
    if (typeof addToHistory === "function") addToHistory(tabName);
    if (popup && typeof hidePopup === "function") hidePopup(popup);
    return true;
}

let hiddenTabsApplyTimer = null;
let hiddenTabsApplyAttempts = 0;

function stopApplyingHiddenTabs() {
    if (hiddenTabsApplyTimer != null) {
        clearInterval(hiddenTabsApplyTimer);
        hiddenTabsApplyTimer = null;
    }
    hiddenTabsApplyAttempts = 0;
}

function getHiddenTabsApplyState() {
    return {
        timerActive: hiddenTabsApplyTimer != null,
        attempts: hiddenTabsApplyAttempts
    };
}

function applyHiddenTabsNow() {
    const tabs = getSheetTabs();
    if (tabs.length === 0) return false;

    const hiddenTabs = typeof getHiddenTabs === "function" ? getHiddenTabs() : [];
    tabs.forEach((tab) => {
        const name = getSheetTabName(tab);
        if (name && hiddenTabs.includes(name)) {
            tab.style.display = "none";
        }
    });
    return true;
}

function applyHiddenTabsFromStorage() {
    stopApplyingHiddenTabs();

    if (applyHiddenTabsNow()) return;

    hiddenTabsApplyTimer = setInterval(() => {
        hiddenTabsApplyAttempts += 1;
        const maxAttempts = CONFIG.MAX_HIDDEN_APPLY_ATTEMPTS || 40;
        if (applyHiddenTabsNow() || hiddenTabsApplyAttempts >= maxAttempts) {
            stopApplyingHiddenTabs();
        }
    }, CONFIG.RETRY_INTERVAL);
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("pagehide", stopApplyingHiddenTabs);
}

function isAllSheetsButton(el) {
    if (!el?.classList?.contains("docs-sheet-menu-button")) return false;

    const label = `${el.getAttribute?.("data-tooltip") || ""} ${el.getAttribute?.("aria-label") || ""}`.toLowerCase();
    if ((CONFIG.ALL_SHEETS_TOOLTIP_MARKERS || []).some((marker) => label.includes(marker))) {
        return true;
    }

    const bar = el.closest?.(CONFIG.SELECTORS.SHEET_BUTTON_BAR);
    if (!bar) return false;
    return bar.querySelector(".docs-sheet-menu-button") === el;
}

function shouldOpenPopupShortcut(event) {
    return Boolean(
        event &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        String(event.key || "").toLowerCase() === CONFIG.SHORTCUTS.OPEN_POPUP
    );
}

function getOpenPopupShortcutLabel(platform = typeof navigator !== "undefined" ? navigator.platform : "") {
    return /Mac|iPhone|iPad|iPod/i.test(String(platform)) ? "Cmd + S" : "Ctrl + S";
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getSpreadsheetId,
        normalize,
        debounce,
        getTabsContainer,
        getSheetTabs,
        getSheetTabByIndex,
        getSheetTabName,
        getActualHiddenCount,
        simulateClick,
        getAllTabNames,
        isDuplicateTabName,
        getActiveTabName,
        findSheetTabByName,
        activateSheetTab,
        stopApplyingHiddenTabs,
        getHiddenTabsApplyState,
        applyHiddenTabsNow,
        applyHiddenTabsFromStorage,
        isAllSheetsButton,
        shouldOpenPopupShortcut,
        getOpenPopupShortcutLabel
    };
}
