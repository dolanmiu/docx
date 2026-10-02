# cspell:ignore bbox
# Reads the probes of word-imported-documents.ts from PDFs of its six documents, and prints what each shows.
#
#   pdftotext -bbox-layout word-imported-documents.pdf word-imported-documents.html
#   (and the same for word-imported-text, word-imported-ends, word-imported-parts, word-imported-bookmarks and
#   word-imported-styles)
#   python3 word-imported-documents.py word-imported-*.html
#
# Lengths are in twips. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so one position is only good to about
# 5 twips. Each line whose font is in question ends in ten m's, whose width says which font and size it is in.
import html
import re
import sys

# The width of ten m's in each font and size the probes may give a line, as docx/layout's width tables measure them
RULERS = {
    "Calibri 11": 1758,
    "Calibri 16": 2557,
    "Cambria 11": 1830,
    "Times New Roman 11": 1712,
    "Times New Roman 14": 2178,
    "Times New Roman 24": 3734,
}


def read(path):
    """Each page's size, and its lines, each a list of its words: (left, top, right, bottom, text), in twips. pdftotext's
    lines on the same page at the same height are one line, as it splits a line at a tab, and puts table cells side by
    side on one too"""
    text = open(path, encoding="utf8").read()
    pages = []
    for width, height, content in re.findall(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', text, re.S):
        lines = []
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if not words:
                continue
            same = next((other for other in lines if abs(other[0][1] - words[0][1]) < 20), None)
            if same is None:
                lines.append(words)
            else:
                same.extend(words)
                same.sort(key=lambda word: word[0])
        lines.sort(key=lambda line: line[0][1])
        pages.append((round(float(width) * 20), round(float(height) * 20), lines))
    return pages


def text_of(line):
    return " ".join(word[4] for word in line)


def font_of(line):
    """The font and size whose ten m's are nearest the width of the line's last word of m's, if it has one"""
    ruler = next((word for word in reversed(line) if word[4] == "m" * 10), None)
    if ruler is None:
        return ""
    width = ruler[2] - ruler[0]
    font = min(RULERS, key=lambda name: abs(RULERS[name] - width))
    return f"  [m's {round(width)}: {font}]"


def show(path):
    pages = read(path)
    print(f"== {path}")
    print("   page | size | top | left to right | tall | text   (twips from the page's top left corner)")
    for number, (width, height, lines) in enumerate(pages, 1):
        print(f"   page {number}: {width} x {height} ({'landscape' if width > height else 'portrait'})")
        for line in lines:
            tall = round(max(word[3] - word[1] for word in line), 1)
            print(f"   {number:>4} | {round(line[0][1], 1):>7} | {round(line[0][0], 1):>7} to {round(line[-1][2], 1):>7} | {tall:>5} | {text_of(line)[:80]}{font_of(line)}")
    print()
    probes(pages)


def probes(pages):
    """For each probe between a line above and a line below, where each line between is below the line above"""
    lines = [(number, line) for number, (_, _, page) in enumerate(pages, 1) for line in page]
    for index, (number, line) in enumerate(lines):
        if len(line) == 2 and line[1][4] == "above":
            name = line[0][4]
            print(f"   {name}: down from '{name} above' to each line, to '{name} below'")
            for other_number, other in lines[index + 1 :]:
                where = round(other[0][1] - line[0][1], 1) if other_number == number else f"page {other_number}, {round(other[0][1], 1)} down"
                print(f"      {where:>18} | {text_of(other)[:70]}{font_of(other)}")
                if other[0][4] == name and len(other) == 2 and other[1][4] == "below":
                    break
    print()


for argument in sys.argv[1:]:
    show(argument)
