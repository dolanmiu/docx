# Reads the probes of word-column-widths.ts from pdftotext -bbox-layout's HTML of a PDF of it, saved from Word or
# LibreOffice, and prints where each probe's paragraph or table rows went: the lines in each column, by page and x.
# Usage: python3 scripts/layout-probes/word-column-widths.py build/word-probes/word-column-widths.html
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


# Each page belongs to the probe whose name its first line starts with, or to the one of the page before, when a probe's
# paragraph goes on to a page of its own
PROBES = {}
for page in sorted({entry[0] for entry in LINES}):
    named = [entry for entry in LINES if entry[0] == page and re.match(r"R\d ", entry[5])]
    PROBES[page] = named[0][5][:2] if named else PROBES.get(page - 1)


def show(probe):
    """The lines of a probe's paragraph or table, without its fill lines, by page and column (their left edge)"""
    groups = defaultdict(list)
    for entry in LINES:
        if PROBES[entry[0]] == probe and not entry[5].startswith(f"{probe} fill"):
            groups[(entry[0], round(entry[3]))].append(entry)
    fills = [entry for entry in LINES if entry[5].startswith(f"{probe} fill")]
    print(f"  {len(fills)} fill lines, the last on page {fills[-1][0]} at {fills[-1][1]:.2f}: {fills[-1][5]!r}")
    for (page, x), entries in sorted(groups.items()):
        print(f"  page {page} x {x:5}: {len(entries):3} lines, {entries[0][1]:7.2f} to {entries[-1][2]:7.2f}")
        for entry in entries:
            print(f"      {entry[1]:7.2f} {entry[3]:6.2f}-{entry[4]:6.2f} {entry[5][:80]}")


print("== R1: 6 narrow lines, room for 4. A: 4 and 1 wide. B: 3 and 1. C: 2 and 2")
show("R1")
print("\n== R2: 5 wide lines, room for 4. A: 3 and 7 narrow. B and C: 4 and 3")
show("R2")
print("\n== R3: 5 narrow lines, room for 4. A and B: 3 and 1 wide. C: none, and 2 wide")
show("R3")
print("\n== R4: R2 across pages, wide to narrow. A: 3 and 7 narrow. B and C: 4 and 3")
show("R4")
print("\n== R5: a table given no widths, from the narrow column into the wide one: the x of each row's cells")
show("R5")
print("\n== R6: the same, 100% wide")
show("R6")
