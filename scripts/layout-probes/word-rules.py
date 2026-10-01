# Reads the probes of word-rules.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows.
# Usage: python3 scripts/layout-probes/word-rules.py build/word-probes/word-rules.html
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
BY_TEXT = {}
for entry in LINES:
    BY_TEXT.setdefault(entry[4], entry)


def at(text):
    found = BY_TEXT.get(text)
    if found is None:
        matches = [entry for entry in LINES if entry[4].startswith(text)]
        found = matches[0] if matches else None
    return found


def tw(points):
    return round(points * 20, 1)


def on_page(prefix):
    """The lines whose text starts with prefix, by page"""
    pages = defaultdict(list)
    for entry in LINES:
        if entry[4].startswith(prefix):
            pages[entry[0]].append(entry)
    return pages


pitch = at("P1a first")[1] - at("P1 top")[1]
top = at("P1 top")[1]
print(f"Calibri 11 pitch {tw(pitch)} twips; body top {top:.2f}pt")

print("\n== P0: space before the first paragraph of the document (twips below the body top)")
print(f"  {tw(at('P0 first')[1] - top)}")

print("\n== P1: space between paragraphs (twips, over the pitch)")
for name in "abcdef":
    first = at(f"P1{name} first")
    second = at(f"P1{name} second")
    print(f"  P1{name}: {tw(second[1] - first[1] - pitch):6}   {first[4]} / {second[4]}")
for name in "gh":
    above, row1, row2, below = at(f"P1{name} above"), at(f"P1{name} row 1"), at(f"P1{name} row 2"), at(f"P1{name} below")
    print(
        f"  P1{name}: above to row {tw(row1[1] - above[1] - pitch)}, row to row {tw(row2[1] - row1[1] - pitch)},"
        f" row to below {tw(below[1] - row2[1] - pitch)}   {above[4]} / {below[4]}"
    )

print("\n== P2: a paragraph with 1440 before at the top of a page (page, twips below the body top)")
for name in ["P2a after page break", "P2b page break before", "P2c natural break", "P2d section start"]:
    found = at(name)
    print(f"  {name}: page {found[0]}, {tw(found[1] - top)}")

print("\n== P3: widow control. Lines of the 4-line paragraph on the first page, after k lines, and lines per full page")
for mode in ["unset", "off", "on"]:
    results = []
    for k in [47, 48, 49, 50, 51]:
        first = at(f"P3 {mode} {k} top")[0]
        kept = sum(1 for i in range(1, 5) if at(f"P3 {mode} {k} line {i}")[0] == first)
        fills = sum(1 for entry in on_page(f"P3 {mode} {k} ")[first])
        results.append(f"k={k}: {kept} of 4 ({fills} lines on the page)")
    print(f"  {mode:5}: " + "; ".join(results))

print("\n== P5: table rows (twips over the pitch)")
for name in "abcdefg":
    above, below = at(f"P5{name} above"), at(f"P5{name} below")
    rows = [entry for entry in LINES if entry[4].startswith(f"P5{name} ") and entry not in (above, below)]
    ys = [above[1]] + [entry[1] for entry in rows] + [below[1]]
    gaps = [tw(b - a - pitch) for a, b in zip(ys, ys[1:])]
    print(f"  P5{name}: {gaps}")

print("\n== P6: line pitch (twips) of each font and size, two measures each")
for short in ["TNR", "Cal", "Cam", "Ari", "Cou"]:
    out = []
    for size in [8, 9, 10, 10.5, 11, 11.5, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 36]:
        label = f"{size:g}"
        found = [at(f"P6 {short} {label} {i}") for i in (1, 2, 3)]
        measures = [tw(b[1] - a[1]) for a, b in zip(found, found[1:]) if a[0] == b[0]]
        out.append(f"{label}:{'/'.join(f'{m:g}' for m in measures)}")
    print(f"  {short}: " + " ".join(out))

print("\n== P6m: text of another size than its paragraph mark (Calibri 11). Pitch to the next paragraph, and within")
for size in [8, 16]:
    one = [at(f"P6m {size} one {i}") for i in (1, 2, 3)]
    two_a = [at(f"P6m {size} two {i}a") for i in (1, 2, 3)]
    two_b = [at(f"P6m {size} two {i}b") for i in (1, 2, 3)]
    print(f"  {size}pt one line: {[tw(b[1] - a[1]) for a, b in zip(one, one[1:])]}")
    print(
        f"  {size}pt two lines: first to second line {[tw(b[1] - a[1]) for a, b in zip(two_a, two_b)]},"
        f" paragraph to paragraph {[tw(b[1] - a[1]) for a, b in zip(two_a, two_a[1:])]}"
    )

print("\n== P7a: three one-line footnotes. Body lines on the page, and the notes' tops")
page = at("P7a top")[0]
body = [entry for entry in LINES if entry[0] == page and entry[4].startswith("P7a") and "note" not in entry[4]]
notes = [entry for entry in LINES if entry[0] == page and "note" in entry[4]]
print(f"  {len(body)} body lines, the last at {body[-1][1]:.2f}-{body[-1][2]:.2f}")
for entry in LINES:
    if entry[0] == page and entry not in body:
        print(f"    {entry[1]:7.2f} {entry[2]:7.2f} x{entry[3]:6.1f} {entry[4]}")

print("\n== P7b: an 8-line footnote with its reference on line k. Pages of the reference and of the note's lines")
for k in [40, 44, 47]:
    first = at(f"P7b {k} top")[0]
    ref = at(f"P7b {k} ref")
    note_pages = [at(f"P7b {k} note line {i}")[0] - first for i in range(1, 9)]
    body = len([e for e in on_page(f"P7b {k} ")[first] if "note" not in e[4]])
    print(f"  k={k}: reference on page {ref[0] - first}, note lines on pages {note_pages}, {body} body lines on the first page")
    for entry in LINES:
        if entry[0] in (first, first + 1) and ("note" in entry[4] or not entry[4].startswith("P7b")):
            print(f"    p{entry[0] - first} {entry[1]:7.2f} {entry[2]:7.2f} x{entry[3]:6.1f} {entry[4]}")

print("\n== P7c: a one-line footnote with its reference on line k. Pages of the reference and note")
for k in [47, 48, 49, 50]:
    first = at(f"P7c {k} top")[0]
    body = len([e for e in on_page(f"P7c {k} ")[first] if "note" not in e[4]])
    print(f"  k={k}: reference on page {at(f'P7c {k} ref')[0] - first}, note on {at(f'P7c {k} note')[0] - first}, {body} body lines on the first page")

print("\n== P8: a row of 4 lines after k lines. Lines on the first page")
for k in [47, 48, 49, 50]:
    first = at(f"P8 {k} top")[0]
    kept = sum(1 for i in range(1, 5) if at(f"P8 {k} line {i}")[0] == first)
    print(f"  k={k}: {kept} of 4, {len(on_page(f'P8 {k} ')[first])} lines on the page")

print("\n== P9: columns before a continuous section break (lines per column)")
for name, count in [("P9a", 21), ("P9b", 20)]:
    columns = defaultdict(int)
    for i in range(1, count + 1):
        columns[round(at(f"{name} fill {i}")[3])] += 1
    print(f"  {name}: {dict(sorted(columns.items()))}; after at {at(name + ' after')[1]:.2f}, page {at(name + ' after')[0]}")

print("\n== P10: a paragraph of only spaces with an 11-point mark (its height in twips)")
for name in ["a empty", "b letter 8", "c space 8", "d spaces 8", "e space 2", "f space 20"]:
    print(f"  {name}: {tw(at(f'P10{name} below')[1] - at(f'P10{name} above')[1] - pitch)}")

print("\n== P4: headers and footers of n lines. Body top (twips below 1440) and lines on the first page")
for kind in ["header", "footer"]:
    for n in [1, 3, 6, 10]:
        found = at(f"P4 {kind} {n} top")
        body = [e for e in on_page(f"P4 {kind} {n} ")[found[0]] if "line" not in e[4]]
        part = [e for e in LINES if e[0] == found[0] and e[4].startswith(f"P4 {kind} {n} line")]
        print(
            f"  {kind} {n}: body top {tw(found[1] - top)}, {len(body)} body lines, last {body[-1][2]:.2f};"
            f" {kind} lines {part[0][1]:.2f} to {part[-1][2]:.2f}"
        )
