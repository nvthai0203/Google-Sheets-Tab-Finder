const assert = require("assert");
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.resolve(__dirname, "../src/styles/popup.css"),
  "utf8"
);

function blockAfter(marker) {
  const idx = css.indexOf(marker);
  assert.ok(idx >= 0, `missing CSS marker: ${marker}`);
  const start = css.indexOf("{", idx);
  assert.ok(start >= 0, `missing { after ${marker}`);
  const end = css.indexOf("}", start);
  assert.ok(end >= 0, `missing } after ${marker}`);
  return css.slice(start, end + 1);
}

function snowFlakeColor(block) {
  const match = block.match(/--snow-flake:\s*(#[0-9A-Fa-f]{3,8})/);
  assert.ok(match, `missing --snow-flake in block: ${block.slice(0, 80)}`);
  return match[1].toUpperCase();
}

assert.strictEqual(
  snowFlakeColor(blockAfter(":root {")),
  "#99FFFF",
  "default :root flakes should be light cyan"
);
assert.strictEqual(
  snowFlakeColor(blockAfter('#sheetTabPopup[data-theme="light"]')),
  "#99FFFF",
  "light theme flakes should be #99FFFF"
);
assert.strictEqual(
  snowFlakeColor(blockAfter('#sheetTabPopup[data-theme="dark"]')),
  "#FFFFFF",
  "dark theme flakes should be #FFFFFF"
);
assert.strictEqual(
  snowFlakeColor(blockAfter("@media (prefers-color-scheme: dark)")),
  "#FFFFFF",
  "system dark flakes should be #FFFFFF"
);

const flakeVars = [...css.matchAll(/--snow-flake:\s*([^;]+);/g)].map((m) =>
  m[1].trim().toUpperCase()
);
assert.deepStrictEqual(
  new Set(flakeVars),
  new Set(["#99FFFF", "#FFFFFF"]),
  `unexpected snowflake colors: ${flakeVars.join(", ")}`
);

console.log("snowfall color tests passed");
