# Reads the probes of word-hidden-paragraphs.ts from a PDF of it, and prints what each shows.
#
#   pdftotext -bbox-layout word-hidden-paragraphs.pdf word-hidden-paragraphs.html
#   python3 word-hidden-paragraphs.py word-hidden-paragraphs.html
#
# Lengths are in twips, across from the left margin and down from the line above the probe. Word's PDFs put text on a
# grid of 1/300 inch, 4.8 twips, so one position is only good to about 5 twips.
import html
import re
import sys

LEFT = 1440


def read(path):
    """Each line, as a list of its words: (page, left, top, right, bottom, text), in twips. pdftotext's lines on the same
    page at the same height are one line, as it splits a line at a tab, and puts table cells side by side on one too"""
    text = open(path, encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if not words:
                continue
            same = next((other for other in found if other[0][0] == page and abs(other[0][2] - words[0][2]) < 20), None)
            if same is None:
                found.append(words)
            else:
                same.extend(words)
                same.sort(key=lambda word: word[1])
    return found


def text_of(line):
    return " ".join(word[5] for word in line)


def find(lines, *starts):
    """The index of the first line whose text starts with these words"""
    for index, line in enumerate(lines):
        if [word[5] for word in line[: len(starts)]] == list(starts):
            return index
    return None


def between(lines, probe):
    """The lines between a probe's line above and its line below, and the line above"""
    above, below = find(lines, probe, "above"), find(lines, probe, "below")
    if above is None or below is None:
        return None, []
    return lines[above], lines[above + 1 : below + 1]


def describe(line, above):
    """Where a line is: its top below the top of the line above, its left and right edges, its height, and its text"""
    top = round(line[0][2] - above[0][2], 1) if line[0][0] == above[0][0] else f"page {line[0][0]}"
    return f"{top:>8} | {round(line[0][1] - LEFT, 1):>7} to {round(line[-1][3] - LEFT, 1):>7} | tall {round(max(w[4] - w[2] for w in line), 1):>5} | {text_of(line)[:70]}"


def show(lines, probe, note):
    print(f"  {probe}: {note}")
    above, found = between(lines, probe)
    if above is None:
        print("    not found")
        return
    for line in found:
        print(f"    {describe(line, above)}")


def page_line(lines, *starts):
    """Where a line is on its page: the page, and its top below the top margin"""
    index = find(lines, *starts)
    if index is None:
        return f"{' '.join(starts)}: not found"
    line = lines[index]
    return f"{' '.join(starts)}: page {line[0][0]}, {round(line[0][2] - 1440, 1)} down | {text_of(line)[:70]}"


def main(path):
    lines = read(path)

    print("== HP1: a hidden paragraph's formatting, before a visible one (down | across | height | text)")
    for probe, note in [
        ("HP1a", "hidden indented 1440, next of two lines"),
        ("HP1b", "hidden centred"),
        ("HP1c", "hidden double spaced, next of two lines"),
        ("HP1d", "hidden with top and bottom borders"),
        ("HP1e", "hidden with a page break before"),
    ]:
        show(lines, probe, note)

    print("\n== HP2: a hidden paragraph before a table, and in cells (a line is 268.55)")
    for probe, note in [
        ("HP2a", "before a table"),
        ("HP2b", "alone in a cell, then a row"),
        ("HP2c", "last in a cell after a visible paragraph, then a row"),
        ("HP2d", "first in a cell before a visible paragraph, then a row"),
    ]:
        show(lines, probe, note)

    print("\n== HP3: a hidden paragraph with a bookmark after a full page of 51 lines, then one with a bookmark")
    for starts in [("HP3", "fill", "51"), ("HP3", "next"), ("HP3", "below")]:
        print(f"  {page_line(lines, *starts)}")
    print(f"  page references: {page_line(lines, 'HP3', 'refs')}")

    print("\n== HP4: page breaks, pictures and footnote references in hidden text")
    for probe, note in [
        ("HP4a", "a hidden paragraph holding a hidden page break"),
        ("HP4b", "a hidden page break between visible text"),
        ("HP4c", "a hidden paragraph holding a hidden picture 40 points tall"),
        ("HP4d", "a hidden footnote reference in a visible paragraph"),
        ("HP4e", "a hidden paragraph holding a hidden footnote reference"),
    ]:
        show(lines, probe, note)
    for starts in [("HP4d", "note"), ("HP4e", "note")]:
        print(f"  {page_line(lines, *starts)}")

    print("\n== HP5 to HP7")
    for probe, note in [
        ("HP5", "a hidden paragraph in a list, between two numbered ones: whether it takes a number"),
        ("HP6a", "480 after, hidden, 240 before"),
        ("HP6b", "480 after, 240 before, without the hidden paragraph"),
        ("HP6c", "contextual spacing, a hidden paragraph of another style between"),
        ("HP6d", "contextual spacing, a hidden paragraph of the same style between"),
        ("HP6e", "contextual spacing, without the hidden paragraph"),
        ("HP7a", "a hidden Heading 1"),
        ("HP7b", "a paragraph hidden by its mark and its run's character style"),
    ]:
        show(lines, probe, note)

    print("\n== HP8: a hidden paragraph last in the document, after a full page of 51 lines")
    print(f"  {page_line(lines, 'HP8', 'fill', '51')}")
    pages = len(re.findall(r"<page ", open(path, encoding="utf8").read()))
    print(f"  pages: {pages}, {max(line[0][0] for line in lines)} with text")


main(sys.argv[1])
