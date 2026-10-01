# Reads word-header-columns.ts's probes from pdftotext -bbox-layout's HTML of a PDF of it, and prints, for each probe,
# each column's lines: how many, the first two and the last, and where they start and end, in points. Then where the
# line after the columns is.
# Usage: pdftotext -bbox-layout scripts/layout-probes/word-header-columns.pdf build/word-probes/word-header-columns.html
#        python3 scripts/layout-probes/word-header-columns.py build/word-probes/word-header-columns.html
import html
import re
import sys
from collections import defaultdict

text = open(sys.argv[1]).read()
LINES = []  # (page, yMin, yMax, xMin, text)
for p, page in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[3]))
        LINES.append((p, float(line[1]), float(line[2]), float(line[0]), words))

for name in ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"]:
    mine = [entry for entry in LINES if entry[4].split(" ")[0] == name]
    columns = defaultdict(list)
    for entry in mine:
        if not entry[4].endswith(("top", "after")):
            columns[(entry[0], round(entry[3]))].append(entry)
    print(f"== {name}")
    for (page, x), entries in sorted(columns.items()):
        shown = [entry[4].replace(f"{name} ", "") for entry in entries]
        first = ", ".join(shown[:2])
        print(f"  page {page} x {x:4}: {len(entries):3} lines, {entries[0][1]:7.2f} to {entries[-1][2]:7.2f}: {first} .. {shown[-1]}")
    for entry in mine:
        if entry[4].endswith("after"):
            print(f"  after: page {entry[0]} at {entry[1]:.2f}")
