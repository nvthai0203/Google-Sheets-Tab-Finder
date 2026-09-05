#!/usr/bin/env bash
# Idempotent setup/validation for the Google Sheets Tab Finder Chrome extension.
#
# This is a static Manifest V3 extension with no build step and no dependencies,
# so "install" simply validates that the extension is well-formed and loadable:
#   - manifest.json is valid JSON
#   - every content-script listed in the manifest exists
#   - every JavaScript source parses without syntax errors
#
# The extension itself is exercised by loading it unpacked in Chrome
# (chrome://extensions -> Load unpacked -> repository root).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Validating manifest.json"
node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  const scripts = (m.content_scripts || []).flatMap(cs => cs.js || []);
  const missing = scripts.filter(p => !fs.existsSync(p));
  if (missing.length) {
    console.error('Missing content scripts referenced by manifest.json:', missing);
    process.exit(1);
  }
  console.log('    manifest.json OK (' + scripts.length + ' content scripts referenced)');
"

echo "==> Syntax-checking extension JavaScript"
count=0
while IFS= read -r -d '' f; do
  node --check "$f"
  echo "    ok: $f"
  count=$((count + 1))
done < <(find src -name '*.js' -print0 | sort -z)
echo "    checked $count JavaScript file(s)"

echo "==> Verifying Chrome is available for manual testing"
if command -v google-chrome >/dev/null 2>&1; then
  google-chrome --version
else
  echo "    WARNING: google-chrome not found on PATH; load the extension in a local Chrome instead."
fi

echo "==> Environment validation complete"
