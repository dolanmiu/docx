#!/usr/bin/env bash
#
# run-demos.sh — Smoke-test runner for all numbered demo files.
#
# This script auto-discovers every demo/N-*.ts file, runs it, and then
# validates the generated OOXML document against the WML schema.
#
# How it works:
#   1. Glob demo/[0-9]*.ts to find all numbered demos (skips index.ts etc.)
#   2. Execute each demo via tsx (npm run run-ts)
#   3. If the demo produces "My Document.docx", extract it (it's a zip) and
#      validate word/document.xml against ooxml-schemas/microsoft/wml-2010.xsd
#   4. Collect all results and print a summary at the end
#
# Exit code:
#   0 — all demos passed (or were skipped)
#   1 — one or more demos failed (execution error or XML validation error)
#
# Adding a new demo:
#   Just create a new demo/N-name.ts file. It will be picked up automatically.
#   If it has known schema issues, add its number to SKIP_VALIDATE below.
#
# Requires: xmllint (libxml2-utils), npm, tsx
#
set -uo pipefail

# ---------------------------------------------------------------------------
# Skip lists
# ---------------------------------------------------------------------------

# Demos to skip entirely (do not run).
# Add a demo number here if the demo itself is broken or not meant to be run in CI.
SKIP_RUN=(
  75  # tab-stops — commented out in original workflow - do we know why?
)

# Demos to run but skip XML validation for.
# These produce valid .docx files that Word opens fine, but fail strict
# OOXML XSD validation due to known schema gaps or intentional deviations.
# Each entry includes the specific xmllint error for future reference.
SKIP_VALIDATE=(
  17  # footnotes — "element r: This element is not expected"
  19  # export-to-base64 — outputs base64 string, not a standard .docx file
  21  # bookmarks — bookmark ID must be numeric (ST_DecimalNumber), we use string IDs
  34  # floating-tables — "attribute 'overlap' is not allowed" on tblpPr
  55  # math — "element subHide: This element is not expected" (element ordering issue)
  60  # track-revisions — "element r: This element is not expected"
  61  # text-frame — "element left: This element is not expected"
  66  # fields — bookmarkStart/End id is not a valid ST_DecimalNumber
  74  # nodejs-stream — writes to a stream, does not produce "My Document.docx"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Check if a value exists in a list of arguments.
# Usage: contains "value" "${array[@]}"
contains() {
  local val="$1"; shift
  for item in "$@"; do [[ "$item" == "$val" ]] && return 0; done
  return 1
}

# Clean up generated files on exit (including Ctrl+C) so local runs
# don't leave artifacts in the working tree.
cleanup() {
  rm -f "My Document.docx"
  rm -rf build/extracted-doc
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# XSD schema used for validation (Microsoft WML 2010 extensions over ISO 29500)
SCHEMA="ooxml-schemas/microsoft/wml-2010.xsd"

# Counters for the final summary
PASSED=0
FAILED=0
SKIPPED=0
FAILURES=()

# ---------------------------------------------------------------------------
# Main loop — discover and run every numbered demo
# ---------------------------------------------------------------------------

# Sort numerically so demo 5 runs before 40 (glob sorts lexicographically).
for demo_file in $(printf '%s\n' demo/[0-9]*.ts | sort -V); do
  filename=$(basename "$demo_file" .ts)
  num=$(echo "$filename" | grep -oE '^[0-9]+')

  # --- Skip if demo is in the skip-run list ---
  if contains "$num" "${SKIP_RUN[@]}"; then
    echo "⏭  Skipping demo $num ($filename)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # --- Run the demo ---
  echo "▶  Running demo $num ($filename)..."
  if ! npm run run-ts -- "./$demo_file" > /dev/null 2>&1; then
    echo "✗  Demo $num FAILED (execution error)"
    FAILED=$((FAILED + 1))
    FAILURES+=("$num ($filename): execution error")
    continue
  fi

  # --- Skip validation if demo is in the skip-validate list ---
  if contains "$num" "${SKIP_VALIDATE[@]}"; then
    echo "✓  Demo $num ran (validation skipped)"
    PASSED=$((PASSED + 1))
    continue
  fi

  # --- Validate the generated docx ---
  # Each demo writes to "My Document.docx". Some demos (e.g. stream demos)
  # don't produce this file, which is fine — we just skip validation.
  if [[ ! -f "My Document.docx" ]]; then
    echo "✓  Demo $num ran (no docx to validate)"
    PASSED=$((PASSED + 1))
    continue
  fi

  # Extract the docx (which is a zip) and validate the main document XML.
  # "npm run extract" unzips "My Document.docx" into build/extracted-doc/.
  rm -rf build/extracted-doc
  npm run extract > /dev/null 2>&1

  if xmllint --noout --schema "$SCHEMA" build/extracted-doc/word/document.xml 2>/dev/null; then
    echo "✓  Demo $num passed"
    PASSED=$((PASSED + 1))
  else
    echo "✗  Demo $num FAILED (validation error)"
    FAILED=$((FAILED + 1))
    FAILURES+=("$num ($filename): XML validation error")
  fi

  # Clean up so the next demo starts fresh
  rm -f "My Document.docx"
done

# ---------------------------------------------------------------------------
# Summary — print results and exit with non-zero if anything failed
# ---------------------------------------------------------------------------

echo ""
echo "═══════════════════════════════════"
echo "  Results: $PASSED passed, $FAILED failed, $SKIPPED skipped"
echo "═══════════════════════════════════"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo ""
  echo "Failures:"
  for f in "${FAILURES[@]}"; do
    echo "  • $f"
  done
  exit 1
fi
