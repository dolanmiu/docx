# Reads the probes of word-notes-across-pages.ts from Word's PDFs of its two documents, and prints what each shows.
#
#   pdftotext -bbox-layout word-notes-across-pages.pdf word-notes-across-pages.html
#   pdftotext -bbox-layout word-notes-final-table.pdf word-notes-final-table.html
#   python3 word-notes-across-pages.py word-notes-across-pages word-notes-final-table
#
# It takes the names of the PDFs without their extensions, and reads the HTML beside each. Positions are in twips from the
# top and left of the page.
import html
import re
import sys
from collections import defaultdict


def read(base):
    """Each line pdftotext found, as (page, top, left, text), in twips"""
    text = open(base + ".html", encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for x0, y0, body in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">(.*?)</line>', content, re.S):
            words = " ".join(html.unescape(word) for word in re.findall(r">([^<]*)</word>", body))
            # Without the note's number, where pdftotext puts it on the line of its text
            words = re.sub(r"^\d+ ?(?=N[PF]\d)", "", words)
            found.append((page, round(float(y0) * 20), round(float(x0) * 20), words))
    return found


def numbers(lines, prefix):
    """The numbers of the lines that start with a prefix, such as "NP1 row", by page"""
    pages = defaultdict(list)
    for page, _, _, text in lines:
        match = re.match(re.escape(prefix) + r" (\d+)$", text)
        if match:
            pages[page].append(int(match.group(1)))
    return {page: f"{min(found)} to {max(found)} ({len(found)})" for page, found in sorted(pages.items())}


def where(lines, text):
    """The page, top and left of the first line that starts with a text"""
    return next(((page, top, left) for page, top, left, line in lines if line.startswith(text)), None)


def across(base):
    lines = read(base)
    print(f"NP1 ref at {where(lines, 'NP1 ref')}, head at {where(lines, 'NP1 head')}")
    print(f"NP1 row lines by page: {numbers(lines, 'NP1 row line')}")
    print(f"NP1 after: {numbers(lines, 'NP1 after fill')}")
    print(f"NP2 ref at {where(lines, 'NP2 ref')} (the second column is at a left of about 6283)")
    print(f"NP2 first column: {numbers(lines, 'NP2 fill')}, note lines by page: {numbers(lines, 'NP2 note line')}")
    print(f"NP2 after: {numbers(lines, 'NP2 after fill')}")
    print(f"NP3 ref at {where(lines, 'NP3 ref')}, head at {where(lines, 'NP3 head')}")
    print(f"NP3 cell of 6 lines by page: {numbers(lines, 'NP3 a line')}, cell of 3: {numbers(lines, 'NP3 b line')}")


def final(base):
    lines = read(base)
    for probe, below in (("NF1", "NF1 next note"), ("NF2", "NF2 next note")):
        cell = where(lines, f"{probe} cell")
        after = where(lines, below)
        if cell is None or after is None:
            print(f"{probe}: cell at {cell}, next note at {after}")
            continue
        # The cell's line of 8 points and its 24 after, the table's bottom border, then the empty paragraph: a line of
        # Calibri 11 in Normal, or of 8 points with 24 after in the note's style
        normal = 2500 / 2048 * 8 + 24 + 0.5 + 2500 / 2048 * 11
        styled = 2500 / 2048 * 8 + 24 + 0.5 + 2500 / 2048 * 8 + 24
        gap = (after[1] - cell[1]) / 20
        print(
            f"{probe}: the next note's line starts {gap:.1f} points below the table's line, on page {after[0]},"
            f" which is about {normal:.1f} with the empty paragraph after the table in Normal, and {styled:.1f} in the"
            " note's style"
        )


across(sys.argv[1])
final(sys.argv[2])
