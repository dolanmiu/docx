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
    DEMOS=(107-inline-shapes 108-shapes 109-shape-groups 110-shape-connectors 111-shape-styles 112-shape-diagrams 113-shape-layout 115-shape-document-styles 116-shape-swimlanes 117-shape-page-layout 118-theme)
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

    # The Word 2010 drawing extensions (wp14), which the ISO schemas don't have, are checked against their own schema,
    # and where they are: a floating drawing's relative sizes come after its graphic, and a percentage offset is the
    # choice for a position, with its offset in EMUs as the fallback
    perl -0ne 'print qq(<wp14:check xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing">);
        print "$1\n" while /(<wp14:(sizeRel[HV])\b.*?<\/wp14:\2>|<wp14:(pctPos[HV]Offset)>.*?<\/wp14:\3>)/gs;
        print "</wp14:check>\n"' "$extracted/word/document.xml" > "$extracted/wp14.xml"
    if ! xmllint --noout --schema scripts/shape-demos/wp14.xsd "$extracted/wp14.xml" 2> "$extracted/errors.txt"; then
        cat "$extracted/errors.txt"
        echo "::error::$demo has Word 2010 drawing extensions that don't match their schema"
        failed=1
    fi
    misplaced="$(perl -0ne '$all = () = /<wp14:(?:sizeRel[HV]|pctPos[HV]Offset)\b/g;
        $placed = () = /<wp:position([HV]) relativeFrom="\w+"><mc:AlternateContent><mc:Choice Requires="wp14"><wp14:pctPos\1Offset>-?\d+<\/wp14:pctPos\1Offset><\/mc:Choice><mc:Fallback><wp:posOffset>-?\d+<\/wp:posOffset><\/mc:Fallback><\/mc:AlternateContent><\/wp:position\1>/g;
        while (/<\/a:graphic>((?:<wp14:sizeRel[HV]\b.*?<\/wp14:sizeRel[HV]>)+)<\/wp:anchor>/gs) { my $sizes = $1; $placed += () = $sizes =~ /<wp14:sizeRel[HV]\b/g; }
        print $all - $placed' "$extracted/word/document.xml")"
    if [ "$misplaced" != 0 ]; then
        echo "::error::$demo has $misplaced Word 2010 drawing extensions where they don't go"
        failed=1
    fi

    for view in choice fallback; do
        if [ "$view" = choice ]; then
            keep='s#<mc:Fallback>.*?</mc:Fallback>##g; s#</?mc:(AlternateContent|Choice)[^>]*>##g'
        else
            keep='s#<mc:Choice [^>]*>.*?</mc:Choice>##g; s#</?mc:(AlternateContent|Fallback)[^>]*>##g'
        fi
        # Without the extensions, which were checked above: a percentage offset becomes an offset
        keep="$keep; s#<wp14:pctPos[HV]Offset>-?\d+</wp14:pctPos[HV]Offset>#<wp:posOffset>0</wp:posOffset>#g; s#<wp14:sizeRel([HV])\b.*?</wp14:sizeRel\1>##g"
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

    # The document's theme
    if ! xmllint --noout --schema ooxml-schemas/ISO-IEC29500-4_2016/dml-main.xsd "$extracted/word/theme/theme1.xml" 2> "$extracted/errors.txt"; then
        cat "$extracted/errors.txt"
        echo "::error::$demo has a theme that doesn't match the schema"
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
