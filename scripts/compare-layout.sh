#!/usr/bin/env bash
# Runs the layout demos, which write the page numbers of their tables of contents with docx/layout, and has LibreOffice
# lay out the same documents, then compares the page docx/layout gave each heading with the page LibreOffice put it on.
# LibreOffice lays out pages differently from Word in places, so it stands in for Word to catch mistakes, rather than
# being what docx/layout matches.
#
# Usage: scripts/compare-layout.sh [output directory] [demo ...]
#
# Each demo is its topic and name, such as layout/text-and-spacing. The output directory (default build/layout) gets each
# demo's .docx, and the text of each page of LibreOffice's PDF of it, split by form feeds, in a .txt named after the demo.
# Without demos, all the layout demos are run. Needs the package built (npm run build).
#
# To compare with Word too, open each .docx in Word, choose No when it asks to update the fields, and save it as a PDF
# named after the demo with .word.pdf, such as text-and-spacing.word.pdf, in the output directory. Its text is written to
# a .word.txt the next time this runs. Word's PDFs are kept, so delete them when the demos change.
#
# Documents saved from Word, as .docx files named with .word.docx, such as text-and-spacing.word.docx, are compared with
# the pages Word wrote into them (see scripts/compare-layout.ts). Those committed in scripts/layout-probes are copied in,
# unless the output directory has one of the same name, and any in the output directory are kept.
#
# The pages are laid out with LibreOffice (set SOFFICE if soffice isn't on the PATH) and pdftotext from Poppler. When
# SHAPE_RENDER_IMAGE names a Docker image built from scripts/shape-demos/Dockerfile, they are laid out in it, with its
# pinned LibreOffice and fonts, as CI does.
set -euo pipefail

OUT="${1:-build/layout}"
shift || true
DEMOS=("$@")
if [ ${#DEMOS[@]} -eq 0 ]; then
    DEMOS=()
    for demo in demo/layout/*.ts; do
        DEMOS+=("layout/$(basename "$demo" .ts)")
    done
fi
SOFFICE="${SOFFICE:-soffice}"

mkdir -p "$OUT"
find "$OUT" -maxdepth 1 \( \( -name "*.docx" -not -name "*.word.docx" \) -o -name "*.txt" -o \( -name "*.pdf" -not -name "*.word.pdf" \) \) -delete
# Without them, Word's own pages wouldn't be compared at all, and the comparison would pass without them
SAVED=(scripts/layout-probes/*.word.docx)
if [ ! -f "${SAVED[0]}" ]; then
    echo "No documents saved from Word in scripts/layout-probes: run this from the root of the repository" >&2
    exit 1
fi
for saved in "${SAVED[@]}"; do
    if [ ! -f "$OUT/$(basename "$saved")" ]; then
        cp "$saved" "$OUT/"
    fi
done

FILES=()
for demo in "${DEMOS[@]}"; do
    npm run --silent run-ts -- "./demo/$demo.ts"
    cp "My Document.docx" "$OUT/$(basename "$demo").docx"
    FILES+=("$(basename "$demo").docx")
done

# The PDF has the blank pages LibreOffice adds before a section that starts on an odd or even page, as Word prints them.
# Its text is written in reading order, so the columns of a page come one after the other, rather than side by side
LAY_OUT='for docx in "$@"; do
    soffice ${PROFILE:+"-env:UserInstallation=file://$PROFILE"} --headless \
        --convert-to "pdf:writer_pdf_Export:{\"IsSkipEmptyPages\":{\"type\":\"boolean\",\"value\":\"false\"}}" "$docx" > /dev/null 2>&1
    pdftotext "${docx%.docx}.pdf" "${docx%.docx}.txt"
    if [ -f "${docx%.docx}.word.pdf" ]; then
        pdftotext "${docx%.docx}.word.pdf" "${docx%.docx}.word.txt"
    fi
done'
if [ -n "${SHAPE_RENDER_IMAGE:-}" ]; then
    # LibreOffice keeps its settings in a profile, which has to be somewhere the user running it can write
    docker run --rm --platform linux/amd64 --user "$(id -u):$(id -g)" -e PROFILE=/tmp/profile -v "$(cd "$OUT" && pwd):/work" -w /work \
        "$SHAPE_RENDER_IMAGE" sh -c "$LAY_OUT" sh "${FILES[@]}"
else
    (cd "$OUT" && PATH="$(dirname "$(command -v "$SOFFICE")"):$PATH" sh -c "$LAY_OUT" sh "${FILES[@]}")
fi

npm run --silent run-ts -- scripts/compare-layout.ts "$OUT"
