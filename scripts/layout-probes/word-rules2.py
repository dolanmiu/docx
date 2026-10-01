# Reads the probes of word-rules2.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows.
# Usage: python3 scripts/layout-probes/word-rules2.py build/word-probes/word-rules2.html
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
BY_TEXT = {}
for entry in LINES:
    BY_TEXT.setdefault(entry[5], entry)


def at(text):
    return BY_TEXT.get(text)


def tw(points):
    return round(points * 20, 1)


# The pitch of Calibri 11, from the fill lines of Q3a
fills = [at(f"Q3a fill {i}") for i in range(1, 48)]
steps = [b[1] - a[1] for a, b in zip(fills, fills[1:]) if a and b and a[0] == b[0]]
pitch = sum(steps) / len(steps)
top = at("Q1 top")[1]
print(f"Calibri 11 pitch {tw(pitch)} twips; first line's top {top:.2f}pt")

print("\n== Q1: space between paragraphs (twips, over the pitch)")
for probe in "abcde":
    first = next(e for e in LINES if e[5].startswith(f"Q1{probe} first"))
    second = next(e for e in LINES if e[5].startswith(f"Q1{probe} second"))
    print(f"  Q1{probe}: {tw(second[1] - first[1] - pitch):7}   {first[5]} / {second[5]}")

print("\n== Q2: the first paragraph of a section on a new page, after 200 after (page, twips below the body top)")
for name in ["Q2a section start before 1440", "Q2b section start before 100", "Q2c page break before, before 1440"]:
    found = at(name)
    print(f"  {name}: page {found[0]}, {tw(found[1] - top)}")


def columns_of(prefix):
    """The lines whose text starts with prefix, by page and column (their left edge)"""
    groups = defaultdict(list)
    for entry in LINES:
        if entry[5].startswith(prefix):
            groups[(entry[0], round(entry[3]))].append(entry)
    return groups


def show(prefix, detail=False):
    for (page, x), entries in sorted(columns_of(prefix).items()):
        print(
            f"  page {page} x {x:5}: {len(entries):3} lines, {entries[0][1]:7.2f} to {entries[-1][2]:7.2f}, "
            f"widest to {max(e[4] for e in entries):6.2f}: {entries[0][5]!r} .. {entries[-1][5]!r}"
        )
        if detail:
            for entry in entries:
                print(f"      {entry[1]:7.2f} {entry[3]:6.2f}-{entry[4]:6.2f} {entry[5]}")


print("\n== Q3: rows of 4 lines across pages. Lines on the page of the top line")
for probe in "abc":
    first = at(f"Q3{probe} top")[0]
    found = [e for e in LINES if e[5].startswith(f"Q3{probe} line") or e[5].startswith(f"Q3{probe} left") or e[5].startswith(f"Q3{probe} right")]
    print(f"  Q3{probe}: on page {first}: {[e[5] for e in found if e[0] == first]}; after: {[e[5] for e in found if e[0] != first]}")

print("\n== Q4: a table with a header row in 2 columns")
show("Q4 header", detail=True)
show("Q4 row")
show("Q4 after", detail=True)

print("\n== Q5: sections that start in the next column")
for probe in "abcd":
    show(f"Q5{probe} first")
    show(f"Q5{probe} second")
    print()

print("== Q6: footnotes in columns")
show("Q6a fill")
show("Q6a ref", detail=True)
show("Q6a note", detail=True)
print()
show("Q6b", detail=True)
for entry in LINES:
    if re.fullmatch(r"\d+", entry[5]) and 0 < len(entry[5]) < 3:
        print(f"  a number: page {entry[0]} {entry[1]:7.2f} x {entry[3]:6.2f} {entry[5]}")

print("\n== Q7: columns of 2000 and 6306 twips")


def show_page(start, detail=False):
    """The lines on the page of the line whose text starts with start, from it, by column"""
    first = next(e for e in LINES if e[5].startswith(start))
    groups = defaultdict(list)
    for entry in LINES:
        if entry[0] == first[0] and entry[1] >= first[1] - 0.5:
            groups[round(entry[3])].append(entry)
    for x, entries in sorted(groups.items()):
        print(
            f"  page {first[0]} x {x:5}: {len(entries):3} lines, {entries[0][1]:7.2f} to {entries[-1][2]:7.2f}, "
            f"widest to {max(e[4] for e in entries):6.2f}"
        )
        if detail:
            for entry in entries:
                print(f"      {entry[1]:7.2f} {entry[3]:6.2f}-{entry[4]:6.2f} {entry[5][:70]}")


show_page("Q7a")
print()
show_page("Q7b top", detail=True)
print()
show_page("Q7c top", detail=True)
