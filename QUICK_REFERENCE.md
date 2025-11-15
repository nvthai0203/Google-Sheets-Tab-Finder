# 🚀 Quick Reference Guide

A one-page reference for developers working on Google Sheets Tab Finder.

## 📂 File Locations (Where to Edit)

| What to Change | File to Edit | Line/Section |
|----------------|--------------|--------------|
| Search algorithm | `src/utils/search.js` | `scoreMatch()` function |
| Storage keys | `src/utils/constants.js` | `STORAGE_KEYS` object |
| Timing delays | `src/utils/constants.js` | `RETRY_INTERVAL`, etc. |
| Popup styling | `src/styles/popup.css` | Various sections |
| Button styling | `src/styles/button.css` | Entire file |
| Search scoring | `src/utils/constants.js` | `SEARCH_SCORES` object |
| DOM selectors | `src/utils/constants.js` | `SELECTORS` object |
| Keyboard shortcuts | `src/utils/constants.js` + `content.js` | Both files |
| LocalStorage operations | `src/content/storage.js` | Functions |
| Helper utilities | `src/utils/helpers.js` | Functions |
| Extension metadata | `manifest.json` | Top-level properties |
| Content script order | `manifest.json` | `content_scripts.js` array |

## 🔑 Key Functions

### Storage Operations
```javascript
getHiddenTabs()              // Get array of hidden tab names
setHiddenTabs(tabs)          // Set hidden tabs array
hideTab(tabName)             // Hide a single tab
showTab(tabName)             // Show a single tab
getHistoryTabs()             // Get history array
addToHistory(tabName)        // Add to history
clearHistory()               // Clear history
isButtonVisible()            // Check button visibility
setButtonVisible(visible)    // Set button visibility
```

### Helper Functions
```javascript
normalize(text)              // Remove diacritics, lowercase
debounce(fn, delay)          // Debounce function calls
getTabsContainer()           // Get tabs container element
getActualHiddenCount()       // Count hidden tabs
simulateClick(element)       // Trigger click events
getAllTabNames()             // Get all tab names
isDuplicateTabName(name)     // Check for duplicates
getActiveTabName()           // Get current active tab
```

### Search Functions
```javascript
scoreMatch(query, text)      // Calculate match score (0-100)
filterAndSortTabs(query, items) // Filter & sort by score
```

## 🎨 CSS Classes & IDs

### Main Elements
- `#sheetTabPopup` - Main popup container
- `#popupHeader` - Popup header section
- `#searchTabs` - Search input field
- `#closePopup` - Close button
- `#tabList` - Tab list container
- `#historySection` - History sidebar
- `#historyList` - History list
- `#tabStats` - Statistics display
- `#hideAllTabs` - Hide all button
- `#showAllTabs` - Show all button
- `#sortTabs` - Sort dropdown
- `#toggleEagleXBtn` - Button visibility toggle
- `#openSheetPopup` - Floating button

### Style Classes
- `.tab-item` - Individual tab list item
- `.selected-tab` - Currently selected tab
- `.history-item` - Individual history item
- `.switch` - Toggle switch container
- `.slider` - Toggle switch slider

## 🎯 Common Tasks

### Change Popup Size
```css
/* src/styles/popup.css */
#sheetTabPopup {
    width: min(100vw, 1050px);    /* Change width */
    height: min(95vh, 900px);      /* Change height */
}
```

### Change Keyboard Shortcut
```javascript
// content.js - find and modify
if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    // Change 's' to desired key
}
```

### Modify History Limit
```javascript
// src/utils/constants.js
MAX_HISTORY_ITEMS: 10,    // Change number
```

### Add New Storage Item
```javascript
// 1. Add key in src/utils/constants.js
STORAGE_KEYS: {
    NEW_ITEM: 'newItem'
}

// 2. Add functions in src/content/storage.js
function getNewItem() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NEW_ITEM)) || defaultValue;
}
function setNewItem(value) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.NEW_ITEM, JSON.stringify(value));
}
```

### Modify Search Scoring
```javascript
// src/utils/constants.js
SEARCH_SCORES: {
    EXACT_MATCH: 100,       // Change values
    PREFIX_MATCH: 90,
    // ... etc
}
```

## 🐛 Debugging

### Common Console Locations
```javascript
// Main popup toggle
console.log("📜 Đang mở popup...");

// Tab switching
console.log(`✅ Chuyển sang tab: ${tabText}`);

// Found tabs
console.log(`🔍 Tìm thấy ${tabs.length} tabs`);
```

### Chrome DevTools
1. **F12** - Open DevTools on Google Sheets page
2. **Console** - View logs from content.js
3. **Sources** - Set breakpoints in code
4. **Application → Local Storage** - View stored data
5. **Elements** - Inspect popup structure

### Reload Extension
1. Go to `chrome://extensions/`
2. Find "Search Tabs - Google Sheets"
3. Click reload icon
4. Refresh Google Sheets page

## 📋 Testing Checklist

Quick tests after making changes:

- [ ] Extension loads without errors
- [ ] Ctrl+S opens popup
- [ ] Search filters tabs correctly
- [ ] Tab switching works
- [ ] Hide/show tabs works
- [ ] History updates correctly
- [ ] Sorting works
- [ ] Bulk actions work
- [ ] Button toggle works
- [ ] No console errors
- [ ] Styles look correct
- [ ] Keyboard navigation works

## 🎨 Color Palette

```css
/* Primary Colors */
--gradient-primary: linear-gradient(135deg, #667eea, #764ba2);
--gradient-secondary: linear-gradient(135deg, #CCCCCC, #CCCCCC);

/* Action Colors */
--hide-button: linear-gradient(135deg, #ff6b6b, #ee5a52);
--show-button: linear-gradient(135deg, #51cf66, #40c057);
--main-button: linear-gradient(135deg, #4CAF50, #45a049);

/* UI Colors */
--border: #e2e8f0;
--text-primary: #4a5568;
--text-secondary: #718096;
--background: #ffffff;
--selected: #667eea20;
```

## 🔢 Important Constants

```javascript
RETRY_INTERVAL: 300        // Tab detection retry (ms)
INIT_DELAY: 3000          // Extension init delay (ms)
STATS_UPDATE_DEBOUNCE: 200 // Stats update delay (ms)
MAX_HISTORY_ITEMS: 10     // Max history entries
Z_INDEX.POPUP: 100000     // Popup z-index
Z_INDEX.BUTTON: 99999     // Button z-index
```

## 📝 Code Snippets

### Add Console Log
```javascript
console.log('🔍 Debug:', variable);
console.log('✅ Success:', message);
console.log('⚠️ Warning:', warning);
console.log('❌ Error:', error);
```

### Get Element Safely
```javascript
const element = document.querySelector(selector);
if (element) {
    // Use element
}
```

### Update LocalStorage
```javascript
const data = getFromStorage() || defaultValue;
data.push(newItem);
setToStorage(data);
```

### Add Event Listener
```javascript
element.addEventListener('click', (e) => {
    e.preventDefault();
    // Handle click
});
```

## 📚 Documentation Files

- **README.md** - User guide, features, installation
- **DEVELOPMENT.md** - Development workflow, testing, debugging
- **STRUCTURE.md** - Architecture, file organization
- **CHANGELOG.md** - Version history
- **FILE_TREE.md** - Complete file tree visualization
- **RESTRUCTURING_SUMMARY.md** - Restructuring details
- **Quick_Reference.md** - This file

## 🔗 Useful Links

- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## ⌨️ Keyboard Shortcuts (In Extension)

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` / `Cmd + S` | Open popup |
| `↑` Arrow Up | Navigate up in list |
| `↓` Arrow Down | Navigate down in list |
| `Enter` | Switch to selected tab |
| `Esc` | Close popup |

## 🎯 Git Commands

```bash
# Initialize repo (if not done)
git init

# Check status
git status

# Add files
git add .

# Commit
git commit -m "Description"

# Create branch
git checkout -b feature/name

# Switch branch
git checkout main

# Push
git push origin branch-name
```

## ✅ Version Bump Checklist

When releasing new version:

1. [ ] Update version in `manifest.json`
2. [ ] Update `CHANGELOG.md` with changes
3. [ ] Test all features thoroughly
4. [ ] Remove debug console.logs
5. [ ] Create git tag: `git tag v2.x.x`
6. [ ] Build extension package
7. [ ] Update Chrome Web Store listing

---

**Keep this file handy while developing!** 📌

*Last updated: November 15, 2025*
