#!/usr/bin/env bash
# Runs the shape and chart demos, checks where their drawings' Word 2010 extensions are and that their drawing ids are
# unique, and draws each page as a PNG with LibreOffice. The Demos workflow checks them with the Open XML SDK validator.
#
# Usage: scripts/render-shape-demos.sh [output directory] [demo ...]
#
# The output directory (default build/shape-demos) gets each demo's .docx, .pdf and one PNG per page.
# Without demo names, all the shape and chart demos are run. Needs the package built (npm run build) and perl.
#
# The pages are drawn with LibreOffice (set SOFFICE if soffice isn't on the PATH) and pdftoppm from Poppler.
# When SHAPE_RENDER_IMAGE names a Docker image built from scripts/shape-demos/Dockerfile, they are drawn in
# that image instead, with the pinned LibreOffice and fonts the visual regression tests compare against:
#
#   docker build --platform linux/amd64 -t docx-shape-renderer scripts/shape-demos
#   SHAPE_RENDER_IMAGE=docx-shape-renderer scripts/render-shape-demos.sh
#   npm run run-ts -- scripts/compare-shape-renders.ts

set -euo pipefail

OUT="${1:-build/shape-demos}"
shift || true
DEMOS=("$@")
if [ ${#DEMOS[@]} -eq 0 ]; then
    DEMOS=(107-inline-shapes 108-shapes 109-shape-groups 110-shape-connectors 111-shape-styles 112-shape-diagrams 113-shape-layout 115-shape-document-styles 116-shape-swimlanes 117-shape-page-layout 118-theme 120-custom-shapes 121-charts 122-chart-options)
fi
SOFFICE="${SOFFICE:-soffice}"

mkdir -p "$OUT"
# Pages left over from an earlier run would be compared as if they were new
rm -f "$OUT"/*.png "$OUT"/*.pdf
failed=0

for demo in "${DEMOS[@]}"; do
    echo "::group::$demo"
    npm run --silent run-ts -- "./demo/$demo.ts"
    cp "My Document.docx" "$OUT/$demo.docx"

    # Where the Word 2010 drawing extensions (wp14) are: a floating drawing's relative sizes come after its graphic, and
    # a percentage offset is the choice for a position, with its offset in EMUs as the fallback
    extracted="$(mktemp -d)"
    unzip -q -o "$OUT/$demo.docx" -d "$extracted"
    misplaced="$(perl -0ne '$all = () = /<wp14:(?:sizeRel[HV]|pctPos[HV]Offset)\b/g;
        $placed = () = /<wp:position([HV]) relativeFrom="\w+"><mc:AlternateContent><mc:Choice Requires="wp14"><wp14:pctPos\1Offset>-?\d+<\/wp14:pctPos\1Offset><\/mc:Choice><mc:Fallback><wp:posOffset>-?\d+<\/wp:posOffset><\/mc:Fallback><\/mc:AlternateContent><\/wp:position\1>/g;
        while (/<\/a:graphic>((?:<wp14:sizeRel[HV]\b.*?<\/wp14:sizeRel[HV]>)+)<\/wp:anchor>/gs) { my $sizes = $1; $placed += () = $sizes =~ /<wp14:sizeRel[HV]\b/g; }
        print $all - $placed' "$extracted/word/document.xml")"
    if [ "$misplaced" != 0 ]; then
        echo "::error::$demo has $misplaced Word 2010 drawing extensions where they don't go"
        failed=1
    fi

    # Drawing ids must be unique across the document
    repeated="$(grep -ho '\(wp:docPr\|wps:cNvPr\|pic:cNvPr\|wpg:cNvPr\) id="[0-9]*"' "$extracted"/word/*.xml | sed 's/.*id=//' | sort | uniq -d)"
    if [ -n "$repeated" ]; then
        echo "::error::$demo repeats drawing ids: $repeated"
        failed=1
    fi
    rm -rf "$extracted"
    echo "::endgroup::"
done

# Draw the pages
echo "::group::Drawing the pages"
DRAW='for docx in "$@"; do
    soffice ${PROFILE:+"-env:UserInstallation=file://$PROFILE"} --headless --convert-to pdf --outdir "$(dirname "$docx")" "$docx" > /dev/null 2>&1
    pdftoppm -png -r 96 "${docx%.docx}.pdf" "${docx%.docx}"
done'
FILES=()
for demo in "${DEMOS[@]}"; do
    FILES+=("$demo.docx")
done
if [ -n "${SHAPE_RENDER_IMAGE:-}" ]; then
    # LibreOffice keeps its settings in a profile, which has to be somewhere the user running it can write
    docker run --rm --platform linux/amd64 --user "$(id -u):$(id -g)" -e PROFILE=/tmp/profile -v "$(cd "$OUT" && pwd):/work" -w /work \
        "$SHAPE_RENDER_IMAGE" sh -c "$DRAW" sh "${FILES[@]}"
else
    (cd "$OUT" && PATH="$(dirname "$(command -v "$SOFFICE")"):$PATH" sh -c "$DRAW" sh "${FILES[@]}")
fi
echo "::endgroup::"

exit $failed
