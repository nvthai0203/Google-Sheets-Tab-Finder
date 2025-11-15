// Utility Helper Functions

/**
 * Normalize text by converting to lowercase and removing Vietnamese diacritics
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalize(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
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

/**
 * Count actually hidden tabs (by style or aria-hidden)
 * @returns {number} Number of hidden tabs
 */
function getActualHiddenCount() {
    const tabs = document.querySelectorAll(CONFIG.SELECTORS.SHEET_TAB);
    let hidden = 0;
    tabs.forEach(tab => {
        const ariaHidden = tab.getAttribute('aria-hidden') === 'true';
        const styleHidden = window.getComputedStyle(tab).display === 'none';
        if (ariaHidden || styleHidden) hidden++;
    });
    return hidden;
}

/**
 * Simulate mouse click events on an element
 * @param {HTMLElement} element - Element to click
 */
function simulateClick(element) {
    element.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
    element.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
    element.dispatchEvent(new MouseEvent('click', {
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
    return [...document.querySelectorAll(CONFIG.SELECTORS.TAB_NAME)]
        .map(el => el.textContent.trim());
}

/**
 * Check if a tab name is duplicated
 * @param {string} tabName - Name to check
 * @returns {boolean} True if duplicate exists
 */
function isDuplicateTabName(tabName) {
    const allNames = getAllTabNames();
    return allNames.filter(name => name === tabName).length > 1;
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        normalize,
        debounce,
        getTabsContainer,
        getActualHiddenCount,
        simulateClick,
        getAllTabNames,
        isDuplicateTabName,
        getActiveTabName
    };
}
