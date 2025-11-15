# Changelog

All notable changes to the Google Sheets Tab Finder extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
