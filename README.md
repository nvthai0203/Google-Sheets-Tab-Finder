# Search Tabs - Google Sheets

A Chrome extension that helps you find, organize, and jump between Google Sheets tabs quickly, with search, filters, favorites, and customizable UI.

## Features

### Smart Search and Navigation
- Fuzzy search with Vietnamese diacritics normalization.
- Relevance scoring (exact, prefix, word, substring, subsequence).
- Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`).
- Quick switch to tab by click or keyboard.

### Tab Management
- Hide/show individual tabs with checkbox.
- Bulk actions: `Hide Visible`, `Show Hidden`.
- Undo bar for bulk actions (restore previous hidden state).
- Real-time stats: total, hidden, visible.

### Favorites and Filters
- Mark/unmark favorites with star button.
- Quick filters: `All`, `Visible`, `Hidden`, `Favorite`.
- Quick filter combines with search query.

### Sorting and History
- Sort by:
  - Default order (sheet order)
  - Alphabetical
  - Color
  - Recently used
- Recent history list (up to 10 items).

### UI Customization
- Theme modes: `Auto`, `Light`, `Dark`.
- Font size presets:
  - Small (90%)
  - Default (100%)
  - Medium (110%)
  - Large (120%)
  - XL (130%)
- Show/hide floating `All Tabs` button.

### Shortcuts
- `Ctrl + S` / `Cmd + S`: open popup.
- `Esc`: close popup.

## Installation

### Manual (Developer Mode)
1. Clone or download this repository.
2. Open `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project folder.

## Usage

### Open Popup
- Press `Ctrl + S` / `Cmd + S`.
- Click the floating `All Tabs (Ctrl + S)` button.
- Click the Google Sheets `All Sheets` button (extension overrides it).

### Daily Workflow
1. Open popup.
2. Search tab name.
3. (Optional) apply quick filter (`All`, `Visible`, `Hidden`, `Favorite`).
4. Navigate with keyboard or click to switch.
5. Use favorites and hide/show to keep list focused.

## Project Structure

```text
Google Sheets Tab Finder/
├── src/
│   ├── content/
│   │   ├── main.js              # Entry point, init, shortcuts
│   │   ├── popup-ui.js          # Popup shell and toggle
│   │   ├── popup-events.js      # Search and settings handlers
│   │   ├── popup-content.js     # Tab list, history, bulk actions
│   │   ├── popup.html
│   │   └── storage.js
│   ├── styles/
│   │   ├── popup.css            # Popup UI, themes, font scaling
│   │   └── button.css           # Floating button styles
│   └── utils/
│       ├── constants.js
│       ├── helpers.js
│       └── search.js
├── icons/
├── manifest.json
└── README.md
```

## Storage Keys

The extension uses `localStorage`:
- `hiddenTabs`: hidden tab names.
- `historyTabs`: recent tab names (max 10).
- `favoriteTabs`: favorited tab names.
- `eaglexBtnVisible`: floating button visibility.
- `popupThemeMode`: `auto | light | dark`.
- `popupFontScale`: `0.9 | 1 | 1.1 | 1.2 | 1.3`.

## Permissions

- Host permission: `https://docs.google.com/spreadsheets/*`
  - Required to run content scripts inside Google Sheets.

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium)
- Brave
- Other Chromium-based browsers

## License

MIT (see `LICENSE`).

## Author

Lucky
