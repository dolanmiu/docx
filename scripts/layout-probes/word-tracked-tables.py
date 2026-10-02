# Reads the probes of word-tracked-tables.ts from a PDF of it, and prints what each shows: where each line is, and the
# borders drawn between the probe's line above and its line below.
#
#   pdftotext -bbox-layout word-tracked-tables.pdf word-tracked-tables.html
#   for n in $(seq 1 12); do pdftocairo -svg -f $n -l $n word-tracked-tables.pdf word-tracked-tables-$n.svg; done
#   python3 word-tracked-tables.py word-tracked-tables
#
# It reads <name>.html, and the borders from <name>-<page>.svg where there is one. Word draws a markup area beside each
# page, with the balloons of the changes in it, and scales the page down to fit it on the paper, and moves it, so
# lengths are given unscaled: in twips of the page as laid out. How much Word scaled it is found from the first table
# with borders left and right, whose middles are the table's 9026 twips apart, or else from where the text starts, 1440
# twips in, which is less exact, as Word moves the page too. Word's PDFs put text on a grid of 1/300 inch (4.8 twips,
# more once unscaled), so a position is only good to about that.
import html
import os
import re
import sys

LEFT = 1440
WIDTH = 9026

PROBES = [
    ("MK14a", "borders of half a point, row 3 of 5 deleted"),
    ("MK14b", "MK14a without row 3"),
    ("MK14c", "borders of 3 points, row 3 of 5 deleted"),
    ("MK14d", "MK14c without row 3"),
    ("MK14e", "borders of 3 points, row 1 of 5 deleted"),
    ("MK14f", "borders of 3 points, row 5 of 5 deleted"),
    ("MK14g", "no borders but the deleted row 3's own, 3 points above and below it"),
    ("MK14h", "100 twips between cells, no borders, row 3 of 5 deleted"),
    ("MK14i", "MK14h without row 3"),
    ("MK14j", "a style whose first row is 16 points, row 1 of 3 deleted"),
    ("MK14k", "a style whose last row is 16 points, row 3 of 3 deleted"),
    ("MK14l", "a style whose bands of one row are 16 and 10 points, row 2 of 5 deleted"),
]


def read(path):
    """Each page's lines, each a list of its words: (left, top, right, bottom, text) in twips of the PDF"""
    text = open(path, encoding="utf8").read()
    pages = []
    for content in re.findall(r"<page [^>]*>(.*?)</page>", text, re.S):
        lines = []
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if words:
                lines.append(words)
        pages.append(lines)
    return pages


def text_of(line):
    return " ".join(word[4] for word in line)


def start_of(lines):
    """Where the page's text starts: the leftmost line, 1440 twips in"""
    return min(line[0][0] for line in lines)


def rectangles(path):
    """The black filled rectangles of a page as SVG, which Word draws borders as, each once, as (left, top, right, bottom)
    in twips of the PDF"""
    body = open(path, encoding="utf8").read().split("</defs>", 1)[1]
    found = set()
    for d in re.findall(r'<path [^>]*fill="rgb\(0%, 0%, 0%\)"[^>]*d="([^"]*)"', body):
        numbers = [float(value) for value in re.findall(r"-?[\d.]+", d)]
        xs, ys = numbers[0::2], numbers[1::2]
        found.add((min(xs) * 20, min(ys) * 20, max(xs) * 20, max(ys) * 20))
    return sorted(found)


def scale_of(name, pages):
    """How much Word scaled the pages: from the first table with borders left and right, beside the text and not the
    change bars in the margin, whose middles are 9026 twips apart, or else from where the text starts"""
    for index, lines in enumerate(pages):
        svg = f"{name}-{index + 1}.svg"
        if os.path.exists(svg):
            start = start_of(lines)
            middles = [(left + right) / 2 for left, top, right, bottom in rectangles(svg) if right - left < bottom - top and left > start - 40]
            if len(middles) > 1:
                return (max(middles) - min(middles)) / WIDTH
    return start_of(pages[0]) / LEFT


def borders(path, start, scale):
    """The lines drawn across the page's text, as (top, bottom) in twips of the PDF: rectangles wider than they are
    tall, left of the markup area"""
    right = start + WIDTH * scale + 40
    return sorted({(top, bottom) for left, top, rectangle_right, bottom in rectangles(path) if rectangle_right <= right and rectangle_right - left > 1000})


def describe(name, pages, scale, probe, what):
    """The probe's lines from its line above to its line below: where each is below the line above's top, how far below
    the line before, and how tall its words are; then the borders drawn between them"""
    index = next((at for at, lines in enumerate(pages) if any(text_of(line) == f"{probe} above" for line in lines)), None)
    print(f"{probe}, {what}:")
    if index is None:
        print("  not found")
        return
    lines = pages[index]
    start = start_of(lines)
    body = sorted((line for line in lines if line[0][0] < start + WIDTH * scale and text_of(line).startswith(probe)), key=lambda line: line[0][1])
    origin = body[0][0][1]
    previous = None
    for line in body:
        top = line[0][1]
        gap = "" if previous is None else f", {round((top - previous) / scale)} below the line before"
        tall = max(word[3] - word[1] for word in line) / scale
        print(f"  {text_of(line)!r}: {round((top - origin) / scale)} down{gap}, words {round(tall)} tall")
        previous = top
    svg = f"{name}-{index + 1}.svg"
    if os.path.exists(svg):
        drawn = [(top, bottom) for top, bottom in borders(svg, start, scale) if origin <= top <= body[-1][0][1]]
        print("  borders: " + (", ".join(f"{round((top - origin) / scale)} down, {round((bottom - top) / scale)} thick" for top, bottom in drawn) or "none"))


name = sys.argv[1]
pages = read(f"{name}.html")
scale = scale_of(name, pages)
print(f"The pages are scaled by {round(scale, 4)}\n")
for probe, what in PROBES:
    describe(name, pages, scale, probe, what)
balloons = [text_of(line) for lines in pages for line in lines if text_of(line).startswith("Deleted:")]
print("\nThe markup area: " + " / ".join(balloons))
