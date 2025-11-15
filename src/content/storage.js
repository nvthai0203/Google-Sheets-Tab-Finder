// LocalStorage Management Functions

/**
 * Get hidden tabs from localStorage
 * @returns {string[]} Array of hidden tab names
 */
function getHiddenTabs() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HIDDEN_TABS)) || [];
}

/**
 * Save hidden tabs to localStorage
 * @param {string[]} tabs - Array of tab names to hide
 */
function setHiddenTabs(tabs) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.HIDDEN_TABS, JSON.stringify(tabs));
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
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY_TABS)) || [];
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
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY_TABS, JSON.stringify(history));
}

/**
 * Clear history tabs
 */
function clearHistory() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY_TABS);
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getHiddenTabs,
        setHiddenTabs,
        hideTab,
        showTab,
        getHistoryTabs,
        addToHistory,
        clearHistory,
        isButtonVisible,
        setButtonVisible
    };
}
