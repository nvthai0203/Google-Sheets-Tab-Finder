# Project Structure Documentation

## Overview
This document explains the file structure and organization of the Google Sheets Tab Finder extension.

## Directory Structure

```
Google Sheets Tab Finder/
├── src/                          # Source code directory
│   ├── content/                  # Content script modules
│   │   └── storage.js            # LocalStorage management functions
│   ├── styles/                   # CSS stylesheets
│   │   ├── popup.css             # Popup modal styling
│   │   └── button.css            # Floating button styling
│   └── utils/                    # Utility modules
│       ├── constants.js          # Configuration and constants
│       ├── helpers.js            # Helper utility functions
│       └── search.js             # Search algorithm and scoring
├── icons/                        # Extension icons
│   ├── spreadsheet16.png         # 16x16 icon
│   ├── spreadsheet32.png         # 32x32 icon
│   ├── spreadsheet48.png         # 48x48 icon
│   ├── spreadsheet128.png        # 128x128 icon
│   └── eagle*.png                # Alternative icon set
├── manifest.json                 # Chrome extension manifest (V3)
├── content.js                    # Main content script
├── README.md                     # User documentation
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
├── .gitignore                    # Git ignore patterns
└── STRUCTURE.md                  # This file
```

## File Descriptions

### Core Files

#### `manifest.json`
Chrome extension configuration file that defines:
- Extension metadata (name, version, description)
- Permissions and host permissions
- Content scripts to inject
- CSS files to load
- Extension icons

#### `content.js`
Main content script that:
- Initializes the extension
- Creates the popup UI
- Handles tab switching and management
- Coordinates between different modules

### Source Modules

#### `src/utils/constants.js`
Central configuration file containing:
- Storage keys for localStorage
- Timing constants
- Z-index layers
- DOM selectors
- Keyboard shortcuts
- Search scoring values

#### `src/utils/helpers.js`
Utility functions including:
- Text normalization (Vietnamese diacritics removal)
- Debounce function
- Tab container detection
- Hidden tab counting
- Click simulation
- Tab name operations

#### `src/utils/search.js`
Search functionality:
- Match scoring algorithm
- Filter and sort operations
- Fuzzy matching logic

#### `src/content/storage.js`
LocalStorage management:
- Hidden tabs operations (get, set, hide, show)
- History management (add, get, clear)
- Button visibility preferences

### Styles

#### `src/styles/popup.css`
Popup modal styling:
- Container and layout
- Header and search input
- Tab list items
- History section
- Buttons and controls
- Animations and transitions

#### `src/styles/button.css`
Floating button styling:
- Position and appearance
- Hover effects
- Transitions

### Documentation

#### `README.md`
User-facing documentation with:
- Feature list
- Installation instructions
- Usage guide
- Keyboard shortcuts
- Technical details

#### `CHANGELOG.md`
Version history tracking:
- Release dates
- New features
- Changes and improvements
- Bug fixes

#### `LICENSE`
MIT License for the project

## Module Dependencies

```
content.js
├── requires: constants.js
├── requires: helpers.js
├── requires: search.js
├── requires: storage.js
├── uses: popup.css
└── uses: button.css
```

## Best Practices

### Code Organization
1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Modularity**: Functions are small, focused, and reusable
3. **Constants**: Magic numbers and strings are defined in `constants.js`
4. **Documentation**: Each function has JSDoc comments

### File Naming
- Use lowercase with hyphens for directories
- Use camelCase for JavaScript files
- Use descriptive names that reflect content

### CSS Organization
- Separate stylesheets for different UI components
- Organized sections with comments
- Consistent naming conventions

## Future Improvements

Potential structure enhancements:
1. Split `content.js` into smaller modules:
   - `ui.js` - UI component creation
   - `eventHandlers.js` - Event listener setup
   - `tabManager.js` - Tab operations
2. Add build process (webpack/rollup)
3. Add TypeScript for type safety
4. Add testing infrastructure
5. Add source maps for debugging

## Development Guidelines

When adding new features:
1. Determine appropriate module location
2. Update constants if needed
3. Add helper functions to `helpers.js`
4. Update styles in appropriate CSS file
5. Document changes in CHANGELOG.md
6. Update README.md if user-facing

## Loading Order

Content scripts are loaded in this order (defined in manifest.json):
1. `src/utils/constants.js` - First (defines CONFIG)
2. `src/utils/helpers.js` - Uses CONFIG
3. `src/utils/search.js` - Uses CONFIG, helpers
4. `src/content/storage.js` - Uses CONFIG
5. `content.js` - Main script (uses all above)
6. CSS files are loaded in parallel

This order ensures dependencies are available when needed.
