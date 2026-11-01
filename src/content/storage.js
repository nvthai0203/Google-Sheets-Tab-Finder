// Extension storage: chrome.storage.local when available, localStorage in tests.

const extensionStorageCache = new Map();

function isChromeStorageAvailable() {
    return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

function listStorageKeys() {
    const keys = new Set(extensionStorageCache.keys());
    if (typeof localStorage === "undefined") return [...keys];
    const length = localStorage.length || 0;
    for (let i = 0; i < length; i += 1) {
        const key = typeof localStorage.key === "function" ? localStorage.key(i) : null;
        if (key) keys.add(key);
    }
    return [...keys];
}

function storageGetItem(key) {
    if (extensionStorageCache.has(key)) {
        return extensionStorageCache.get(key);
    }
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function storageSetItem(key, value) {
    const str = String(value);
    extensionStorageCache.set(key, str);
    if (isChromeStorageAvailable()) {
        chrome.storage.local.set({ [key]: str });
        try {
            localStorage.removeItem(key);
        } catch (error) {
            // Page storage may be blocked; chrome.storage is the source of truth.
        }
        return;
    }
    try {
        localStorage.setItem(key, str);
    } catch (error) {
        console.warn("⚠️ Failed to write storage key:", key, error);
    }
}

function storageRemoveItem(key) {
    extensionStorageCache.delete(key);
    try {
        localStorage.removeItem(key);
    } catch (error) {
        // Ignore missing or blocked page storage.
    }
    if (isChromeStorageAvailable()) {
        chrome.storage.local.remove(key);
    }
}

function migratePageLocalStorage() {
    if (typeof localStorage === "undefined") return;
    const known = new Set(Object.values(CONFIG.STORAGE_KEYS));
    const prefix = `${CONFIG.STORAGE_PREFIX}:`;
    const keys = [];
    const length = localStorage.length || 0;
    for (let i = 0; i < length; i += 1) {
        const key = typeof localStorage.key === "function" ? localStorage.key(i) : null;
        if (key && (key.startsWith(prefix) || known.has(key))) {
            keys.push(key);
        }
    }
    keys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value != null && !extensionStorageCache.has(key)) {
            extensionStorageCache.set(key, value);
            if (isChromeStorageAvailable()) {
                chrome.storage.local.set({ [key]: value });
            }
        }
        try {
            localStorage.removeItem(key);
        } catch (error) {
            // Ignore.
        }
    });
}

function hydrateExtensionStorage() {
    if (!isChromeStorageAvailable()) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => {
            Object.entries(items || {}).forEach(([key, value]) => {
                if (typeof value === "string") {
                    extensionStorageCache.set(key, value);
                }
            });
            migratePageLocalStorage();
            resolve();
        });
    });
}

function scopedStorageKey(baseKey, spreadsheetId = getSpreadsheetId()) {
    return spreadsheetId ? `${CONFIG.STORAGE_PREFIX}:${baseKey}:${spreadsheetId}` : baseKey;
}

function hasAnyScopedKey(baseKey) {
    const prefix = `${CONFIG.STORAGE_PREFIX}:${baseKey}:`;
    return listStorageKeys().some((key) => key.startsWith(prefix));
}

function readJsonArray(key) {
    try {
        const raw = storageGetItem(key);
        if (raw == null) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn("⚠️ Failed to parse storage key:", key, error);
        return null;
    }
}

function getScopedTabNames(baseKey) {
    const scopedKey = scopedStorageKey(baseKey);
    const scopedRaw = storageGetItem(scopedKey);
    if (scopedRaw != null) {
        return readJsonArray(scopedKey) || [];
    }

    if (!getSpreadsheetId() || hasAnyScopedKey(baseKey)) {
        return [];
    }

    const legacy = readJsonArray(baseKey);
    if (!legacy) return [];

    storageSetItem(scopedKey, JSON.stringify(legacy));
    storageRemoveItem(baseKey);
    return legacy;
}

function setScopedTabNames(baseKey, tabs) {
    storageSetItem(scopedStorageKey(baseKey), JSON.stringify(tabs));
    storageRemoveItem(baseKey);
}

/**
 * Get hidden tabs from storage
 * @returns {string[]} Array of hidden tab names
 */
function getHiddenTabs() {
    return getScopedTabNames(CONFIG.STORAGE_KEYS.HIDDEN_TABS);
}

/**
 * Save hidden tabs to storage
 * @param {string[]} tabs - Array of tab names to hide
 */
function setHiddenTabs(tabs) {
    setScopedTabNames(CONFIG.STORAGE_KEYS.HIDDEN_TABS, tabs);
}

/**
 * Add a tab to hidden list
 * @param {string} tabName - Tab name to hide
 */
function hideTab(tabName) {
    const hidden = getHiddenTabs();
    if (!hidden.includes(tabName)) {
        hidden.push(tabName);
        setHiddenTabs(hidden);
    }
}

/**
 * Remove a tab from hidden list
 * @param {string} tabName - Tab name to show
 */
function showTab(tabName) {
    const hidden = getHiddenTabs();
    setHiddenTabs(hidden.filter((name) => name !== tabName));
}

/**
 * Get history tabs from storage
 * @returns {string[]} Array of recent tab names
 */
function getHistoryTabs() {
    return getScopedTabNames(CONFIG.STORAGE_KEYS.HISTORY_TABS);
}

/**
 * Add a tab to history (most recent first, max 10 items)
 * @param {string} tabName - Tab name to add to history
 */
function addToHistory(tabName) {
    let history = getHistoryTabs();

    history = history.filter((name) => name !== tabName);
    history.unshift(tabName);

    if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
        history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
    }

    setScopedTabNames(CONFIG.STORAGE_KEYS.HISTORY_TABS, history);
}

/**
 * Clear history tabs
 */
function clearHistory() {
    setScopedTabNames(CONFIG.STORAGE_KEYS.HISTORY_TABS, []);
}

/**
 * Get button visibility preference
 * @returns {boolean} True if button should be visible
 */
function isButtonVisible() {
    const stored = storageGetItem(CONFIG.STORAGE_KEYS.BUTTON_VISIBLE);
    return stored !== "false";
}

/**
 * Set button visibility preference
 * @param {boolean} visible - Whether button should be visible
 */
function setButtonVisible(visible) {
    storageSetItem(CONFIG.STORAGE_KEYS.BUTTON_VISIBLE, String(visible));
}

function getFavoriteTabs() {
    return getScopedTabNames(CONFIG.STORAGE_KEYS.FAVORITE_TABS);
}

function setFavoriteTabs(tabs) {
    setScopedTabNames(CONFIG.STORAGE_KEYS.FAVORITE_TABS, tabs);
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

function getThemeMode() {
    const raw = storageGetItem(CONFIG.STORAGE_KEYS.POPUP_THEME_MODE) || "auto";
    return CONFIG.THEME_MODES.includes(raw) ? raw : "auto";
}

function setThemeMode(mode) {
    if (!CONFIG.THEME_MODES.includes(mode)) return false;
    storageSetItem(CONFIG.STORAGE_KEYS.POPUP_THEME_MODE, mode);
    return true;
}

function getPopupFontScale() {
    const raw = storageGetItem(CONFIG.STORAGE_KEYS.POPUP_FONT_SCALE) || "1";
    return CONFIG.FONT_SCALE_OPTIONS.includes(raw) ? raw : "1";
}

function setPopupFontScale(scale) {
    const value = String(scale);
    if (!CONFIG.FONT_SCALE_OPTIONS.includes(value)) return false;
    storageSetItem(CONFIG.STORAGE_KEYS.POPUP_FONT_SCALE, value);
    return true;
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        scopedStorageKey,
        readJsonArray,
        getScopedTabNames,
        setScopedTabNames,
        hasAnyScopedKey,
        storageGetItem,
        storageSetItem,
        storageRemoveItem,
        hydrateExtensionStorage,
        migratePageLocalStorage,
        getHiddenTabs,
        setHiddenTabs,
        hideTab,
        showTab,
        getHistoryTabs,
        addToHistory,
        clearHistory,
        isButtonVisible,
        setButtonVisible,
        getFavoriteTabs,
        setFavoriteTabs,
        toggleFavoriteTab,
        getThemeMode,
        setThemeMode,
        getPopupFontScale,
        setPopupFontScale
    };
}
