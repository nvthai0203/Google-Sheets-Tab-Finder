# Code review backlog

Ghi lại các finding từ review codebase ngày 2026-10-12. Dùng file này làm danh sách sửa từng case. Đánh dấu `[x]` khi đã xử lý.

Phạm vi: `src/content`, `src/utils`, `manifest.json`, và test hiện có. Không gồm thay đổi code trong lần review.

## Cao

### 1. `applyHiddenTabsFromStorage` rò interval, ẩn lại tab, và đụng menu của Sheets

- [ ] Chưa xử lý

`src/utils/helpers.js` — `applyHiddenTabsFromStorage`. Được gọi từ `src/content/main.js` lúc khởi động và từ `renderTabList` trong `src/content/popup-content.js` mỗi lần mở popup.

Hàm chụp danh sách tab ẩn tại thời điểm gọi, rồi `setInterval` mỗi `CONFIG.RETRY_INTERVAL` (300ms) cho đến khi thấy `.docs-sheet-tab`. Không có số lần thử tối đa. Khi áp dụng, nó còn gán `display: none` cho `.goog-menu` đầu tiên (`CONFIG.SELECTORS.CONTEXT_MENU`).

Hệ quả:

- Selector của Sheets đổi thì interval chạy mãi.
- User bỏ ẩn một tab trong khoảng 300ms sau khi mở popup thì interval vẫn áp snapshot cũ và ẩn lại.
- `.goog-menu` là menu của Sheets (chuột phải, filter, autocomplete). Ẩn node đầu tiên có thể đóng hoặc làm hỏng menu đó.

Hướng xử lý:

- Bỏ side effect với `.goog-menu`, hoặc chỉ đóng menu đúng lúc click nút All Sheets.
- Đọc lại storage ngay trong lần áp dụng, không giữ snapshot cũ.
- Giới hạn số lần thử và clear interval khi popup đóng hoặc trang unload.
- Không xếp chồng nhiều interval cho cùng một lần áp dụng.

### 2. Fallback legacy làm các spreadsheet chưa ghi key riêng dùng chung một danh sách

- [ ] Chưa xử lý

`src/content/storage.js` — `getScopedTabNames`.

Key scoped chỉ được dùng khi đã tồn tại. Nếu chưa có, hàm đọc `hiddenTabs`, `historyTabs`, `favoriteTabs` global. JSON scoped hỏng cũng rơi về legacy vì `readJsonArray` trả `null`. `clearHistory()` chỉ `removeItem` key scoped, lần đọc sau hiện lại history legacy.

Hệ quả: tab tên `Salary` nằm trong legacy sẽ bị ẩn trên mọi file còn tab trùng tên, cho đến lần ghi scoped đầu tiên của file đó. Điều này trái với mục tiêu cô lập theo spreadsheet ở bản 3.3.

Hướng xử lý:

- Fallback legacy chỉ dùng cho đúng một spreadsheet (migrate một lần rồi xóa hoặc ngừng đọc key cũ).
- Không để file chưa từng ghi storage kế thừa danh sách global.
- `clearHistory` phải xóa cả key scoped lẫn legacy, hoặc ngừng đọc legacy sau khi đã migrate.
- Thêm test: file B không được thấy hidden/history/favorite của legacy sau khi file A đã có key scoped, và file mới không tự ẩn tab theo legacy.

### 3. Mở popup trong 3 giây đầu thì toggle nút nổi không bao giờ được gắn

- [ ] Chưa xử lý

`src/content/main.js` tạo `#openSheetPopup` sau `CONFIG.INIT_DELAY` (3000ms). `Ctrl+S` hoạt động ngay. `bindPopupHandlers` trong `src/content/popup-ui.js` chỉ chạy một lần sau khi fetch HTML. `bindPopupSettings` trong `src/content/popup-events.js` cần cả `#toggleEagleXBtn` và `#openSheetPopup`. Nếu nút nổi chưa có, nhánh bind bị bỏ và không set `dataset.bound`. Những lần mở sau không gọi lại `bindPopupHandlers`.

Hệ quả: checkbox “Show floating button” vẫn bấm được nhưng không đổi `display` và không ghi `eaglexBtnVisible`.

Hướng xử lý:

- Gắn listener khi cả hai node đã có, kể cả lần mở popup sau.
- Hoặc tạo nút nổi trước khi bind, và đồng bộ trạng thái checkbox từ storage mỗi lần mở popup.

## Trung bình

### 4. Mở lại popup không áp lại quick filter và sort đang chọn

- [ ] Chưa xử lý

`populatePopupContent` trong `src/content/popup-content.js` xóa ô tìm kiếm, render lại full danh sách, không dispatch `input`, và không chạy lại `#sortTabs`.

Nút filter vẫn giữ class `active` và `popup.dataset.quickFilter`, nhưng mọi dòng hiện ra. `Hide Visible` lúc đó ẩn mọi dòng đang hiện, không chỉ tập filter đang highlight (ví dụ Favorite).

Hướng xử lý:

- Sau khi render, áp lại `dataset.quickFilter` và giá trị sort hiện tại.
- `Hide Visible` chỉ lấy các dòng thuộc filter đang active.

### 5. Tìm kiếm phá thứ tự sort, và query chỉ có khoảng trắng ẩn hết danh sách

- [ ] Chưa xử lý

`bindSearchHandlers` trong `src/content/popup-events.js` sắp xếp bằng `appendChild` theo điểm, không đọc `#sortTabs`. Xóa query thì mọi điểm bằng 0 nên thứ tự sort cũ không được dựng lại.

`scoreMatch` trong `src/utils/search.js` coi chuỗi rỗng sau `normalize().trim()` là không khớp (`return 0`). Điều kiện hiện dòng lại dùng query gốc: `s > 0 || q === ""`. Gõ khoảng trắng thì `q !== ""` nhưng điểm bằng 0, nên mọi dòng bị ẩn và hiện “Not found”.

`filterAndSortTabs` trong `src/utils/search.js` không được popup dùng. Logic thật nằm ở `popup-events.js` và có quick filter. Hai đường đã lệch nhau.

Hướng xử lý:

- Coi query rỗng sau normalize là “hiện tất cả”, rồi áp sort đang chọn.
- Khi query không rỗng, sort theo điểm; khi query rỗng, trả về đúng mode của `#sortTabs`.
- Một đường search duy nhất, có quick filter, và có test cho khoảng trắng, chuỗi rỗng, và thứ tự điểm.

### 6. Nút All Sheets chỉ gắn một lần và chỉ hai ngôn ngữ

- [ ] Chưa xử lý

`attachPopupTriggerToAllSheetsButton` trong `src/content/popup-ui.js`. Selector ở `CONFIG.SELECTORS.ALL_SHEETS_BTN`: `data-tooltip` đúng bằng `All Sheets` hoặc `Tất cả trang tính`.

Observer trên `document.body` (`subtree: true`) ngắt ngay sau lần gắn đầu. Nếu Sheets tạo lại nút, hook mất. Nếu không bao giờ thấy nút, observer không bao giờ ngắt.

Hướng xử lý:

- Nhận nút All Sheets theo cấu trúc DOM ổn định hơn tooltip đã localize, hoặc theo nhiều locale.
- Giữ observer sống và gắn lại khi node bị thay.
- Ngắt observer khi không còn cần, có giới hạn thời gian quan sát.

### 7. Ẩn, hiện, và history nhận tab theo tên rồi lấy node đầu tiên

- [ ] Chưa xử lý

Click một dòng list trong `renderTabList` dùng đúng node lúc render. Checkbox, Hide Visible, history, và undo trong `src/content/popup-content.js` lại `find` theo `textContent`.

Hai node cùng tên thì chỉ tab đầu đổi `display`. Các dòng còn lại lệch checkbox. `isDuplicateTabName` trong `src/utils/helpers.js` đếm mọi `.docs-sheet-tab-name`, nên một tab có hai node tên sẽ bị gắn cờ trùng.

Hướng xử lý:

- Giữ tham chiếu tới đúng `.docs-sheet-tab` trên từng dòng (index hoặc id ổn định), không tìm lại bằng tên.
- Đếm trùng tên theo từng sheet tab, không theo mọi node tên bên trong một tab.

### 8. `aria-hidden` bị tính là tab do user ẩn

- [ ] Chưa xử lý

`renderTabList` trong `src/content/popup-content.js` và `getActualHiddenCount` trong `src/utils/helpers.js` coi `aria-hidden="true"` là ẩn. Checkbox lại theo storage.

Tab mà Sheets tự đánh `aria-hidden` làm số Hidden/Visible và màu chữ lệch so với checkbox.

Hướng xử lý:

- Trạng thái ẩn của extension chỉ dựa trên storage và `display` do extension set.
- Stats đếm đúng tập đó, không gộp `aria-hidden` của Sheets.

### 9. Link publish dùng chung một spreadsheet id

- [ ] Chưa xử lý

`getSpreadsheetId` trong `src/utils/helpers.js`. Regex lấy segment ngay sau `/d/`. URL dạng `/spreadsheets/d/e/.../pubhtml` cho id `e`, nên mọi file publish dùng chung `gstf:*:e`.

Hướng xử lý:

- Bỏ qua segment `e` của URL publish và lấy id thật phía sau, hoặc từ chối ghi storage chung khi không tách được id.
- Thêm test cho URL `/spreadsheets/d/e/{id}/pubhtml` và `/spreadsheets/u/0/d/{id}`.

### 10. Shortcut nuốt cả tổ hợp có Shift hoặc Alt

- [ ] Chưa xử lý

`src/content/main.js`, listener `keydown`. Điều kiện chỉ kiểm tra Ctrl/Cmd và phím `s`. `Ctrl+Shift+S` và `Ctrl+Alt+S` cũng `preventDefault` và mở popup.

Hướng xử lý:

- Chỉ nhận tổ hợp khi không có `shiftKey` và không có `altKey`.
- Thêm test hoặc ghi chú hành vi nếu có chỗ giả lập keyboard.

### 11. Chuẩn hóa tiếng Việt bỏ sót `đ`

- [ ] Chưa xử lý

`normalize` trong `src/utils/helpers.js` chỉ bỏ dấu tổ hợp NFD. `đ` / `Đ` không tách thành `d`, nên tìm `dong` không ra `đông`. README đang mô tả là có chuẩn hóa dấu tiếng Việt.

Hướng xử lý:

- Map `đ`/`Đ` về `d` trong `normalize`.
- Test `scoreMatch("dong", "Đông")` và vài case dấu khác (`ă`, `ơ`, `ư`).

### 12. Click tab đang ẩn không hiện lại tab trước khi kích hoạt

- [ ] Chưa xử lý

Dòng list và history trong `src/content/popup-content.js` gọi `simulateClick` khi sheet tab vẫn `display: none`, rồi vẫn ghi history và đóng popup. Nếu Sheets bỏ qua click không trusted hoặc element đang ẩn, popup đóng nhưng không chuyển tab.

Hướng xử lý:

- Hiện lại tab (`display` và storage) trước khi click.
- Chỉ ghi history và đóng popup khi kích hoạt thành công, hoặc khi element còn tương tác được.

## Thấp

### 13. Tên tab nằm trong `localStorage` của trang

- [ ] Chưa xử lý

`src/content/storage.js` ghi trên `localStorage` của `docs.google.com`. Script cùng origin đọc được tên tab đã ẩn, favorite, và history.

Hướng xử lý: chuyển sang `chrome.storage.local` nếu cần tách dữ liệu khỏi trang. Giữ migrate từ `localStorage` sang storage của extension.

### 14. Theme và font scale không được kiểm tra lúc ghi

- [ ] Chưa xử lý

`setThemeMode` và `setPopupFontScale` trong `src/content/storage.js` ghi thẳng giá trị. Font chỉ được allowlist lúc đọc (`getPopupFontScale`). Theme không có allowlist.

Hướng xử lý: chỉ ghi `auto | light | dark` và các giá trị trong `CONFIG.FONT_SCALE_OPTIONS`.

### 15. Nút nổi luôn ghi `Ctrl + S`

- [ ] Chưa xử lý

`addPopupButton` trong `src/content/main.js` đặt text `All Tabs (Ctrl + S)` cả trên macOS, nơi shortcut là Cmd.

Hướng xử lý: chọn nhãn theo `navigator.platform` hoặc theo phím modifier thực tế.

### 16. Version manifest lệch changelog

- [ ] Chưa xử lý

`manifest.json` ghi `3.3`. `CHANGELOG.md` mới nhất là `3.3.2`.

Hướng xử lý: đồng bộ version khi phát hành bản sửa các mục trên.

### 17. JSDoc đặt sai chỗ

- [ ] Chưa xử lý

`src/utils/helpers.js`: block mô tả `normalize` nằm ngay trên `getSpreadsheetId`.

Hướng xử lý: chuyển JSDoc xuống đúng hàm.

## Test còn thiếu

`tests/high-severity.test.js` phủ parsing id cơ bản, scope sau khi đã ghi, và JSON hỏng. `tests/snowfall-colors.test.js` chỉ khóa màu tuyết trong CSS. Chưa có test cho:

- [ ] Fallback legacy không làm file khác bị ẩn theo
- [ ] `scoreMatch`: chuỗi rỗng, khoảng trắng, `đ`, thứ tự điểm
- [ ] Quick filter và sort khi mở lại popup
- [ ] `applyHiddenTabsFromStorage`: dừng interval, không ẩn lại tab vừa bỏ ẩn, không đụng `.goog-menu`
- [ ] Toggle nút nổi khi `#openSheetPopup` chưa tồn tại lúc bind
- [ ] Shortcut không bắt `Ctrl+Shift+S` / `Ctrl+Alt+S`

## Đã ổn, không cần sửa trong backlog này

- Tên tab render bằng `textContent`, không nhét vào `innerHTML`
- Lớp tuyết có `pointer-events: none` và tôn trọng `prefers-reduced-motion`
- Font scale có allowlist lúc đọc
