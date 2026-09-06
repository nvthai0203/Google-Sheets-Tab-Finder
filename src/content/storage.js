// LocalStorage Management Functions

function scopedStorageKey(baseKey, spreadsheetId = getSpreadsheetId()) {
    return spreadsheetId ? `${CONFIG.STORAGE_PREFIX}:${baseKey}:${spreadsheetId}` : baseKey;
}

function readJsonArray(key) {
    try {
        const raw = localStorage.getItem(key);
        if (raw == null) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn("⚠️ Failed to parse localStorage key:", key, error);
        return null;
    }
}

function getScopedTabNames(baseKey) {
    const scoped = readJsonArray(scopedStorageKey(baseKey));
    if (scoped) return scoped;
    return readJsonArray(baseKey) || [];
}

function setScopedTabNames(baseKey, tabs) {
    localStorage.setItem(scopedStorageKey(baseKey), JSON.stringify(tabs));
}

/**
 * Get hidden tabs from localStorage
 * @returns {string[]} Array of hidden tab names
 */
function getHiddenTabs() {
    return getScopedTabNames(CONFIG.STORAGE_KEYS.HIDDEN_TABS);
}

/**
 * Save hidden tabs to localStorage
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
    setHiddenTabs(hidden.filter(name => name !== tabName));
}

/**
 * Get history tabs from localStorage
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
    
    // Remove if exists and add to front
    history = history.filter(name => name !== tabName);
    history.unshift(tabName);
    
    // Limit to max items
    if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
        history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
    }
    
    setScopedTabNames(CONFIG.STORAGE_KEYS.HISTORY_TABS, history);
}

/**
 * Clear history tabs
 */
function clearHistory() {
    localStorage.removeItem(scopedStorageKey(CONFIG.STORAGE_KEYS.HISTORY_TABS));
}

/**
 * Get button visibility preference
 * @returns {boolean} True if button should be visible
 */
function isButtonVisible() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.BUTTON_VISIBLE);
    return stored !== 'false';
}

/**
 * Set button visibility preference
 * @param {boolean} visible - Whether button should be visible
 */
function setButtonVisible(visible) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.BUTTON_VISIBLE, String(visible));
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
    return localStorage.getItem(CONFIG.STORAGE_KEYS.POPUP_THEME_MODE) || 'auto';
}

function setThemeMode(mode) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.POPUP_THEME_MODE, mode);
}

function getPopupFontScale() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.POPUP_FONT_SCALE) || '1';
    return CONFIG.FONT_SCALE_OPTIONS.includes(raw) ? raw : '1';
}

function setPopupFontScale(scale) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.POPUP_FONT_SCALE, scale);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scopedStorageKey,
        readJsonArray,
        getScopedTabNames,
        setScopedTabNames,
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
