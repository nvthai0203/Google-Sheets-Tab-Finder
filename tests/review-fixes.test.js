const assert = require("assert");
const path = require("path");

if (typeof global.MouseEvent === "undefined") {
  global.MouseEvent = class MouseEvent {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
    }
  };
}
if (typeof global.window === "undefined") {
  global.window = global;
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    get length() {
      return map.size;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
  };
}

function resetModules() {
  [
    "../src/utils/constants.js",
    "../src/utils/helpers.js",
    "../src/utils/search.js",
    "../src/content/storage.js",
    "../src/content/popup-content.js",
    "../src/content/popup-events.js",
    "../src/content/popup-ui.js",
  ].forEach((rel) => {
    delete require.cache[path.resolve(__dirname, rel)];
  });
}

function loadCore(pathname = "/spreadsheets/d/SHEET_A/edit", localStorage = createMemoryStorage()) {
  resetModules();
  global.location = { pathname };
  global.localStorage = localStorage;
  global.CONFIG = require("../src/utils/constants.js");
  const helpers = require("../src/utils/helpers.js");
  Object.assign(global, helpers);
  const storage = require("../src/content/storage.js");
  Object.assign(global, storage);
  const search = require("../src/utils/search.js");
  Object.assign(global, search);
  const popupContent = require("../src/content/popup-content.js");
  Object.assign(global, popupContent);
  return { helpers, storage, search, popupContent, localStorage };
}

function fakeClassList() {
  const classes = new Set();
  return {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name),
    toggle: (name, force) => {
      if (force) classes.add(name);
      else classes.delete(name);
    },
  };
}

function fakeLi({ name, hidden = false, favorite = false, index = 0, color = "black" }) {
  return {
    id: "",
    dataset: {
      tabName: name,
      isHidden: hidden ? "true" : "false",
      isFavorite: favorite ? "true" : "false",
      tabIndex: String(index),
      tabColor: color,
    },
    style: { display: "" },
    classList: fakeClassList(),
    querySelector(sel) {
      if (sel === "strong") return { textContent: name };
      if (sel === "span") return { style: { color } };
      return null;
    },
  };
}

function fakeTab(name, extras = {}) {
  const nameEl = { textContent: name };
  return {
    style: { display: extras.display || "" },
    classList: fakeClassList(),
    querySelector(sel) {
      if (sel === CONFIG.SELECTORS.TAB_NAME) return nameEl;
      return null;
    },
    getAttribute(attr) {
      return extras[attr] ?? null;
    },
    dispatchEvent() {
      return true;
    },
  };
}

function testPublishSpreadsheetIds() {
  const { getSpreadsheetId } = loadCore().helpers;
  assert.strictEqual(
    getSpreadsheetId("/spreadsheets/d/e/PUBLISHED_ID/pubhtml"),
    "PUBLISHED_ID"
  );
  assert.strictEqual(
    getSpreadsheetId("/spreadsheets/u/0/d/e/PUB_B/pubhtml"),
    "PUB_B"
  );
  assert.strictEqual(getSpreadsheetId("/spreadsheets/d/e"), "");
  assert.strictEqual(getSpreadsheetId("/spreadsheets/u/0/d/sheetB/edit"), "sheetB");
}

function testNormalizeAndScoreMatch() {
  const { helpers, search } = loadCore();
  assert.strictEqual(helpers.normalize("Đông"), "dong");
  assert.strictEqual(helpers.normalize("  "), "");
  assert.strictEqual(search.scoreMatch("dong", "Đông"), CONFIG.SEARCH_SCORES.EXACT_MATCH);
  assert.strictEqual(search.scoreMatch("hoa", "Hòa Bình"), CONFIG.SEARCH_SCORES.PREFIX_MATCH);
  assert.ok(search.scoreMatch("uo", "Hướng") > 0);
  assert.strictEqual(search.scoreMatch("   ", "Sales"), 0);
  assert.ok(search.isBlankSearchQuery("   "));
  assert.ok(search.isBlankSearchQuery(""));

  const exact = search.scoreMatch("sales", "Sales");
  const prefix = search.scoreMatch("sal", "Sales");
  const sub = search.scoreMatch("ale", "Sales");
  assert.ok(exact > prefix);
  assert.ok(prefix > sub);
}

function testWhitespaceQueryKeepsAllFilterHits() {
  const { search } = loadCore();
  const items = [
    fakeLi({ name: "Sales", hidden: false, favorite: true, index: 0 }),
    fakeLi({ name: "Hidden", hidden: true, favorite: false, index: 1 }),
    fakeLi({ name: "Notes", hidden: false, favorite: false, index: 2 }),
  ];

  const allHits = search.filterAndSortTabs("   ", items, { quickFilter: "all" });
  assert.strictEqual(allHits.length, 3);
  assert.ok(items.every((li) => li.style.display === "block"));

  const favoriteHits = search.filterAndSortTabs("", items, { quickFilter: "favorite" });
  assert.strictEqual(favoriteHits.length, 1);
  assert.strictEqual(favoriteHits[0].li.dataset.tabName, "Sales");
  assert.strictEqual(items[1].style.display, "none");
}

function testEmptyQueryKeepsSelectedSort() {
  const { popupContent } = loadCore();
  const items = [
    fakeLi({ name: "Bravo", index: 1 }),
    fakeLi({ name: "Alpha", index: 0 }),
    fakeLi({ name: "Charlie", index: 2 }),
  ];
  const alphabetical = popupContent.sortTabItems(items, "alphabetical").map((li) => li.dataset.tabName);
  assert.deepStrictEqual(alphabetical, ["Alpha", "Bravo", "Charlie"]);

  const byDefault = popupContent.sortTabItems(items, "default").map((li) => li.dataset.tabName);
  assert.deepStrictEqual(byDefault, ["Alpha", "Bravo", "Charlie"]);
}

function testKeyboardFocusPrefersActiveSheetTab() {
  const { search } = loadCore();
  global.popupSelectedIndex = 0;

  const first = fakeLi({ name: "MasterSettingByOwner", index: 0 });
  const active = fakeLi({ name: "ActionLog", index: 1 });
  active.classList.add("active-tab-item");
  const third = fakeLi({ name: "Summary", index: 2 });

  const items = [first, active, third];
  const hits = search.filterAndSortTabs("", items, { quickFilter: "all" });
  const ordered = hits.map((hit) => hit.li);

  const activeIndex = ordered.findIndex((li) => li.classList.contains("active-tab-item"));
  assert.strictEqual(activeIndex, 1);

  ordered.forEach((li) => li.classList.remove("selected-tab"));
  const focusIndex = activeIndex >= 0 ? activeIndex : 0;
  ordered[focusIndex].classList.add("selected-tab");

  assert.ok(active.classList.contains("selected-tab"));
  assert.ok(!first.classList.contains("selected-tab"));
  assert.ok(active.classList.contains("active-tab-item"));
}

function testShortcutIgnoresShiftAndAlt() {
  const { helpers } = loadCore();
  assert.strictEqual(
    helpers.shouldOpenPopupShortcut({ ctrlKey: true, key: "s", shiftKey: false, altKey: false }),
    true
  );
  assert.strictEqual(
    helpers.shouldOpenPopupShortcut({ metaKey: true, key: "S", shiftKey: false, altKey: false }),
    true
  );
  assert.strictEqual(
    helpers.shouldOpenPopupShortcut({ ctrlKey: true, key: "s", shiftKey: true, altKey: false }),
    false
  );
  assert.strictEqual(
    helpers.shouldOpenPopupShortcut({ ctrlKey: true, key: "s", shiftKey: false, altKey: true }),
    false
  );
}

function testShortcutLabel() {
  const { helpers } = loadCore();
  assert.strictEqual(helpers.getOpenPopupShortcutLabel("MacIntel"), "Cmd + S");
  assert.strictEqual(helpers.getOpenPopupShortcutLabel("iPhone"), "Cmd + S");
  assert.strictEqual(helpers.getOpenPopupShortcutLabel("Win32"), "Ctrl + S");
}

function testThemeAndFontValidation() {
  const { storage, localStorage } = loadCore();
  assert.strictEqual(storage.setThemeMode("neon"), false);
  assert.strictEqual(storage.getThemeMode(), "auto");
  assert.strictEqual(storage.setThemeMode("dark"), true);
  assert.strictEqual(storage.getThemeMode(), "dark");

  assert.strictEqual(storage.setPopupFontScale("2"), false);
  assert.strictEqual(storage.getPopupFontScale(), "1");
  assert.strictEqual(storage.setPopupFontScale("1.2"), true);
  assert.strictEqual(storage.getPopupFontScale(), "1.2");
  assert.strictEqual(localStorage.getItem("popupThemeMode"), "dark");
}

function testHiddenApplyDoesNotTouchMenuAndRereadsStorage() {
  const { helpers, storage } = loadCore();
  const menu = { style: { display: "" } };
  const tabBar = { observeCalls: 0 };
  const payroll = fakeTab("Payroll");
  const sales = fakeTab("Sales");
  payroll.parentElement = tabBar;
  sales.parentElement = tabBar;

  const observers = [];
  global.MutationObserver = class {
    constructor(cb) {
      this.cb = cb;
      this.disconnected = false;
      observers.push(this);
    }
    observe() {
      tabBar.observeCalls += 1;
    }
    disconnect() {
      this.disconnected = true;
    }
  };

  global.document = {
    querySelectorAll(sel) {
      if (sel === CONFIG.SELECTORS.SHEET_TAB) return [payroll, sales];
      return [];
    },
    querySelector(sel) {
      if (sel === CONFIG.SELECTORS.SHEET_TAB) return payroll;
      if (sel === CONFIG.SELECTORS.CONTEXT_MENU) return menu;
      return null;
    },
  };

  const intervals = [];
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  global.setInterval = (fn) => {
    const id = intervals.length + 1;
    intervals.push({ id, fn, cleared: false });
    return id;
  };
  global.clearInterval = (id) => {
    const found = intervals.find((item) => item.id === id);
    if (found) found.cleared = true;
  };

  try {
    storage.setHiddenTabs(["Payroll"]);
    helpers.applyHiddenTabsFromStorage();
    assert.strictEqual(payroll.style.display, "none");
    assert.strictEqual(sales.style.display, "");
    assert.strictEqual(menu.style.display, "");
    assert.strictEqual(helpers.getHiddenTabsApplyState().timerActive, false);
    assert.strictEqual(helpers.getHiddenTabsApplyState().watching, true);
    assert.strictEqual(tabBar.observeCalls, 1);

    // Sheets recreates the tab bar → observer re-applies hide from storage.
    payroll.style.display = "";
    observers[0].cb();
    assert.strictEqual(payroll.style.display, "none");

    storage.showTab("Payroll");
    // applyHiddenTabsNow is hide-only; explicit show clears display.
    helpers.showAllExtensionHiddenSheetTabs();
    helpers.applyHiddenTabsNow();
    assert.strictEqual(payroll.style.display, "");
    assert.strictEqual(sales.style.display, "");
    assert.strictEqual(menu.style.display, "");
  } finally {
    helpers.stopApplyingHiddenTabs();
    helpers.stopWatchingSheetTabsForHiddenState();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    delete global.MutationObserver;
  }
}

function testShowAllClearsDisplayAndStatsCountStorageOnly() {
  const { helpers, storage } = loadCore();
  const alpha = fakeTab("Alpha", { display: "none" });
  const beta = fakeTab("Beta", { display: "none" });

  global.document = {
    querySelectorAll(sel) {
      if (sel === CONFIG.SELECTORS.SHEET_TAB) return [alpha, beta];
      return [];
    },
    querySelector() {
      return null;
    },
  };

  storage.setHiddenTabs(["Alpha", "Beta"]);
  helpers.applyHiddenTabsNow();
  assert.strictEqual(alpha.style.display, "none");
  assert.strictEqual(beta.style.display, "none");
  assert.strictEqual(helpers.getActualHiddenCount(), 2);

  storage.setHiddenTabs([]);
  // Hide-only apply must not wipe leftover display:none when storage is empty.
  helpers.applyHiddenTabsNow();
  assert.strictEqual(alpha.style.display, "none");
  assert.strictEqual(helpers.getActualHiddenCount(), 2);
  helpers.reconcileHiddenTabsWithDom();
  assert.deepStrictEqual(storage.getHiddenTabs().sort(), ["Alpha", "Beta"]);

  storage.setHiddenTabs([]);
  helpers.showAllExtensionHiddenSheetTabs();
  assert.strictEqual(alpha.style.display, "");
  assert.strictEqual(beta.style.display, "");
  assert.strictEqual(helpers.getActualHiddenCount(), 0);
}

function testHiddenStatsCountStorageOnlyTabs() {
  const { helpers, storage, search } = loadCore();
  const visible = fakeTab("Open");

  global.document = {
    querySelectorAll(sel) {
      if (sel === CONFIG.SELECTORS.SHEET_TAB) return [visible];
      return [];
    },
    querySelector() {
      return null;
    },
  };

  storage.setHiddenTabs(["Secret", "Archive"]);
  const stats = helpers.getHiddenTabStats();
  assert.strictEqual(stats.hiddenCount, 2);
  assert.strictEqual(stats.totalTabs, 3);
  assert.strictEqual(stats.visibleCount, 1);

  const secretLi = fakeLi({ name: "Secret", hidden: true, index: 1 });
  const openLi = fakeLi({ name: "Open", hidden: false, index: 0 });
  search.filterAndSortTabs("", [openLi, secretLi], { quickFilter: "hidden" });
  assert.strictEqual(secretLi.style.display, "block");
  assert.strictEqual(openLi.style.display, "none");
}

function testBulkShowHiddenLeavesHiddenFilterEmptyWithoutReset() {
  const { search } = loadCore();
  const hidden = fakeLi({ name: "Secret", hidden: true, index: 0 });
  const visible = fakeLi({ name: "Open", hidden: false, index: 1 });

  // Before Show Hidden: Hidden filter shows only hidden rows.
  search.filterAndSortTabs("", [hidden, visible], { quickFilter: "hidden" });
  assert.strictEqual(hidden.style.display, "block");
  assert.strictEqual(visible.style.display, "none");

  // After Show Hidden clears isHidden, staying on Hidden filter yields an empty list.
  hidden.dataset.isHidden = "false";
  search.filterAndSortTabs("", [hidden, visible], { quickFilter: "hidden" });
  assert.strictEqual(hidden.style.display, "none");
  assert.strictEqual(visible.style.display, "none");

  // Switching back to All (what Show Hidden now does) shows everything again.
  search.filterAndSortTabs("", [hidden, visible], { quickFilter: "all" });
  assert.strictEqual(hidden.style.display, "block");
  assert.strictEqual(visible.style.display, "block");
}

function testHiddenApplyStopsAfterMaxAttempts() {
  const { helpers } = loadCore();
  global.document = {
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
  };

  const intervals = [];
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  global.setInterval = (fn) => {
    const id = intervals.length + 1;
    intervals.push({ id, fn, cleared: false });
    return id;
  };
  global.clearInterval = (id) => {
    const found = intervals.find((item) => item.id === id);
    if (found) found.cleared = true;
  };

  try {
    helpers.applyHiddenTabsFromStorage();
    assert.strictEqual(intervals.length, 1);
    assert.strictEqual(helpers.getHiddenTabsApplyState().timerActive, true);

    helpers.applyHiddenTabsFromStorage();
    assert.strictEqual(intervals.length, 2);
    assert.strictEqual(intervals[0].cleared, true);

    for (let i = 0; i < CONFIG.MAX_HIDDEN_APPLY_ATTEMPTS; i += 1) {
      intervals[1].fn();
    }
    assert.strictEqual(helpers.getHiddenTabsApplyState().timerActive, false);
    assert.strictEqual(intervals[1].cleared, true);
  } finally {
    helpers.stopApplyingHiddenTabs();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }
}

function testAriaHiddenIsNotCounted() {
  const { helpers, storage } = loadCore();
  const visible = fakeTab("Visible");
  const userHidden = fakeTab("UserHidden", { display: "none" });
  const ariaOnly = fakeTab("AriaOnly", { "aria-hidden": "true" });

  global.document = {
    querySelectorAll(sel) {
      if (sel === CONFIG.SELECTORS.SHEET_TAB) return [visible, userHidden, ariaOnly];
      return [];
    },
    querySelector() {
      return null;
    },
  };

  storage.setHiddenTabs(["UserHidden"]);
  assert.strictEqual(helpers.getActualHiddenCount(), 1);
}

function testDuplicateNamesCountSheetTabsOnly() {
  const { helpers } = loadCore();
  const first = fakeTab("Shared");
  const second = fakeTab("Shared");
  first.querySelector = (sel) => {
    if (sel === CONFIG.SELECTORS.TAB_NAME) return { textContent: "Shared" };
    return { textContent: "Shared" };
  };

  global.document = {
    querySelectorAll(sel) {
      if (sel === CONFIG.SELECTORS.SHEET_TAB) return [first, second];
      if (sel === CONFIG.SELECTORS.TAB_NAME) return [{ textContent: "Shared" }, { textContent: "Shared" }, { textContent: "Shared" }];
      return [];
    },
    querySelector() {
      return null;
    },
  };

  assert.strictEqual(helpers.isDuplicateTabName("Shared"), true);
  assert.strictEqual(helpers.getAllTabNames().length, 2);
}

function testActivateUnhidesBeforeClick() {
  const { helpers, storage } = loadCore();
  storage.setHiddenTabs(["Hidden"]);
  const tab = fakeTab("Hidden", { display: "none" });
  const clicked = [];
  tab.dispatchEvent = (event) => {
    clicked.push(event.type);
    return true;
  };

  const popup = { style: { display: "block" } };
  global.hidePopup = (el) => {
    el.style.display = "none";
  };

  const ok = helpers.activateSheetTab(tab, "Hidden", popup);
  assert.strictEqual(ok, true);
  assert.strictEqual(tab.style.display, "");
  assert.deepStrictEqual(storage.getHiddenTabs(), []);
  assert.ok(clicked.includes("click"));
  assert.strictEqual(popup.style.display, "none");
}

function testAllSheetsButtonMatching() {
  const { helpers } = loadCore();
  const first = {
    classList: { contains: (name) => name === "docs-sheet-menu-button" },
    getAttribute: (name) => (name === "data-tooltip" ? "Todas las hojas" : ""),
    closest: () => null,
  };
  const japanese = {
    classList: { contains: (name) => name === "docs-sheet-menu-button" },
    getAttribute: (name) => (name === "aria-label" ? "すべてのシート" : ""),
    closest: () => null,
  };
  const other = {
    classList: { contains: (name) => name === "docs-sheet-menu-button" },
    getAttribute: () => "Add sheet",
    closest: () => null,
  };
  const barFirst = {
    classList: { contains: (name) => name === "docs-sheet-menu-button" },
    getAttribute: () => "",
    closest: () => ({
      querySelector: () => barFirst,
    }),
  };

  assert.strictEqual(helpers.isAllSheetsButton(first), true);
  assert.strictEqual(helpers.isAllSheetsButton(japanese), true);
  assert.strictEqual(helpers.isAllSheetsButton(other), false);
  assert.strictEqual(helpers.isAllSheetsButton(barFirst), true);
}

function testFloatingButtonToggleBindsWithoutExistingButton() {
  const { storage } = loadCore();
  delete require.cache[path.resolve(__dirname, "../src/content/popup-events.js")];
  const events = require("../src/content/popup-events.js");

  const listeners = {};
  const toggleBtn = {
    checked: true,
    dataset: {},
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
  };
  const popup = {
    querySelector(sel) {
      return sel === "#toggleEagleXBtn" ? toggleBtn : null;
    },
  };

  global.document = {
    getElementById() {
      return null;
    },
  };

  assert.strictEqual(events.bindFloatingButtonToggle(popup), true);
  assert.strictEqual(toggleBtn.dataset.bound, "true");
  listeners.change.call({ checked: false });
  assert.strictEqual(storage.isButtonVisible(), false);

  const laterButton = { style: { display: "block" } };
  global.document.getElementById = () => laterButton;
  listeners.change.call({ checked: true });
  assert.strictEqual(laterButton.style.display, "block");
  assert.strictEqual(storage.isButtonVisible(), true);
}

function testPopupVersionUsesManifest() {
  resetModules();
  global.chrome = {
    runtime: {
      getManifest() {
        return { version: "3.4.0" };
      },
    },
  };
  const ui = require("../src/content/popup-ui.js");
  assert.strictEqual(ui.getExtensionVersion(), "3.4.0");

  const versionEl = {
    textContent: "",
    hidden: true,
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
  const popup = {
    querySelector(sel) {
      return sel === "#popupVersion" ? versionEl : null;
    },
  };

  assert.strictEqual(ui.applyPopupVersion(popup), true);
  assert.strictEqual(versionEl.textContent, "v3.4.0");
  assert.strictEqual(versionEl.hidden, false);
  assert.strictEqual(ui.applyPopupVersion(popup, ""), false);
  delete global.chrome;
}

function testChromeStorageHydrateRemovesPageKeys() {
  resetModules();
  const pageStorage = createMemoryStorage();
  pageStorage.setItem("gstf:hiddenTabs:SHEET_A", JSON.stringify(["Secret"]));
  pageStorage.setItem("eaglexBtnVisible", "false");

  const chromeStore = {};
  global.chrome = {
    storage: {
      local: {
        get(_keys, cb) {
          cb({ ...chromeStore });
        },
        set(items) {
          Object.assign(chromeStore, items);
        },
        remove(key) {
          delete chromeStore[key];
        },
      },
    },
  };
  global.location = { pathname: "/spreadsheets/d/SHEET_A/edit" };
  global.localStorage = pageStorage;
  global.CONFIG = require("../src/utils/constants.js");
  Object.assign(global, require("../src/utils/helpers.js"));
  const storage = require("../src/content/storage.js");

  return storage.hydrateExtensionStorage().then(() => {
    assert.deepStrictEqual(storage.getHiddenTabs(), ["Secret"]);
    assert.strictEqual(pageStorage.getItem("gstf:hiddenTabs:SHEET_A"), null);
    assert.strictEqual(pageStorage.getItem("eaglexBtnVisible"), null);
    assert.strictEqual(storage.isButtonVisible(), false);
    delete global.chrome;
  });
}

testPublishSpreadsheetIds();
testNormalizeAndScoreMatch();
testWhitespaceQueryKeepsAllFilterHits();
testEmptyQueryKeepsSelectedSort();
testKeyboardFocusPrefersActiveSheetTab();
testShortcutIgnoresShiftAndAlt();
testShortcutLabel();
testThemeAndFontValidation();
testHiddenApplyDoesNotTouchMenuAndRereadsStorage();
testShowAllClearsDisplayAndStatsCountStorageOnly();
testHiddenStatsCountStorageOnlyTabs();
testBulkShowHiddenLeavesHiddenFilterEmptyWithoutReset();
testHiddenApplyStopsAfterMaxAttempts();
testAriaHiddenIsNotCounted();
testDuplicateNamesCountSheetTabsOnly();
testActivateUnhidesBeforeClick();
testAllSheetsButtonMatching();
testFloatingButtonToggleBindsWithoutExistingButton();
testPopupVersionUsesManifest();

testChromeStorageHydrateRemovesPageKeys().then(() => {
  console.log("review-fixes tests passed");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
