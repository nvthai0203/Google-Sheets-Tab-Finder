// Constants and Configuration
const CONFIG = {
    // LocalStorage keys
    STORAGE_KEYS: {
        HIDDEN_TABS: 'hiddenTabs',
        HISTORY_TABS: 'historyTabs',
        BUTTON_VISIBLE: 'eaglexBtnVisible',
        FAVORITE_TABS: 'favoriteTabs',
        POPUP_THEME_MODE: 'popupThemeMode',
        POPUP_FONT_SCALE: 'popupFontScale'
    },

    FONT_SCALE_OPTIONS: ['0.9', '1', '1.1', '1.2', '1.3'],

    // History settings
    MAX_HISTORY_ITEMS: 10,

    // Timing
    RETRY_INTERVAL: 300,
    INIT_DELAY: 3000,
    STATS_UPDATE_DEBOUNCE: 200,

    // Z-Index layers
    Z_INDEX: {
        POPUP: 100000,
        BUTTON: 99999,
        HEADER: 1000
    },

    // Selectors
    SELECTORS: {
        SHEET_TAB: '.docs-sheet-tab',
        TAB_NAME: '.docs-sheet-tab-name',
        TAB_COLOR: '.docs-sheet-tab-color',
        ACTIVE_TAB: '.docs-sheet-active-tab',
        ALL_SHEETS_BTN: '.docs-sheet-menu-button[data-tooltip="Tất cả trang tính"], .docs-sheet-menu-button[data-tooltip="All Sheets"]',
        CONTEXT_MENU: '.goog-menu'
    },

    // Keyboard shortcuts
    SHORTCUTS: {
        OPEN_POPUP: 's',
        CLOSE_POPUP: 'Escape',
        NAVIGATE_DOWN: 'ArrowDown',
        NAVIGATE_UP: 'ArrowUp',
        SELECT: 'Enter'
    },

    // Search scoring
    SEARCH_SCORES: {
        EXACT_MATCH: 100,
        PREFIX_MATCH: 90,
        WORD_MATCH: 85,
        SUBSTRING_MATCH: 75,
        SUBSEQUENCE_MATCH: 60,
        MAX_PENALTY: 20
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
