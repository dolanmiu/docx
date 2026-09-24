#!/usr/bin/env bash
# Draws the shape demos with Apple Pages, to check how Pages shows them. Pages only runs on macOS, and GitHub's macOS
# runners don't have it, so this is a check to run by hand.
#
# Usage: scripts/render-shape-demos-in-pages.sh [directory] [demo ...]
#
# The directory (default build/shape-demos) is where scripts/render-shape-demos.sh wrote the demos' .docx files, so
# run that first. Each document is opened in Pages and exported as a PDF, and each page is drawn as a PNG, in the
# directory's `pages` folder. Without demo names, every .docx in the directory is drawn.
#
# The pages are drawn with pdftoppm from Poppler, or in the Docker image the other renders use when SHAPE_RENDER_IMAGE
# names it. Pages asks for permission to be controlled the first time, and the terminal needs to be allowed to.
#
# Pages draws differently from version to version, so compare its pages with others drawn by the same Pages, such as
# a render of the master branch:
#
#   scripts/render-shape-demos.sh build/master && scripts/render-shape-demos-in-pages.sh build/master
#   (switch branch) scripts/render-shape-demos.sh && scripts/render-shape-demos-in-pages.sh
#   npm run run-ts -- scripts/compare-shape-renders.ts build/shape-demos/pages --references build/master/pages

set -euo pipefail

DIR="${1:-build/shape-demos}"
shift || true
DEMOS=("$@")
if [ ${#DEMOS[@]} -eq 0 ]; then
    for docx in "$DIR"/*.docx; do
        [ -e "$docx" ] || { echo "No .docx files in $DIR. Run scripts/render-shape-demos.sh first"; exit 1; }
        DEMOS+=("$(basename "$docx" .docx)")
    done
fi

OUT="$DIR/pages"
mkdir -p "$OUT"
rm -f "$OUT"/*.png "$OUT"/*.pdf
DIR="$(cd "$DIR" && pwd)"
OUT="$(cd "$OUT" && pwd)"

for demo in "${DEMOS[@]}"; do
    echo "$demo"
    # Pages reads the document, converting it, before it can export it. If Pages shows a dialog, such as a request to
    # read the folder, the script waits for it to be answered
    osascript - "$DIR/$demo.docx" "$OUT/$demo.pdf" << 'EOF'
on run arguments
    set source to POSIX file (item 1 of arguments)
    set target to POSIX file (item 2 of arguments)
    tell application id "com.apple.Pages"
        with timeout of 300 seconds
            set theDocument to open source
            delay 3
            export theDocument to target as PDF
            close theDocument saving no
        end timeout
    end tell
end run
EOF
done
osascript -e 'tell application id "com.apple.Pages" to quit'

DRAW='for pdf in "$@"; do pdftoppm -png -r 96 "$pdf" "${pdf%.pdf}"; done'
FILES=()
for demo in "${DEMOS[@]}"; do
    FILES+=("$demo.pdf")
done
if [ -n "${SHAPE_RENDER_IMAGE:-}" ]; then
    docker run --rm --platform linux/amd64 --user "$(id -u):$(id -g)" -v "$OUT:/work" -w /work "$SHAPE_RENDER_IMAGE" sh -c "$DRAW" sh "${FILES[@]}"
else
    (cd "$OUT" && sh -c "$DRAW" sh "${FILES[@]}")
fi
echo "Pages drew ${#DEMOS[@]} documents in $OUT"
