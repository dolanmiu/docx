# Reads the probes of word-tracked-changes.ts from a PDF of each of its documents, and prints what each shows.
#
#   pdftotext -bbox-layout word-tracked-changes.pdf word-tracked-changes.html
#   pdftotext -bbox-layout word-tracked-view-insdel.pdf word-tracked-view-insdel.html
#   pdftotext -bbox-layout word-tracked-view-markup.pdf word-tracked-view-markup.html
#   python3 word-tracked-changes.py word-tracked-changes.html word-tracked-view-insdel.html word-tracked-view-markup.html
#
# It knows which document each is by its name. Word may draw a markup area beside each page, with the balloons of the
# changes in it, and scale the page down to fit it on the paper, so lengths are given unscaled: in twips of the page as
# laid out, found from where the text starts, 1440 twips in. Word's PDFs put text on a grid of 1/300 inch (4.8 twips,
# more once unscaled), so a position is only good to about that.
import html
import os
import re
import sys

LEFT = 1440
WIDTH = 9026


def read(path):
    """Each page's size and lines, as (width, height, lines), each line a list of its words: (left, top, right, bottom, text)
    in twips, in the order pdftotext found them"""
    text = open(path, encoding="utf8").read()
    pages = []
    for size, content in re.findall(r'<page (width="[\d.]+" height="[\d.]+")>(.*?)</page>', text, re.S):
        width, height = (float(value) * 20 for value in re.findall(r"[\d.]+", size))
        lines = []
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if words:
                lines.append(words)
        pages.append((width, height, lines))
    return pages


def text_of(line):
    return " ".join(word[4] for word in line)


def scale_of(lines):
    """How much the page is scaled, from where its text starts: the leftmost line, 1440 twips in"""
    return min(line[0][0] for line in lines) / LEFT if lines else 1


def body_lines(page):
    """The page's lines in the text, without the markup area beside it: pdftotext may read a balloon on a line's level as
    part of it, so words past the right margin are left out"""
    width, height, lines = page
    scale = scale_of(lines)
    right = (LEFT + WIDTH) * scale + 40
    kept = [[word for word in line if word[0] < right] for line in lines]
    return [line for line in kept if line], scale


def balloons(page):
    """The text of the markup area beside the page"""
    width, height, lines = page
    scale = scale_of(lines)
    right = (LEFT + WIDTH) * scale + 40
    return [" ".join(word[4] for word in line if word[0] >= right) for line in lines if any(word[0] >= right for word in line)]


def find(pages, words):
    """The page index and line of the first line with all these words in its text"""
    for index, page in enumerate(pages):
        lines, _ = body_lines(page)
        for line in lines:
            if all(word in text_of(line) for word in words):
                return index, line
    return None, None


def describe(pages, probe, notes=False):
    """Each line from the probe's line above to its line below, on the page of the line above: its text, where it starts
    and ends against the margins, how far below the line before it starts, and how tall its tallest word is"""
    index, above = find(pages, [probe, "above"])
    if above is None:
        print(f"  {probe}: not found")
        return
    lines, scale = body_lines(pages[index])
    lines = sorted(lines, key=lambda line: (line[0][1], line[0][0]))
    start = lines.index(above)
    end = next((at for at in range(start, len(lines)) if probe in text_of(lines[at]) and "below" in text_of(lines[at])), len(lines) - 1)
    previous = None
    for line in lines[start : end + 1]:
        top = line[0][1]
        left = (line[0][0] / scale) - LEFT
        right = LEFT + WIDTH - line[-1][2] / scale
        tall = max(word[3] - word[1] for word in line) / scale
        gap = "" if previous is None else f", {round((top - previous) / scale, 1)} below the line before"
        print(f"  {text_of(line)!r}: {round(left, 1)} from the left margin, {round(right, 1)} from the right{gap}, words {round(tall, 1)} tall")
        previous = top
    if notes:
        below = [text_of(line) for line in lines[end + 1 :] if "note" in text_of(line)]
        print(f"  notes at the bottom of the page: {below}")


def endings(pages, label, following):
    """The number of lines of a paragraph, from the line its label starts to the line before the next's, and the last word
    of each, as word-watertight.py reads MK1"""
    found = []
    for page in pages:
        lines, _ = body_lines(page)
        found.extend(sorted(lines, key=lambda line: line[0][1]))
    start = next((at for at, line in enumerate(found) if line[0][4] == label), None)
    if start is None:
        return "not found"
    stop = next((at for at in range(start + 1, len(found)) if following is None or found[at][0][4] == following), len(found))
    paragraph = found[start:stop]
    return f"{len(paragraph)} lines, ending: " + " | ".join(line[-1][4] for line in paragraph)


def changes(pages):
    print("== MK7: a deleted paragraph mark between paragraphs of different formatting. Set apart: right-aligned, 400 before, 600 after")
    for probe, what in [
        ("MK7a", "the first set apart"),
        ("MK7b", "the first set apart, and deleted"),
        ("MK7c", "the second set apart"),
        ("MK7d", "the first empty and set apart"),
        ("MK7e", "the first in the style Big: 16 points, 600 after"),
        ("MK7f", "the second in the style Big"),
    ]:
        print(f" {probe}, {what}:")
        describe(pages, probe)
    print("\n== MK8: a deleted paragraph mark with no paragraph after it to join")
    print(" MK8a, before a table:")
    describe(pages, "MK8a")
    print(" MK8b, the two paragraphs of a cell, each with its mark deleted, then a row:")
    describe(pages, "MK8b")
    first, first_line = find(pages, ["MK8c", "first", "section"])
    second, second_line = find(pages, ["MK8c", "second", "section"])
    print(" MK8c, a section's mark deleted, before a landscape section:")
    for name, index, line in [("first section", first, first_line), ("second section", second, second_line)]:
        if line is None:
            print(f"  {name}: not found")
        else:
            width, height, _ = pages[index]
            print(f"  {text_of(line)!r}: page {index + 1}, {round(width)} by {round(height)}")
    print(" MK8d, the document's last paragraph:")
    describe(pages, "MK8d")
    _, last = find(pages, ["MK8d", "last"])
    print(f"  {text_of(last)!r}" if last else "  'MK8d last': not found")
    print("\n== MK9: numbered paragraphs")
    for probe, what in [("MK9a", "the second of four items with its mark deleted"), ("MK9b", "an item before a plain paragraph"), ("MK9c", "a plain paragraph before an item")]:
        print(f" {probe}, {what}:")
        describe(pages, probe)
    print("\n== MK10: deleted content other than text")
    print(" MK10a, a picture an inch tall in the line:")
    describe(pages, "MK10a")
    before, before_line = find(pages, ["MK10b", "before"])
    after, after_line = find(pages, ["MK10b", "after"])
    print(" MK10b, a page break:")
    if before_line and after_line:
        print(f"  'MK10b before' on page {before + 1}, 'MK10b after' on page {after + 1}" + (", on the same line" if before == after and before_line == after_line else ""))
    describe(pages, "MK10b")
    print(" MK10c, a tab, which would put 'right' at 1440 twips on from 'MK10c left':")
    describe(pages, "MK10c")
    print(" MK10d, a line break:")
    describe(pages, "MK10d")
    print(" MK10e, a footnote reference, before a footnote that isn't deleted:")
    describe(pages, "MK10e", notes=True)
    print(" MK10f, 'alpha beta gamma' moved from the first paragraph to the second:")
    describe(pages, "MK10f")
    print("\n== MK11: rows and cells")
    for probe, what in [
        ("MK11a", "every row deleted"),
        ("MK11b", "row 2 of 3 deleted, beside a cell merged down from row 1"),
        ("MK11c", "row 1 of 3 deleted, which the merged cell starts in"),
        ("MK11d", "row 2 of 3 inserted"),
        ("MK11e", "the middle cell deleted"),
        ("MK11f", "the middle cell inserted"),
        ("MK11h", "a table sized to its text, whose deleted second row has 12 words in its first cell"),
        ("MK11i", "a column 1500 wide, whose deleted second row has a word about 3000 long"),
        ("MK11j", "a table sized to its text, with 12 words deleted after 'MK11j a'"),
    ]:
        print(f" {probe}, {what}:")
        describe(pages, probe)
    index, _ = find(pages, ["MK11g", "above"])
    print(" MK11g, a deleted header row of a table across pages:")
    if index is None or index + 1 >= len(pages):
        print("  not found")
    else:
        first, _ = body_lines(pages[index])
        following, _ = body_lines(pages[index + 1])
        print(f"  the first lines of the next page: {[text_of(line) for line in sorted(following, key=lambda line: line[0][1])[:2]]}")

        def header_in(lines):
            return "is" if any("MK11g" in text_of(line) and "header" in text_of(line) for line in lines) else "is not"

        print(f"  'MK11g header' {header_in(first)} on the table's first page, and {header_in(following)} repeated on the next")
    print("\n  The markup area: " + " / ".join(text for page in pages for text in balloons(page)))


def view(pages, probe):
    print(f"== {probe}: 40 words deleted ({probe}a, as MK1a: 7 lines with them out, 9 with them in), 40 inserted ({probe}b, 9 lines with them in), and a deleted mark ({probe}c)")
    print(f"  {probe}a deleted : {endings(pages, probe + 'a', probe + 'b')}")
    print(f"  {probe}b inserted: {endings(pages, probe + 'b', probe + 'c')}")
    for word in ["first", "second"]:
        _, line = find(pages, [probe + "c", word])
        print(f"  {probe}c {word}: {text_of(line) if line else 'not found'}")
    print("  The markup area: " + " / ".join(text for page in pages for text in balloons(page)))
    width, _, lines = pages[0]
    print(f"  The page's text starts {round(scale_of(lines) * LEFT, 1)} in, scaled by {round(scale_of(lines), 4)}")


for path in sys.argv[1:]:
    name = os.path.basename(path)
    pages = read(path)
    if name.startswith("word-tracked-changes"):
        changes(pages)
    elif name.startswith("word-tracked-view-insdel"):
        view(pages, "MK12")
    elif name.startswith("word-tracked-view-markup"):
        view(pages, "MK13")
    else:
        sys.exit(f"Not a document of word-tracked-changes.ts: {name}")
    print()
