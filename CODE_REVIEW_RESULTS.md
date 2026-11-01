# Kết quả fix và test — CODE_REVIEW.md

Ngày: 2026-11-01  
Phiên bản: `3.4.0`  
Nguồn: 17 mục trong `CODE_REVIEW.md`

Mọi mục đã được sửa theo thứ tự. Test Node đã chạy xong. Phần phải mở Google Sheets thật nằm ở cuối file.

## Lệnh đã chạy

```text
node tests/high-severity.test.js
node tests/snowfall-colors.test.js
node tests/review-fixes.test.js
```

Kết quả:

| File | Kết quả |
|------|---------|
| `tests/high-severity.test.js` | Pass |
| `tests/snowfall-colors.test.js` | Pass |
| `tests/review-fixes.test.js` | Pass |

`high-severity.test.js` in một `console.warn` khi parse JSON hỏng — đúng hành vi: không throw, trả `[]`.

## Từng mục

### 1. Interval ẩn tab / `.goog-menu` — đã fix, test pass

`applyHiddenTabsFromStorage` dùng một timer, đọc lại storage mỗi lần áp, giới hạn `MAX_HIDDEN_APPLY_ATTEMPTS` (40), không đụng `.goog-menu`, clear khi popup đóng hoặc `pagehide`.

Test: `testHiddenApplyDoesNotTouchMenuAndRereadsStorage`, `testHiddenApplyStopsAfterMaxAttempts`.

### 2. Legacy storage dùng chung — đã fix, test pass

Legacy `hiddenTabs` / `historyTabs` / `favoriteTabs` chỉ migrate một lần sang spreadsheet đầu tiên đọc, rồi bị xóa. File đã có key scoped thì file khác không nhận legacy. `clearHistory` ghi mảng rỗng scoped, không hiện lại legacy.

Test: `testLegacyKeysMigrateOnceThenLeaveOtherSheetsEmpty`, `testLeftoverLegacyIgnoredWhenAnyScopedExists`, `testClearHistoryDoesNotRestoreLegacy`.

### 3. Toggle nút nổi khi bind sớm — đã fix, test pass

`bindFloatingButtonToggle` gắn listener dù `#openSheetPopup` chưa có. Nút nổi được tạo sớm (`DOMContentLoaded` / sau hydrate), không chỉ sau 3 giây. Checkbox đồng bộ từ storage.

Test: `testFloatingButtonToggleBindsWithoutExistingButton`.

### 4. Filter/sort khi mở lại popup — đã fix, test pass

`populatePopupContent` gọi `refreshTabListView` sau khi render. Quick filter và `#sortTabs` được áp lại. `Hide Visible` chỉ lấy các dòng đang hiện (tập đã lọc).

Test: `testWhitespaceQueryKeepsAllFilterHits`, `testEmptyQueryKeepsSelectedSort`.

### 5. Search phá sort / query khoảng trắng — đã fix, test pass

Query rỗng sau `normalize` hiện tất cả (theo filter), rồi sort theo `#sortTabs`. Query có chữ thì sort theo điểm. `filterAndSortTabs` là đường search duy nhất, có quick filter.

Test: `testNormalizeAndScoreMatch`, `testWhitespaceQueryKeepsAllFilterHits`, `testEmptyQueryKeepsSelectedSort`.

### 6. Nút All Sheets — đã fix, test pass

Nhận tooltip/aria-label nhiều locale, hoặc nút menu đầu trong `.docs-sheet-button-bar`. Observer gắn lại khi Sheets tạo nút mới, tự ngắt sau 60 giây.

Test: `testAllSheetsButtonMatching`. Observer trên trang thật: xem checklist dưới.

### 7. Tab trùng tên — đã fix, test pass

Mỗi dòng list giữ `data-tab-index`. Checkbox / Hide Visible / undo dùng index. History ưu tiên tab cùng tên đang hiện. `isDuplicateTabName` đếm theo sheet tab, không đếm mọi node tên bên trong.

Test: `testDuplicateNamesCountSheetTabsOnly`.

### 8. `aria-hidden` — đã fix, test pass

Stats và màu chữ theo storage / `display` do extension set. Không gộp `aria-hidden` của Sheets.

Test: `testAriaHiddenIsNotCounted`.

### 9. URL publish — đã fix, test pass

`/spreadsheets/d/e/{id}/pubhtml` lấy `{id}`, không còn dùng `e`.

Test: `testPublishSpreadsheetIds`.

### 10. Shortcut Shift/Alt — đã fix, test pass

`shouldOpenPopupShortcut` yêu cầu Ctrl/Cmd + S, không có Shift, không có Alt.

Test: `testShortcutIgnoresShiftAndAlt`.

### 11. Chuẩn hóa `đ` — đã fix, test pass

`normalize` map `đ`/`Đ` → `d` trước khi bỏ dấu NFD.

Test: `testNormalizeAndScoreMatch` (`scoreMatch("dong", "Đông")`).

### 12. Click tab đang ẩn — đã fix, test pass

`activateSheetTab` gọi `showTab`, gỡ `display: none`, rồi mới `simulateClick`, ghi history, đóng popup.

Test: `testActivateUnhidesBeforeClick`. Click thật trên Sheets: xem checklist dưới.

### 13. `chrome.storage.local` — đã fix, test pass

Thêm permission `storage`. Đọc/ghi qua cache + `chrome.storage.local`. Khi hydrate, copy key `gstf:*` và key legacy từ `localStorage` rồi xóa khỏi trang. Test Node không có `chrome` thì vẫn dùng `localStorage`.

Test: `testChromeStorageHydrateRemovesPageKeys`.

### 14. Theme/font lúc ghi — đã fix, test pass

`setThemeMode` chỉ nhận `auto | light | dark`. `setPopupFontScale` chỉ nhận `FONT_SCALE_OPTIONS`. Đọc cũng có allowlist.

Test: `testThemeAndFontValidation`.

### 15. Nhãn Cmd trên macOS — đã fix, test pass

`getOpenPopupShortcutLabel` dùng `Mac|iPhone|iPad|iPod`.

Test: `testShortcutLabel`.

### 16. Version — đã fix

`manifest.json` = `3.4.0`. `CHANGELOG.md` có mục `[3.4.0] - 2026-11-01`.

### 17. JSDoc — đã fix

JSDoc của `getSpreadsheetId` và `normalize` nằm đúng trên từng hàm trong `src/utils/helpers.js`.

## Checklist trên Google Sheets thật

Các test Node không thay được click/DOM thật của Sheets. Sau khi Load unpacked bản `3.4.0`, kiểm tra nhanh:

1. Mở một spreadsheet, đợi tab bar hiện, xác nhận tab đã ẩn từ trước vẫn bị ẩn và menu chuột phải của Sheets vẫn mở được.
2. Bấm `Ctrl+S` (hoặc `Cmd+S` trên Mac) trong 3 giây đầu: popup mở, checkbox “Show floating button” đổi được nút nổi và nhớ sau reload.
3. Chọn filter Favorite + sort Alphabetical, đóng popup, mở lại: danh sách vẫn Favorite và thứ tự A–Z.
4. Gõ khoảng trắng trong ô tìm: vẫn thấy danh sách, không hiện “Not found”.
5. Tìm `dong` với tab tên có `Đông`.
6. Ẩn một tab rồi click dòng đó (hoặc Recent): tab hiện lại và chuyển sheet.
7. Đổi ngôn ngữ giao diện Sheets nếu có, bấm nút All Sheets: popup vẫn mở.
8. `Ctrl+Shift+S` không mở popup.

## File đã đụng

- `src/utils/constants.js`
- `src/utils/helpers.js`
- `src/utils/search.js`
- `src/content/storage.js`
- `src/content/main.js`
- `src/content/popup-ui.js`
- `src/content/popup-events.js`
- `src/content/popup-content.js`
- `manifest.json`
- `README.md`
- `CHANGELOG.md`
- `CODE_REVIEW.md`
- `tests/high-severity.test.js`
- `tests/review-fixes.test.js` (mới)
