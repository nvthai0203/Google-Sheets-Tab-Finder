# Search Tabs - Google Sheets

Chrome extension (Manifest V3, **v3.4.5**) that helps you find, organize, and jump between Google Sheets tabs quickly — with search, filters, favorites, and a customizable UI.

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Features

### Smart Search and Navigation
- Fuzzy search with Vietnamese diacritics normalization (`đ`/`Đ` → `d`).
- Relevance scoring (exact, prefix, word, substring, subsequence).
- Keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`).
- Quick switch by click or keyboard.
- Clicking a hidden tab unhides it, then activates it.

### Tab Management
- Bulk actions: `Hide Visible`, `Show Hidden`.
- Undo bar for bulk actions (restore previous hidden state).
- Real-time stats: total, hidden, visible.

### Favorites and Filters
- Mark/unmark favorites with star button.
- Quick filters: `All`, `Visible`, `Hidden`, `Favorite`.
- Quick filter combines with search query; filter and sort reapply when the popup reopens.

### Sorting and History
- Sort by:
  - Default order (sheet order)
  - Alphabetical
  - Color
  - Recently used
- Recent history list (up to 10 items), scoped per spreadsheet.

### UI Customization
- Theme modes: `Auto`, `Light`, `Dark`.
- Font size presets: Small (90%), Default (100%), Medium (110%), Large (120%), XL (130%).
- Show/hide floating `All Tabs` button (label uses `Cmd + S` on macOS).
- Popup footer shows the installed extension version.
- Sheet scrollbars use a green thumb (`#00FF7F`).

### Shortcuts
- `Ctrl + S` / `Cmd + S`: open popup (plain chord only; Shift/Alt modifiers are ignored).
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
- Click the floating `All Tabs` button.
- Click Google Sheets’ **All Sheets** button (extension hooks it; works across several UI locales).

### Daily Workflow
1. Open popup.
2. Search tab name.
3. (Optional) apply quick filter (`All`, `Visible`, `Hidden`, `Favorite`).
4. Navigate with keyboard or click to switch.
5. Use favorites and hide/show to keep the list focused.

## Project Structure

```text
Google-Sheets-Tab-Finder/
├── src/
│   ├── content/
│   │   ├── main.js              # Entry point, floating button, shortcuts
│   │   ├── popup-ui.js          # Popup shell, theme/font, version, All Sheets hook
│   │   ├── popup-events.js      # Search, filters, settings handlers
│   │   ├── popup-content.js     # Tab list, history, sort, bulk actions
│   │   ├── popup.html
│   │   └── storage.js           # chrome.storage.local + legacy migrate
│   ├── styles/
│   │   ├── popup.css            # Popup UI, themes, font scaling, scrollbars
│   │   └── button.css           # Floating button styles
│   └── utils/
│       ├── constants.js
│       ├── helpers.js
│       └── search.js
├── icons/
├── tests/
├── manifest.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Storage Keys

The extension prefers `chrome.storage.local` and migrates leftover page `localStorage` keys once:
- `gstf:hiddenTabs:{spreadsheetId}`: hidden tab names for one spreadsheet. Unscoped `hiddenTabs` migrates to the first spreadsheet that reads it, then is removed.
- `gstf:historyTabs:{spreadsheetId}`: recent tab names for one spreadsheet, max 10.
- `gstf:favoriteTabs:{spreadsheetId}`: favorited tab names for one spreadsheet.
- `eaglexBtnVisible`: floating button visibility.
- `popupThemeMode`: `auto | light | dark`.
- `popupFontScale`: `0.9 | 1 | 1.1 | 1.2 | 1.3`.

Published spreadsheet URLs (`/spreadsheets/d/e/{id}`) use a distinct storage id so they do not collide with id `e`.

## Permissions

- Host permission: `https://docs.google.com/spreadsheets/*`
  - Required to run content scripts inside Google Sheets.
- `storage`
  - Required to keep hide/favorite/history/prefs in `chrome.storage.local` instead of page `localStorage`.

## Browser Support

- Chrome (Manifest V3)
- Edge (Chromium)
- Brave
- Other Chromium-based browsers

## License

MIT (see `LICENSE`).

## Author

Lucky
