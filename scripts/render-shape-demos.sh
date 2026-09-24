#!/usr/bin/env bash
# Runs the shape demos, checks their XML against the schemas, and draws each page as a PNG with LibreOffice.
#
# Usage: scripts/render-shape-demos.sh [output directory] [demo ...]
#
# The output directory (default build/shape-demos) gets each demo's .docx, .pdf and one PNG per page.
# Without demo names, all the shape demos are run. Needs the package built (npm run build) and xmllint.
#
# The pages are drawn with LibreOffice (set SOFFICE if soffice isn't on the PATH) and pdftoppm from Poppler.
# When SHAPE_RENDER_IMAGE names a Docker image built from scripts/shape-demos/Dockerfile, they are drawn in
# that image instead, with the pinned LibreOffice and fonts the visual regression tests compare against:
#
#   docker build --platform linux/amd64 -t docx-shape-renderer scripts/shape-demos
#   SHAPE_RENDER_IMAGE=docx-shape-renderer scripts/render-shape-demos.sh
#   npm run run-ts -- scripts/compare-shape-renders.ts
#
# The bundled Microsoft schemas don't declare the Word 2010 wps/wpg/wpc namespaces, so the document is
# checked against the ISO schemas' definitions of the same elements in the wp namespace. Needs perl.

set -euo pipefail

OUT="${1:-build/shape-demos}"
shift || true
DEMOS=("$@")
if [ ${#DEMOS[@]} -eq 0 ]; then
    DEMOS=(107-inline-shapes 108-shapes 109-shape-groups 110-shape-connectors 111-shape-styles 112-shape-diagrams 113-shape-layout)
fi
SOFFICE="${SOFFICE:-soffice}"
WP="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"

mkdir -p "$OUT"
# Pages left over from an earlier run would be compared as if they were new
rm -f "$OUT"/*.png "$OUT"/*.pdf
failed=0

for demo in "${DEMOS[@]}"; do
    echo "::group::$demo"
    npm run --silent run-ts -- "./demo/$demo.ts"
    cp "My Document.docx" "$OUT/$demo.docx"

    # Check the XML, with the Word 2010 drawing namespaces moved to the wp namespace. Content that has a fallback
    # (mc:AlternateContent) is checked twice: as read by applications that use the choice, and by those that don't
    extracted="$(mktemp -d)"
    unzip -q -o "$OUT/$demo.docx" -d "$extracted"
    for view in choice fallback; do
        if [ "$view" = choice ]; then
            keep='s#<mc:Fallback>.*?</mc:Fallback>##g; s#</?mc:(AlternateContent|Choice)[^>]*>##g'
        else
            keep='s#<mc:Choice [^>]*>.*?</mc:Choice>##g; s#</?mc:(AlternateContent|Fallback)[^>]*>##g'
        fi
        perl -pe "$keep" "$extracted/word/document.xml" |
            sed -e "s#http://schemas.microsoft.com/office/word/2010/wordprocessingShape#$WP#g" \
                -e "s#http://schemas.microsoft.com/office/word/2010/wordprocessingGroup#$WP#g" \
                -e "s#http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas#$WP#g" \
                -e "s#<w:txbxContent#<wps:txbxContent#g" \
                -e "s#</w:txbxContent>#</wps:txbxContent>#g" \
                > "$extracted/document-as-wp.xml"
        if ! xmllint --noout --schema ooxml-schemas/microsoft/wml-2010.xsd "$extracted/document-as-wp.xml" 2> "$extracted/errors.txt"; then
            cat "$extracted/errors.txt"
            echo "::error::$demo doesn't match the schema, read with the $view"
            failed=1
        fi
    done

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
