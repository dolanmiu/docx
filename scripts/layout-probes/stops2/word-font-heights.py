# Reads FH1 to FH16 of word-stops-font-heights.docx (word-stops-kerning.ts writes it) from a PDF of it: how tall a line of
# each of Office's fonts is, single spaced, at 11 and 20 points, from where Word puts its 30 lines of 11 points and 20 of
# 20 points, over the lines of each on the same page.
#
#   pdftotext -bbox-layout word-stops-font-heights.pdf word-stops-font-heights.html
#   python3 word-font-heights.py word-stops-font-heights [--json]
#
# It takes the name of the PDF without its extension, and reads the file above beside it. Heights are in points, and in
# thousandths of an em. With --json, it prints them as JSON, which scripts/generate-font-widths.ts takes: each font's
# height of a line, in thousandths of an em, at each size.
# cspell:ignore bbox
import html
import json
import re
import sys

base = sys.argv[1]
text = open(base + ".html", encoding="utf8").read()
LINE = re.compile(r"^FH(\d+) (.+) (11|20) line (\d+)$")

# The bottom of each line of each font and size, by page: pdftotext puts it the same distance below the baseline of
# every line of the same font and size
bottoms = {}
fonts = {}
for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for bottom, words in re.findall(r'<line xMin="[\d.]+" yMin="[\d.]+" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>', content, re.S):
        found = LINE.match(" ".join(html.unescape(word) for word in re.findall(r">([^<]*)</word>", words)))
        if found:
            number, font, size = int(found.group(1)), found.group(2), int(found.group(3))
            fonts[number] = font
            bottoms.setdefault((number, size), {}).setdefault(page, []).append(float(bottom))

heights = {}
for (number, size), pages in sorted(bottoms.items()):
    # Each page's lines are as far apart as the line is tall
    span = sum(max(lines) - min(lines) for lines in pages.values())
    gaps = sum(len(lines) - 1 for lines in pages.values())
    heights.setdefault(fonts[number], {})[str(size)] = round(span / gaps / size * 1000, 2)

if "--json" in sys.argv:
    print(json.dumps({"heights": heights}, ensure_ascii=False, separators=(",", ":"), sort_keys=True))
    sys.exit()

print("== FH: the height of a line of each font, in thousandths of an em, at 11 and 20 points")
for number, font in sorted(fonts.items()):
    sizes = heights[font]
    print(f"  FH{number:<3} {font:22} " + "  ".join(f"{size} points: {sizes[size]:8.2f}" for size in ("11", "20")))
