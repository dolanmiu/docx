# Reads the probes of word-next-column.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows:
# the lines of each part of a probe, by page and column, and where they start.
# Usage: python3 word-next-column.py word-next-column.html
import html
import re
import sys
from collections import defaultdict

text = open(sys.argv[1]).read()
LINES = []  # (page, yMin, yMax, xMin, xMax, text)
for p, page in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for line in re.findall(
        r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', page, re.S
    ):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[4]))
        LINES.append((p, float(line[1]), float(line[3]), float(line[0]), float(line[2]), words))


def tw(points):
    return round(points * 20, 1)


def show(prefix):
    """The lines whose text starts with prefix, by page and column (their left edge)"""
    groups = defaultdict(list)
    for entry in LINES:
        if entry[5].startswith(prefix):
            groups[(entry[0], round(entry[3]))].append(entry)
    for (page, x), entries in sorted(groups.items()):
        print(
            f"  page {page} x {x:5}: {len(entries):3} lines, {entries[0][1]:7.2f} to {entries[-1][2]:7.2f}: "
            f"{entries[0][5]!r} .. {entries[-1][5]!r}"
        )


def first(prefix):
    return next(e for e in LINES if e[5].startswith(prefix))


for probe, parts in [
    ("N1", ["first", "second"]),
    ("N2", ["first", "second"]),
    ("N3", ["first", "second"]),
    ("N4", ["first", "second"]),
    ("N5", ["first", "second", "third"]),
    ("N6", ["top", "first", "second", "after"]),
]:
    print(f"== {probe}")
    for part in parts:
        show(f"{probe} {part}")
    print()

# The space above the first line of the section in the next column, below the top of the first column's first line
for probe in ["N1", "N2"]:
    top, start = first(f"{probe} first"), first(f"{probe} second")
    print(f"{probe}: '{start[5]}' {tw(start[1] - top[1])} twips below the first column's first line, page {start[0]}")
