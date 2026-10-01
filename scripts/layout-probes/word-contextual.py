# Reads the probes of word-contextual.ts from pdftotext -bbox-layout's HTML of PDFs of its two documents, and prints the
# space each shows, in twips over the pitch of Calibri 11.
# Usage: python3 word-contextual.py word-contextual.html word-contextual-adding.html
import html
import re
import sys


def read(name):
    """The lines of a PDF's HTML, by their text: (page, top) in points"""
    lines = {}
    for p, page in enumerate(re.findall(r"<page.*?</page>", open(name).read(), re.S), 1):
        for line in re.findall(r'<line xMin="[\d.]+" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">(.*?)</line>', page, re.S):
            words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[1]))
            lines.setdefault(words, (p, float(line[0])))
    return lines


def tw(points):
    return round(points * 20, 1)


# Calibri 11, single spaced: Word's line is 268.55 twips, LibreOffice's 269
PITCH = 268.55 / 20


def space(lines, first, second):
    """The space between two lines of one page, over the pitch"""
    (page_one, top_one), (page_two, top_two) = lines[first], lines[second]
    return tw(top_two - top_one - PITCH) if page_one == page_two else f"pages {page_one} and {page_two}"


breaks = read(sys.argv[1])
print("== X1: next to the empty paragraph that ends a section (twips, over the pitch)")
for first, second in [
    ("X1a last after 400 contextual", "X1a next"),
    ("X1b last", "X1b first before 400 contextual"),
    ("X1c last after 400 contextual other style", "X1c next"),
]:
    print(f"  {first[:3]}: {space(breaks, first, second):7}   {first} / {second}")

adding = read(sys.argv[2])
print("\n== Y1: with the space after and before added (twips, over the pitch)")
for probe in "abcdef":
    first = next(text for text in adding if text.startswith(f"Y1{probe} first"))
    second = next(text for text in adding if text.startswith(f"Y1{probe} second"))
    print(f"  Y1{probe}: {space(adding, first, second):7}   {first} / {second}")
