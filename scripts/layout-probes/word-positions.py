# Compares where the lines of word-positions.docx are in a PDF of it with where layoutDocument from docx/layout puts
# them, from pdftotext -bbox-layout's HTML of the PDF and the layout word-positions.ts writes. Prints each page's header
# and footer, and for each line laid out, its left edge, top and width in points in both, and the room the layout gives
# it. A line's text starts at its left edge when it is aligned to the left, halfway along the room's spare width when it
# is centred, and at the end of the room when it is aligned to the right.
# Usage: python3 scripts/layout-probes/word-positions.py build/word-probes/word-positions.html build/word-probes/word-positions.layout.json
import html
import json
import re
import sys

POINTS_PER_PIXEL = 72 / 96

text = open(sys.argv[1]).read()
layout = json.load(open(sys.argv[2]))
PAGES = []  # each page's lines: (yMin, xMin, xMax, text)
for page in re.findall(r"<page.*?</page>", text, re.S):
    lines = []
    for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[3]))
        lines.append((float(line[1]), float(line[0]), float(line[2]), words))
    PAGES.append(lines)


def words(value):
    return " ".join(value.split())


def within(part, whole):
    """Whether the characters of part are in whole, in order"""
    rest = iter(whole)
    return all(character in rest for character in part)


def found(page, line):
    """
    Word's lines that are this line's text, at its height: a line with a tab on it is more than one, and so is one with a
    footnote's number on it, which is raised, and which is left out unless it is all there is
    """
    top = line["y"] * POINTS_PER_PIXEL
    laid = words(line["text"]).replace(" ", "")
    matches = [w for w in PAGES[page] if abs(w[0] - top) < 3 and w[3].replace(" ", "") and within(w[3].replace(" ", ""), laid)]
    longer = [w for w in matches if len(w[3]) > 1]
    return longer or matches


def lines_of(blocks):
    for block in blocks:
        if block["type"] == "paragraph":
            yield from block["lines"]


print(f"{len(PAGES)} pages in the PDF, {len(layout['pages'])} laid out" + (f", stopped at {layout['stoppedAt']}" if "stoppedAt" in layout else ""))
for index, page in enumerate(layout["pages"]):
    word = PAGES[index] if index < len(PAGES) else []
    header = [w[3] for w in word if w[0] < 60]
    footer = [w[3] for w in word if w[0] > page["height"] * POINTS_PER_PIXEL - 60]
    print(f"\n== page {index + 1}: numbered {page['pageNumber']}, section {page['section']}, header {page.get('header')}, footer {page.get('footer')}")
    print(f"   Word's header {header}, footer {footer}")
    laid = list(lines_of(page["body"])) + [line for note in page["footnotes"] for line in lines_of(note["content"])]
    for line in laid:
        matches = found(index, line)
        x, y = line["x"] * POINTS_PER_PIXEL, line["y"] * POINTS_PER_PIXEL
        width, used = line["width"] * POINTS_PER_PIXEL, line["textWidth"] * POINTS_PER_PIXEL
        if not matches:
            print(f"   {x:6.1f} {y:6.1f}  not in Word's page: {words(line['text'])[:50]}")
            continue
        left = min(w[1] for w in matches)
        right = max(w[2] for w in matches)
        top = min(w[0] for w in matches)
        print(
            f"   x {x:6.1f} Word {left:6.1f}  y {y:6.1f} Word {top:6.1f} ({(top - y) * 20:+5.1f} twips)"
            f"  room {width:6.1f}, text {used:6.1f} Word {right - left:6.1f}: {words(line['text'])[:40]}"
        )
