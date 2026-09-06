const assert = require("assert");
const path = require("path");

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
      map.delete(String(key));
    },
  };
}

function loadStorageForSheet(pathname, localStorage) {
  const helpersPath = path.resolve(__dirname, "../src/utils/helpers.js");
  const storagePath = path.resolve(__dirname, "../src/content/storage.js");
  const constantsPath = path.resolve(__dirname, "../src/utils/constants.js");

  delete require.cache[helpersPath];
  delete require.cache[storagePath];
  delete require.cache[constantsPath];

  global.location = { pathname };
  global.localStorage = localStorage;
  global.CONFIG = require("../src/utils/constants.js");
  Object.assign(global, require("../src/utils/helpers.js"));
  return require("../src/content/storage.js");
}

function testSpreadsheetIdParsing() {
  const { getSpreadsheetId } = require("../src/utils/helpers.js");
  assert.strictEqual(
    getSpreadsheetId("/spreadsheets/d/abc-123_ID/edit"),
    "abc-123_ID"
  );
  assert.strictEqual(
    getSpreadsheetId("/spreadsheets/u/0/d/sheetB/edit"),
    "sheetB"
  );
  assert.strictEqual(getSpreadsheetId("/drive/folders/xyz"), "");
}

function testStorageIsScopedPerSpreadsheet() {
  const shared = createMemoryStorage();
  const sheetA = loadStorageForSheet("/spreadsheets/d/SHEET_A/edit", shared);
  sheetA.setHiddenTabs(["Payroll"]);
  sheetA.addToHistory("Sales Q1");
  sheetA.setFavoriteTabs(["Inventory"]);

  const sheetB = loadStorageForSheet("/spreadsheets/d/SHEET_B/edit", shared);
  assert.deepStrictEqual(sheetB.getHiddenTabs(), []);
  assert.deepStrictEqual(sheetB.getHistoryTabs(), []);
  assert.deepStrictEqual(sheetB.getFavoriteTabs(), []);

  sheetB.setHiddenTabs(["Marketing Plan"]);
  assert.deepStrictEqual(sheetB.getHiddenTabs(), ["Marketing Plan"]);

  const sheetAAgain = loadStorageForSheet("/spreadsheets/d/SHEET_A/edit", shared);
  assert.deepStrictEqual(sheetAAgain.getHiddenTabs(), ["Payroll"]);
  assert.deepStrictEqual(sheetAAgain.getHistoryTabs(), ["Sales Q1"]);
  assert.deepStrictEqual(sheetAAgain.getFavoriteTabs(), ["Inventory"]);

  const sheetBAgain = loadStorageForSheet("/spreadsheets/d/SHEET_B/edit", shared);
  assert.deepStrictEqual(sheetBAgain.getHiddenTabs(), ["Marketing Plan"]);
}

function testLegacyKeysAreFallbackOnly() {
  const shared = createMemoryStorage();
  shared.setItem("hiddenTabs", JSON.stringify(["Legacy Hidden"]));
  shared.setItem("historyTabs", JSON.stringify(["Legacy History"]));
  shared.setItem("favoriteTabs", JSON.stringify(["Legacy Fav"]));

  const storage = loadStorageForSheet("/spreadsheets/d/SHEET_A/edit", shared);
  assert.deepStrictEqual(storage.getHiddenTabs(), ["Legacy Hidden"]);
  assert.deepStrictEqual(storage.getHistoryTabs(), ["Legacy History"]);
  assert.deepStrictEqual(storage.getFavoriteTabs(), ["Legacy Fav"]);

  storage.setHiddenTabs(["Scoped Hidden"]);
  assert.deepStrictEqual(storage.getHiddenTabs(), ["Scoped Hidden"]);
  assert.strictEqual(shared.getItem("hiddenTabs"), JSON.stringify(["Legacy Hidden"]));
}

function testCorruptJsonDoesNotThrow() {
  const shared = createMemoryStorage();
  shared.setItem("gstf:hiddenTabs:SHEET_A", "{not-json");
  const storage = loadStorageForSheet("/spreadsheets/d/SHEET_A/edit", shared);
  assert.deepStrictEqual(storage.getHiddenTabs(), []);
}

function testHistorySurvivesReloadWithoutClear() {
  const shared = createMemoryStorage();
  const firstVisit = loadStorageForSheet("/spreadsheets/d/SHEET_A/edit", shared);
  firstVisit.addToHistory("Sales Q1");

  const afterReload = loadStorageForSheet("/spreadsheets/d/SHEET_A/edit", shared);
  assert.deepStrictEqual(afterReload.getHistoryTabs(), ["Sales Q1"]);
}

testSpreadsheetIdParsing();
testStorageIsScopedPerSpreadsheet();
testLegacyKeysAreFallbackOnly();
testCorruptJsonDoesNotThrow();
testHistorySurvivesReloadWithoutClear();

console.log("high-severity tests passed");
