# Development Guide

## Getting Started

### Prerequisites
- Google Chrome or Chromium-based browser
- Basic knowledge of JavaScript, HTML, and CSS
- Text editor or IDE (VS Code recommended)

### Local Development Setup

1. **Clone or Download the Repository**
   ```bash
   git clone <repository-url>
   cd "Google Sheets Tab Finder"
   ```

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the project directory

3. **Test the Extension**
   - Open any Google Sheets document
   - The extension should automatically inject
   - Press `Ctrl+S` to test the popup

### Development Workflow

1. **Make Changes**
   - Edit files in your code editor
   - Save changes

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension card
   - OR use the keyboard shortcut: `Ctrl+R` on the extensions page

3. **Test Changes**
   - Refresh the Google Sheets page
   - Test your changes

4. **Debug**
   - Right-click on the extension icon → "Inspect popup" (for popup debugging)
   - Open DevTools on the Google Sheets page (F12) → Console tab (for content script debugging)

## Code Architecture

### Module System
The extension uses vanilla JavaScript modules loaded via Chrome's content script system.

#### Loading Order (Important!)
Files are loaded in the order specified in `manifest.json`:
```javascript
1. constants.js  // Define global CONFIG
2. helpers.js    // Utility functions
3. search.js     // Search algorithms  
4. storage.js    // LocalStorage management
5. content.js    // Main entry point
```

### Key Patterns

#### 1. Configuration Management
All constants are defined in `src/utils/constants.js`:
```javascript
// Good
const interval = CONFIG.RETRY_INTERVAL;

// Bad
const interval = 300;  // Magic number
```

#### 2. Storage Operations
Use dedicated storage functions:
```javascript
// Good
const hidden = getHiddenTabs();
hideTab('Sheet1');

// Bad
const hidden = JSON.parse(localStorage.getItem('hiddenTabs'));
```

#### 3. Search Scoring
Use the scoring system from `search.js`:
```javascript
const score = scoreMatch(query, tabName);
```

#### 4. Helper Functions
Use helpers for common operations:
```javascript
const normalized = normalize('Tiếng Việt');  // Remove diacritics
const container = getTabsContainer();
simulateClick(element);
```

## File Modification Guide

### Adding a New Feature

1. **Determine Module Location**
   - UI changes → `content.js` or create `src/content/ui.js`
   - Storage operations → `src/content/storage.js`
   - Utility functions → `src/utils/helpers.js`
   - Search logic → `src/utils/search.js`
   - Configuration → `src/utils/constants.js`
   - Styles → `src/styles/popup.css` or `src/styles/button.css`

2. **Add Constants (if needed)**
   ```javascript
   // In src/utils/constants.js
   const CONFIG = {
       // ... existing config
       NEW_FEATURE: {
           TIMEOUT: 1000,
           MAX_ITEMS: 5
       }
   };
   ```

3. **Implement Functionality**
   ```javascript
   // In appropriate module
   function newFeature() {
       const timeout = CONFIG.NEW_FEATURE.TIMEOUT;
       // Implementation
   }
   ```

4. **Update Styles**
   ```css
   /* In src/styles/popup.css */
   .new-feature {
       /* Styles */
   }
   ```

5. **Update Documentation**
   - Add feature to README.md
   - Update CHANGELOG.md
   - Update this guide if needed

### Modifying Existing Features

#### Example: Change Search Algorithm
```javascript
// File: src/utils/search.js

function scoreMatch(queryRaw, textRaw) {
    // Modify scoring logic here
    // Update CONFIG.SEARCH_SCORES if needed
}
```

#### Example: Add New Storage Item
```javascript
// 1. Add key to constants.js
STORAGE_KEYS: {
    // ... existing keys
    NEW_DATA: 'newData'
}

// 2. Add functions to storage.js
function getNewData() {
    return JSON.parse(
        localStorage.getItem(CONFIG.STORAGE_KEYS.NEW_DATA)
    ) || defaultValue;
}

function setNewData(data) {
    localStorage.setItem(
        CONFIG.STORAGE_KEYS.NEW_DATA, 
        JSON.stringify(data)
    );
}
```

#### Example: Modify UI Styling
```css
/* File: src/styles/popup.css */

/* Find the appropriate section and modify */
#searchTabs {
    /* Change input styling */
    border-radius: 10px;  /* Changed from 25px */
}
```

## Testing

### Manual Testing Checklist

- [ ] Search functionality works correctly
- [ ] Tab switching is smooth
- [ ] Hide/show tabs persists across page reloads
- [ ] History updates correctly
- [ ] Keyboard shortcuts work (Ctrl+S, Arrow keys, Enter, Esc)
- [ ] Sorting options work correctly
- [ ] Bulk actions work (Hide All, Show All)
- [ ] Floating button toggle works
- [ ] UI is responsive and looks good
- [ ] No console errors

### Testing on Different Scenarios

1. **Large Spreadsheets** (100+ tabs)
   - Test search performance
   - Test scrolling behavior

2. **Vietnamese Tab Names**
   - Test diacritics normalization
   - Test search matching

3. **Duplicate Tab Names**
   - Verify duplicate detection
   - Check visual indicator

4. **Edge Cases**
   - Empty search query
   - No tabs found
   - Active tab operations

## Common Development Tasks

### Change Icon Colors
Replace icon files in `icons/` directory with new designs. Sizes needed:
- 16x16px
- 32x32px  
- 48x48px
- 128x128px

### Adjust Popup Size
```css
/* In src/styles/popup.css */
#sheetTabPopup {
    width: min(100vw, 1050px);   /* Change max width */
    height: min(95vh, 900px);     /* Change max height */
}
```

### Change Keyboard Shortcut
```javascript
// In content.js
document.addEventListener('keydown', function(event) {
    // Change 's' to another key
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleSheetTabsPopup();
    }
});

// Also update constants.js
SHORTCUTS: {
    OPEN_POPUP: 'f',  // Changed from 's'
}
```

### Modify History Limit
```javascript
// In src/utils/constants.js
MAX_HISTORY_ITEMS: 20,  // Changed from 10
```

## Debugging Tips

### Console Logging
Add strategic console logs:
```javascript
console.log('🔍 Search query:', query);
console.log('✅ Tab switched to:', tabName);
console.log('⚠️ Warning:', message);
console.log('❌ Error:', error);
```

### Chrome DevTools
- **Elements**: Inspect popup structure, modify CSS live
- **Console**: View logs, test functions
- **Sources**: Set breakpoints, step through code
- **Network**: Check for any network issues
- **Application → Local Storage**: View stored data

### Common Issues

**Issue**: Extension doesn't load
- Check manifest.json syntax
- Verify file paths are correct
- Check console for errors

**Issue**: Changes don't appear
- Reload extension at chrome://extensions
- Hard refresh Google Sheets (Ctrl+Shift+R)
- Clear browser cache

**Issue**: LocalStorage not persisting
- Check if cookies/storage are enabled
- Verify key names match CONFIG.STORAGE_KEYS
- Check for JSON parsing errors

## Code Style Guidelines

### JavaScript
```javascript
// Use const for constants
const MAX_ITEMS = 10;

// Use camelCase for variables and functions
const tabName = 'Sheet1';
function getTabs() { }

// Use descriptive names
// Good
const hiddenTabCount = getActualHiddenCount();

// Bad  
const x = getActualHiddenCount();

// Add JSDoc comments
/**
 * Calculate match score
 * @param {string} query - Search query
 * @param {string} text - Text to match
 * @returns {number} Score from 0-100
 */
function scoreMatch(query, text) { }
```

### CSS
```css
/* Use kebab-case for class names */
.tab-item { }
.selected-tab { }

/* Group related styles */
/* === Button Styles === */
#hideAllTabs { }
#showAllTabs { }

/* Use comments for sections */
/* Popup Container Styles */

/* Prefer specificity over !important */
```

## Building for Distribution

### Preparation
1. Update version in `manifest.json`
2. Update `CHANGELOG.md`
3. Test thoroughly
4. Remove any console.logs
5. Verify all features work

### Creating Extension Package
1. Remove development files (if any node_modules, etc.)
2. Ensure .gitignore is not included
3. Zip the entire directory:
   ```bash
   # Exclude unnecessary files
   zip -r extension.zip . -x "*.git*" "*.DS_Store" "node_modules/*"
   ```

### Submitting to Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click "New Item"
3. Upload the zip file
4. Fill in store listing details
5. Submit for review

## Version Control

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature description"

# Push to remote
git push origin feature/new-feature

# Create pull request
# After review and merge, delete branch
git checkout main
git pull
git branch -d feature/new-feature
```

### Commit Message Format
```
feat: Add new sorting option
fix: Resolve tab switching bug
docs: Update README with new feature
style: Improve popup button styling
refactor: Reorganize storage functions
```

## Performance Optimization

### Tips
1. Use debouncing for frequent operations
2. Minimize DOM queries (cache selectors)
3. Use event delegation when possible
4. Avoid inline styles (use classes)
5. Lazy load heavy operations

## Security Considerations

1. **Content Security**: Only run on Google Sheets domains
2. **Data Privacy**: All data stored locally, no external calls
3. **Input Sanitization**: Be careful with user input in DOM
4. **Permissions**: Request only necessary permissions

## Resources

### Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Git](https://git-scm.com/)

## Getting Help

If you encounter issues:
1. Check the console for errors
2. Review this guide
3. Check Chrome Extension documentation
4. Search for similar issues online
5. Create an issue on GitHub (if applicable)

## Contributing

When contributing:
1. Follow the code style guidelines
2. Test your changes thoroughly
3. Update documentation
4. Write clear commit messages
5. Create detailed pull requests

---

**Happy Coding! 🚀**
