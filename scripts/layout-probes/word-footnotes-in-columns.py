# Reads the probes of word-footnotes-in-columns.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints, for
# each probe, its lines by page and column, and where its footnotes are.
# Usage: python3 scripts/layout-probes/word-footnotes-in-columns.py build/word-probes/word-footnotes-in-columns.html
import html
import re
import sys
from collections import defaultdict

text = open(sys.argv[1]).read()
# (page, yMin, yMax, xMin, xMax, text, label). A line that doesn't start with its probe's name, as the second line of a
# footnote that wraps, has the label of the line before it in its block, the paragraph it goes on from
LINES = []
for p, page in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for block in re.findall(r"<block.*?</block>", page, re.S):
        label = ""
        for line in re.findall(
            r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', block, re.S
        ):
            words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[4]))
            label = words if re.match(r"N\d+ ", words) else label
            LINES.append((p, float(line[1]), float(line[3]), float(line[0]), float(line[2]), words, label))

# A4 with 1440 margins: the body ends 72 points above the bottom of the page
BODY_BOTTOM = 841.89 - 72
fills = [e for e in LINES if re.fullmatch(r"N1 fill \d+", e[5])]
steps = [b[1] - a[1] for a, b in zip(fills, fills[1:]) if a[0] == b[0] and abs(a[3] - b[3]) < 1 and b[1] > a[1]]
pitch = sum(steps) / len(steps)
print(f"Calibri 11 pitch {pitch:.3f}pt; the body ends at {BODY_BOTTOM:.2f}pt")


def up(y):
    """How many lines above the bottom of the body a line's bottom is"""
    return (BODY_BOTTOM - y) / pitch


def show(probe):
    name = f"{probe} "
    found = [e for e in LINES if e[6].startswith(name)]
    pages = sorted({e[0] for e in found})
    print(f"\n== {probe}")
    groups = defaultdict(list)
    for entry in found:
        kind = "note" if " note " in entry[6] else "text"
        groups[(entry[0], kind, round(entry[3]))].append(entry)
    for (page, kind, x), entries in sorted(groups.items()):
        print(
            f"  page {page} {kind} x {x:5}: {len(entries):3} lines, {entries[0][1]:7.2f} to {entries[-1][2]:7.2f} "
            f"({up(entries[-1][2]):5.2f} lines up), widest to {max(e[4] for e in entries):6.2f}: "
            f"{entries[0][5]!r} .. {entries[-1][5]!r}"
        )
        if kind == "note" or len(entries) < 3:
            for entry in entries:
                print(f"      {entry[1]:7.2f} {entry[3]:6.2f}-{entry[4]:6.2f} {entry[5]}")
    for entry in found:
        if " ref " in entry[5]:
            print(f"  reference: page {entry[0]} {entry[1]:7.2f} x {entry[3]:6.2f} {entry[5]}")
    # The footnotes' numbers, at the start of each footnote
    for entry in LINES:
        if entry[0] in pages and re.fullmatch(r"\d{1,2}", entry[5]) and entry[1] > 600:
            print(f"  a footnote's number: page {entry[0]} {entry[1]:7.2f} x {entry[3]:6.2f} {entry[5]}")


for number in range(1, 13):
    show(f"N{number}")
