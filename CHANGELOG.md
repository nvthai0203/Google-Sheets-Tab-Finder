# Changelog

All notable changes to the Google Sheets Tab Finder extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.1] - 2026-09-09

### Changed
- **Snowflake colors**: Light theme flakes are `#99FFFF`; dark theme flakes are `#FFFFFF`

## [3.3.0] - 2026-09-06

### Fixed
- **Recent Searches persist**: Stopped clearing history on every page load
- **XSS in tab names**: Render history and tab labels with `textContent` instead of unescaped `innerHTML`
- **Per-spreadsheet storage**: Scope `hiddenTabs`, `historyTabs`, and `favoriteTabs` to the spreadsheet ID so workbooks no longer share hide/favorite/history state. Legacy unscoped keys are still read as a fallback

## [3.2.0] - 2026-09-05

### Added
- **Popup snowfall**: Decorative falling-snow overlay on the tab finder popup
  - Does not intercept clicks or keyboard input
  - Theme-aware flake color for light and dark modes
  - Honors `prefers-reduced-motion`

### Changed
- Removed leftover unused Christmas snowfall keyframes from `popup.css`

## [2.9.0] - 2026-05-08

### Added
- **Favorites**: Mark/unmark tabs with a star button and persist with `localStorage` (`favoriteTabs`)
- **Quick Filters**: Added fast filtering chips in popup:
  - `All`
  - `Visible`
  - `Hidden`
  - `Favorite`
- **Undo for Bulk Actions**: Added temporary undo bar for:
  - `Hide Visible`
  - `Show Hidden`
- **Theme Mode Selector**:
  - `Auto`
  - `Light`
  - `Dark`
  - Persisted via `popupThemeMode`
- **Font Size Selector**:
  - `Small (90%)`
  - `Default (100%)`
  - `Medium (110%)`
  - `Large (120%)`
  - `XL (130%)`
  - Persisted via `popupFontScale`

### Changed
- **UI Refresh v1/v1.1**:
  - Refactored popup UI to cleaner/compact visual style
  - Reduced inline styling and moved more presentation logic to CSS classes
  - Improved spacing and readability for long tab lists
- **Dark Mode Improvements**:
  - Introduced theme tokens for easier customization
  - Improved contrast and clarity in dark mode
  - Improved active tab highlighting in dark mode
- **Keyboard/Selection UX**:
  - Better selected-row visibility while navigating results with keyboard

### Technical
- Updated `README.md` to match current functionality and structure
- Expanded `localStorage` usage to support user personalization and productivity features
- Preserved existing tab management/search flows while layering new controls and filters

## [2.4.0] - 2025-11-15

### Changed
- **Major Refactoring**: Restructured project for better maintainability
  - Separated CSS into dedicated stylesheets (`popup.css`, `button.css`)
  - Modularized JavaScript into separate files:
    - `constants.js` - Configuration and constants
    - `helpers.js` - Utility helper functions
    - `search.js` - Search algorithm and scoring
    - `storage.js` - LocalStorage management
    - `ui.js` - UI components and popup (to be created)
    - `eventHandlers.js` - Event listeners (to be created)
    - `content.js` - Main content script
  - Improved code organization and readability

### Added
- `.gitignore` file for version control
- `CHANGELOG.md` for tracking changes
- Development tooling configuration

### Technical
- Better separation of concerns
- More maintainable codebase
- Easier testing and debugging
- Improved documentation

## [2.3.0] - Previous Version

### Added
- Enhanced search algorithm with score-based matching
- Improved Vietnamese diacritics support
- Bulk hide/show functionality
- Statistics dashboard
- Better keyboard navigation
- UI/UX improvements with modern design

### Features
- Smart tab search with fuzzy matching
- Tab management (hide/show)
- Advanced sorting (default, alphabetical, color, recent)
- Recent history tracking (last 10 tabs)
- Keyboard shortcuts (Ctrl+S to open)
- Duplicate tab detection
- Color indicators for tabs

## [1.0.0] - Initial Release

### Added
- Basic tab search functionality
- Tab switching capability
- Simple popup interface
- Google Sheets integration
