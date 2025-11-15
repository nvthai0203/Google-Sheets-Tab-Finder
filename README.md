# Search Tabs - Google Sheets

A powerful Chrome extension that helps you quickly find, manage, and navigate tabs in Google Sheets with advanced search and filtering capabilities.

## 🌟 Features

### 🔍 Smart Tab Search
- **Fast Search**: Quickly find tabs using intelligent fuzzy search with Vietnamese diacritics support
- **Keyboard Navigation**: Navigate search results using arrow keys (↑/↓) and Enter
- **Score-based Matching**: Results ranked by relevance (exact match, prefix match, substring match)

### 📊 Tab Management
- **Hide/Show Tabs**: Toggle tab visibility with checkboxes
- **Bulk Actions**: Hide all visible tabs or show all hidden tabs with one click
- **Persistent State**: Hidden tabs remain hidden across sessions

### 🎨 Advanced Sorting
Sort tabs by:
- Default order (original sheet order)
- Alphabetical (A-Z)
- Color grouping
- Recently used

### 📝 Recent History
- Track last 10 accessed tabs
- Quick access to recently viewed sheets
- Auto-updated on every tab switch

### ⌨️ Keyboard Shortcuts
- **Ctrl + S** (or **Cmd + S** on Mac): Open tab finder popup
- **Arrow Keys**: Navigate through search results
- **Enter**: Switch to selected tab
- **ESC**: Close popup

### 📈 Statistics Dashboard
Real-time statistics showing:
- Total tabs count
- Hidden tabs count
- Visible tabs count

### 🎯 Additional Features
- **Duplicate Detection**: Warns when multiple tabs have the same name
- **Color Indicators**: Visual color coding for tabs
- **Toggle Button**: Show/hide the floating "All Tabs" button
- **Active Tab Highlighting**: Current tab clearly marked in the list

## 🚀 Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension folder

## 📖 Usage

### Opening the Tab Finder
- **Method 1**: Press **Ctrl + S** (Cmd + S on Mac)
- **Method 2**: Click the "All Tabs (Ctrl + S)" button in the bottom-right corner
- **Method 3**: Click the "All Sheets" button in Google Sheets (overridden by extension)

### Searching for Tabs
1. Open the tab finder popup
2. Type in the search box
3. Results are automatically filtered and sorted by relevance
4. Use arrow keys to navigate or click on a tab to switch to it

### Hiding/Showing Tabs
- **Individual**: Check/uncheck the checkbox next to any tab name
- **Bulk Hide**: Click "🙈 Hide All Visible" to hide all currently visible tabs (except active tab)
- **Bulk Show**: Click "👁️ Show All Hidden" to reveal all hidden tabs

### Sorting Tabs
1. Use the dropdown menu at the bottom of the popup
2. Select sorting method:
   - 📋 Default Order
   - 🔤 Alphabetical
   - 🎨 By Color
   - ⏰ Recently Used

## 🛠️ Technical Details

### Architecture
The extension is built with a modular architecture for better maintainability:
- **Separated CSS**: Styles are organized in dedicated stylesheets
- **Modular JavaScript**: Code is split into logical modules (storage, search, helpers, constants)
- **Clean Structure**: Clear separation of concerns for easier debugging and testing

### Permissions Required
- **Host Permission**: `https://docs.google.com/spreadsheets/*`
  - Required to inject the content script into Google Sheets

### Project Structure
```
Google Sheets Tab Finder/
├── src/
│   ├── content/
│   │   ├── storage.js           # LocalStorage management
│   │   └── (future modular files)
│   ├── styles/
│   │   ├── popup.css            # Popup modal styles
│   │   └── button.css           # Floating button styles
│   ├── utils/
│   │   ├── constants.js         # Configuration & constants
│   │   ├── helpers.js           # Utility helper functions
│   │   └── search.js            # Search algorithms
├── icons/                        # Extension icons (16, 32, 48, 128px)
├── manifest.json                 # Extension configuration (Manifest V3)
├── content.js                    # Main content script
├── README.md                     # Documentation
├── CHANGELOG.md                  # Version history
├── LICENSE                       # MIT License
└── .gitignore                    # Git ignore rules
```

### Storage
The extension uses `localStorage` to persist:
- **hiddenTabs**: Array of hidden tab names
- **historyTabs**: Array of recently accessed tab names (max 10)
- **eaglexBtnVisible**: Boolean for button visibility preference

## 🎨 UI/UX Features

- **Modern Gradient Design**: Beautiful glassmorphism effects
- **Smooth Animations**: Polished transitions and hover effects
- **Responsive Layout**: Adapts to different screen sizes
- **Custom Scrollbar**: Styled scrollbar matching the theme
- **Visual Feedback**: Clear indication of selected, active, and duplicate tabs

## 🔧 Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Brave
- Other Chromium-based browsers

## 🐛 Known Issues

- None currently reported

## 📝 Version History

### Version 2.4 (Current)
- Enhanced search algorithm with score-based matching
- Improved Vietnamese diacritics support
- Added bulk hide/show functionality
- Added statistics dashboard
- Better keyboard navigation
- UI/UX improvements with modern design

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is available for personal and commercial use.

## 👨‍💻 Author

Lucky

## 📧 Support

For bug reports or feature requests, please open an issue on the GitHub repository.

## 🙏 Acknowledgments

- Icons designed for Google Sheets integration
- Built with vanilla JavaScript for optimal performance
- Inspired by the need for better tab management in large spreadsheets

---

**Made with ❤️ for Google Sheets power users**
