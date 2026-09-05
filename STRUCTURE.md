# Project Structure

## Directory layout

```text
Google Sheets Tab Finder/
├── src/
│   ├── content/
│   │   ├── main.js           # Entry: init, floating button, shortcuts
│   │   ├── popup-ui.js       # Popup shell, toggle, theme/font
│   │   ├── popup-events.js   # Search, filters, settings handlers
│   │   ├── popup-content.js  # Tab list, history, sort, bulk actions
│   │   ├── popup.html
│   │   └── storage.js
│   ├── styles/
│   │   ├── popup.css
│   │   └── button.css
│   └── utils/
│       ├── constants.js
│       ├── helpers.js
│       └── search.js
├── icons/
├── manifest.json
└── README.md
```

## Script load order (manifest.json)

1. `constants.js`
2. `helpers.js`
3. `search.js`
4. `storage.js`
5. `popup-ui.js` — `popupSelectedIndex`, `toggleSheetTabsPopup`
6. `popup-events.js` — `bindPopupHandlers`
7. `popup-content.js` — `populatePopupContent`
8. `main.js` — startup

## Module map

| File | Responsibility |
|------|----------------|
| `main.js` | `addPopupButton`, Ctrl+S shortcut, `window.load` init |
| `popup-ui.js` | Create/toggle popup, load HTML, theme/font, snowfall, All Sheets hook |
| `popup-events.js` | Theme, font, close, search, keyboard nav, quick filters |
| `popup-content.js` | History, sort, bulk hide/show, tab list rendering |
| `storage.js` | localStorage |
| `helpers.js` | DOM utilities |
| `search.js` | Fuzzy scoring |
