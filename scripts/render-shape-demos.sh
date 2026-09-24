#!/usr/bin/env bash
# Runs the shape demos, checks their XML against the schemas, and draws each page as a PNG with LibreOffice.
#
# Usage: scripts/render-shape-demos.sh [output directory] [demo ...]
#
# The output directory (default build/shape-demos) gets each demo's .docx, .pdf and one PNG per page.
# Without demo names, all the shape demos are run. Needs the package built (npm run build), xmllint,
# LibreOffice (set SOFFICE if soffice isn't on the PATH) and pdftoppm from Poppler.
#
# The bundled Microsoft schemas don't declare the Word 2010 wps/wpg/wpc namespaces, so the document is
# checked against the ISO schemas' definitions of the same elements in the wp namespace.

set -euo pipefail

OUT="${1:-build/shape-demos}"
shift || true
DEMOS=("$@")
if [ ${#DEMOS[@]} -eq 0 ]; then
    DEMOS=(107-inline-shapes 108-shapes 109-shape-groups 110-shape-connectors 111-shape-styles 112-shape-diagrams)
fi
SOFFICE="${SOFFICE:-soffice}"
WP="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"

mkdir -p "$OUT"
failed=0

for demo in "${DEMOS[@]}"; do
    echo "::group::$demo"
    npm run --silent run-ts -- "./demo/$demo.ts"
    cp "My Document.docx" "$OUT/$demo.docx"

    # Check the XML, with the Word 2010 drawing namespaces moved to the wp namespace
    extracted="$(mktemp -d)"
    unzip -q -o "$OUT/$demo.docx" -d "$extracted"
    sed -e "s#http://schemas.microsoft.com/office/word/2010/wordprocessingShape#$WP#g" \
        -e "s#http://schemas.microsoft.com/office/word/2010/wordprocessingGroup#$WP#g" \
        -e "s#http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas#$WP#g" \
        -e "s#<w:txbxContent#<wps:txbxContent#g" \
        -e "s#</w:txbxContent>#</wps:txbxContent>#g" \
        "$extracted/word/document.xml" > "$extracted/document-as-wp.xml"
    if ! xmllint --noout --schema ooxml-schemas/microsoft/wml-2010.xsd "$extracted/document-as-wp.xml"; then
        echo "::error::$demo doesn't match the schema"
        failed=1
    fi

    # Drawing ids must be unique across the document
    repeated="$(grep -ho '\(wp:docPr\|wps:cNvPr\|pic:cNvPr\|wpg:cNvPr\) id="[0-9]*"' "$extracted"/word/*.xml | sed 's/.*id=//' | sort | uniq -d)"
    if [ -n "$repeated" ]; then
        echo "::error::$demo repeats drawing ids: $repeated"
        failed=1
    fi
    rm -rf "$extracted"

    # Draw the pages
    "$SOFFICE" --headless --convert-to pdf --outdir "$OUT" "$OUT/$demo.docx" > /dev/null
    pdftoppm -png -r 96 "$OUT/$demo.pdf" "$OUT/$demo"
    echo "::endgroup::"
done

exit $failed
