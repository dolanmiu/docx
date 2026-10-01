# Reads the probes of word-probes.ts from a PDF of word-probes.docx, saved from Word or laid out by LibreOffice, and
# prints what each shows.
#
# Usage: python3 word-probes.py <name>
#   reads <name>.html (pdftotext -bbox-layout <name>.pdf <name>.html) and, for U1, <name>-<page>.svg for the pages with
#   U1's tables (pdftocairo -svg -f <page> -l <page> <name>.pdf <name>-<page>.svg)
#
# Positions are in points from the top of the page, and "line n" counts lines of Calibri 11 down from the top of the
# body (72pt), at the pitch measured over the fill lines: 13.43pt (268.55 twips) in Word, 13.45pt (269) in LibreOffice.
import glob
import html
import re
import sys
from collections import defaultdict

name = sys.argv[1]
text = open(f"{name}.html").read()
PAGES = re.findall(r"<page.*?</page>", text, re.S)
LINES = []  # (page, yMin, yMax, xMin, xMax, text)
for p, page in enumerate(PAGES, 1):
    for found in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", found[4]))
        LINES.append((p, float(found[1]), float(found[3]), float(found[0]), float(found[2]), words))

TOP = 72.0


def tw(points):
    return round(points * 20)


# The pitch of a line of Calibri 11, from a long run of fill lines
def measure_pitch():
    fills = [e for e in LINES if re.fullmatch(r"U2o 5 after fill \d+", e[5])]
    best = None
    for page in sorted({e[0] for e in fills}):
        on = sorted((e for e in fills if e[0] == page), key=lambda e: e[1])
        if len(on) > 10 and (best is None or len(on) > len(best)):
            best = on
    if not best:
        on = sorted((e for e in LINES if e[5].startswith("U2a 47 fill")), key=lambda e: e[1])
        best = [e for e in on if e[0] == on[0][0]]
    return (best[-1][1] - best[0][1]) / (len(best) - 1), best[0][1] - TOP


PITCH, ASCENT_GAP = measure_pitch()
print(f"Calibri 11 pitch {PITCH:.4f}pt ({tw(PITCH * 100) / 100} twips); a line's text starts {ASCENT_GAP:.2f}pt below its top")
print(f"{len(PAGES)} pages")


def line_no(y):
    """The line of the body a line of text whose top is y is on, from 1, when every line above is Calibri 11"""
    return (y - TOP - ASCENT_GAP) / PITCH + 1


def show_probe(prefix):
    """The lines of a probe by page, and by column on a page of columns"""
    found = [e for e in LINES if e[5].startswith(prefix + " ") or e[5] == prefix]
    pages = sorted({e[0] for e in found})
    # Where the columns start: the left edges of the probe's lines, those within 10pt of each other taken as one
    starts = []
    for x in sorted({round(e[3]) for e in found}):
        if not starts or x - starts[-1] > 10:
            starts.append(x)

    def column_of(entry):
        return max([i for i, start in enumerate(starts) if start <= entry[3] + 1] or [0])

    for page in pages:
        # With the lines that name no probe, such as those a footnote of prose wraps onto
        page_lines = sorted(
            (e for e in LINES if e[0] == page and (e[5].startswith(prefix + " ") or not re.match(r"U\d|\d{1,3}$", e[5]))),
            key=lambda e: (e[1], e[3]),
        )
        columns = sorted({column_of(e) for e in page_lines})
        for column in columns:
            on = [e for e in page_lines if column_of(e) == column]
            print(f"   page {page}:" if len(starts) == 1 or len(columns) == 1 and column == 0 else f"   page {page}, column at x {starts[column]}:")
            show_lines(on)


def show_lines(on):
    """Lines one under another: runs numbered one after another collapsed, the rest each with its line number, top and left"""
    run = []

    def flush():
        if run:
            first, last = run[0], run[-1]
            if len(run) == 1:
                print(f"      line {line_no(first[1]):6.2f}  y {first[1]:7.2f}-{first[2]:7.2f}  x {first[3]:6.2f}-{first[4]:6.2f}  {first[5]}")
            else:
                print(f"      {first[5]!r} .. {last[5]!r}: {len(run)} lines, lines {line_no(first[1]):.2f} to {line_no(last[1]):.2f}, x {first[3]:.2f}")
            run.clear()

    def stem(entry):
        match = re.fullmatch(r"(.*?)(\d+)", entry[5])
        return (match.group(1), int(match.group(2))) if match else (entry[5], None)

    for entry in on:
        if re.fullmatch(r"\d{1,3}", entry[5]):
            continue
        # Runs of lines numbered one after another, on lines one after another, in the same place across, are collapsed
        if run:
            (a, n), (b, m) = stem(run[-1]), stem(entry)
            follows = a == b and n is not None and m == n + 1 and abs(entry[1] - run[-1][1] - PITCH) < 1.5
            if not follows or abs(entry[3] - run[-1][3]) > 8:
                flush()
        run.append(entry)
    flush()


# ---------------------------------------------------------------------------------------------------------------------
# U1: column widths, from the vertical borders drawn on each page
# ---------------------------------------------------------------------------------------------------------------------


def borders_of(page):
    """The vertical borders on a page's drawing: (x, top, bottom, colour), in points"""
    files = glob.glob(f"{name}-{page}.svg")
    if not files:
        return None
    body = open(files[0]).read().split("</defs>", 1)[-1]
    found = []
    for tag in re.findall(r"<path[^>]*>", body):
        d = re.search(r'\sd="([^"]*)"', tag)
        if not d:
            continue
        nums = [float(x) for x in re.findall(r"-?[\d.]+(?:e-?\d+)?", d.group(1))]
        xs, ys = nums[0::2], nums[1::2]
        transform = re.search(r'transform="matrix\(([^)]*)\)"', tag)
        if transform:
            a, b, c, dd, e, f = [float(x) for x in transform.group(1).split(",")]
            xs, ys = [a * x + c * y + e for x, y in zip(xs, ys)], [b * x + dd * y + f for x, y in zip(xs, ys)]
        colour = re.search(r'(?:fill|stroke)="(rgb\([^)]*\))"', tag.replace('fill="none"', ""))
        colour = colour.group(1).replace(" ", "") if colour else "?"
        if xs and max(xs) - min(xs) < 1.5 and max(ys) - min(ys) > 5:
            found.append(((min(xs) + max(xs)) / 2, min(ys), max(ys), "red" if colour.startswith("rgb(100%,0%,0%)") else "black"))
    return found


def show_tables():
    labels = []  # (page, top, label, note)
    for entry in LINES:
        match = re.match(r"(U1[a-z]): (.*)", entry[5])
        if match:
            labels.append((entry[0], entry[1], match.group(1), match.group(2)))
    for index, (page, top, label, note) in enumerate(labels):
        following = labels[index + 1] if index + 1 < len(labels) else None
        bottom = following[1] if following and following[0] == page else 10_000
        borders = borders_of(page)
        print(f"{label} {note}")
        if borders is None:
            print(f"    (no drawing of page {page})")
            continue
        for colour in ["black", "red"]:
            mine = [(x, y0, y1) for x, y0, y1, c in borders if c == colour and top < y0 < bottom]
            # Each row's edges: the borders that cover the band just below its top, as a border can be drawn down several
            tops = sorted({round(y0, 1) for _, y0, _ in mine})
            distinct = []
            for y in tops:
                edges = sorted({round(x * 20) for x, y0, y1 in mine if y0 <= y + 0.5 and y1 >= y + 2})
                # Borders drawn in pieces put an edge a twip or two apart
                merged = [e for i, e in enumerate(edges) if i == 0 or e - edges[i - 1] > 4]
                if len(merged) > 1 and merged not in distinct:
                    distinct.append(merged)
            for edges in distinct:
                print(f"    {colour:5} edges {edges}  widths {[b - a for a, b in zip(edges, edges[1:])]}  total {edges[-1] - edges[0]}")


print("\n==== U1: tables given no widths (twips; edges are the borders' middles)")
show_tables()

# ---------------------------------------------------------------------------------------------------------------------
# U2 to U8
# ---------------------------------------------------------------------------------------------------------------------

PROBES = [
    ("U2a 47", "3-line footnote, reference on line 47: 3 of its lines fit"),
    ("U2a 48", "3-line footnote, reference on line 48: 2 fit"),
    ("U2a 49", "3-line footnote, reference on line 49: 1 fits"),
    ("U2b 43", "8-line footnote, reference on line 43: 7 fit"),
    ("U2b 49", "8-line footnote, reference on line 49: 1 fits"),
    ("U2c 43", "8-line footnote without widow control, reference on line 43: 7 fit"),
    ("U2c 49", "8-line footnote without widow control, reference on line 49: 1 fits"),
    ("U2d 49", "2-line footnote, reference on line 49: 1 fits"),
    ("U2e 47", "4-line footnote, reference on line 47: 3 fit"),
    ("U2e 48", "4-line footnote, reference on line 48: 2 fit"),
    ("U2e 49", "4-line footnote, reference on line 49: 1 fits"),
    ("U2f 44", "footnote of 2 paragraphs of 4 lines, reference on line 44: 6 fit"),
    ("U2f 45", "footnote of 2 paragraphs of 4 lines, reference on line 45: 5 fit"),
    ("U2f 46", "footnote of 2 paragraphs of 4 lines, reference on line 46: 4 fit"),
    ("U2f 48", "footnote of 2 paragraphs of 4 lines, reference on line 48: 2 fit"),
    ("U2g 48", "footnote of 3 one-line paragraphs, reference on line 48: 2 fit"),
    ("U2g 49", "footnote of 3 one-line paragraphs, reference on line 49: 1 fits"),
    ("U2h 47", "footnote of a line, a 4-row table and a line, reference on line 47: 3 fit"),
    ("U2h 49", "footnote of a line, a 4-row table and a line, reference on line 49: 1 fits"),
    ("U2j 46 ref 1", "4-line paragraph from line 46, reference to an 8-line footnote on its 1st line"),
    ("U2j 46 ref 3", "4-line paragraph from line 46, reference to an 8-line footnote on its 3rd line"),
    ("U2k 46", "4-line paragraph kept together from line 46, reference to an 8-line footnote on its 1st line"),
    ("U2k 47", "4-line paragraph kept together from line 47, reference to an 8-line footnote on its 1st line"),
    ("U2l 46", "line kept with the next on line 46, reference to an 8-line footnote"),
    ("U2l 47", "line kept with the next on line 47, reference to an 8-line footnote"),
    ("U2m 45 long first", "line 45 refers to an 8-line footnote, then a one-line one"),
    ("U2m 45 short first", "line 45 refers to a one-line footnote, then an 8-line one"),
    ("U2n 44", "line 44 refers to an 8-line footnote, line 45 to a one-line one"),
    ("U2o 5", "120-line footnote, reference on line 5"),
    ("U2p 40", "30-line footnote, reference on line 40"),
    ("U2q 45", "60-line footnote, reference on line 45"),
    ("U3a 49", "one-line row with a one-line footnote, on line 49: fits with it"),
    ("U3a 50", "one-line row with a one-line footnote, on line 50: the footnote doesn't fit below"),
    ("U3a 51", "one-line row with a one-line footnote, on line 51"),
    ("U3b 46", "one-line row with an 8-line footnote, on line 46: 4 lines of it fit"),
    ("U3c 48", "6-line row from line 48, one-line footnotes from its lines 1 and 5"),
    ("U3d 44", "6-line row from line 44, an 8-line footnote from its line 2"),
    ("U3e 49", "row of two 4-line cells from line 49, a one-line footnote from the right's line 3"),
    ("U4a 47", "2 rows from line 47, the left merged down both with 8 lines"),
    ("U4b 48", "3 rows from line 48, the left merged down 2 with 3 lines, the first right 6 lines"),
    ("U4c 47", "a row of a line, a 6-row table and a line, from line 47"),
    ("U4d 49", "a row of a line and a table of a 4-line row, from line 49"),
    ("U4e 46", "a row of 2 lines at least 2700 high, from line 46"),
    ("U4f 46", "a row of 8 lines at least 2700 high, from line 46"),
    ("U4g 46", "a row of 2 lines exactly 2700 high, from line 46"),
    ("U5a 11", "a row that can't break, of 60 lines, from line 11"),
    ("U5b 1", "a row that can't break, of 60 lines, at the top of a page"),
    ("U5c 11", "a row of 3 lines exactly 15000 high, from line 11"),
    ("U5d 11", "a row of 3 lines at least 15000 high, from line 11"),
    ("U6a", "2 columns, references from lines 5 and 10 of the first"),
    ("U6b", "2 columns, a reference from the second only"),
    ("U6c", "2 columns, references from the first and two from the second"),
    ("U6d", "3 columns, a reference from the third only"),
    ("U6e", "2 columns, a reference from the first to a footnote of prose"),
    ("U7a", "continuous section, page break before and 1440 before its first paragraph"),
    ("U7b", "continuous section, page break before and 100 before"),
    ("U7c", "continuous section, page break before and 1440 before, after 800 after"),
    ("U7d", "continuous section after a page break, 1440 before"),
    ("U7e", "new-page section, page break before and 1440 before"),
    ("U8a6 51", "28-point spaces and an 11-point page break on line 51"),
    ("U8a7 51", "28-point spaces and a 28-point page break on line 51"),
    ("U8b1 51", "row on line 51: left cell of 28-point lines, right of one-line paragraphs"),
    ("U8b2 50", "row on line 50: left cell of a line with 900 before, right of one-line paragraphs"),
    ("U8b3 51", "row on line 51: left cell of a 28-point line, right of a 4-line paragraph without widow control"),
    ("U8c1 11", "row of a 60-line paragraph kept together, from line 11"),
    ("U8c2 1", "row of a 60-line paragraph kept together, at the top of a page"),
    ("U8c3 11", "row of a 60-line paragraph kept together beside a one-line cell, from line 11"),
]

for prefix, note in PROBES:
    if prefix == "U2a 47":
        print("\n==== U2: footnotes continued")
    if prefix.startswith("U3a 49"):
        print("\n==== U3: footnotes in table rows")
    if prefix.startswith("U4a"):
        print("\n==== U4: rows with merged cells, a table, or a set height, across pages")
    if prefix.startswith("U5a"):
        print("\n==== U5: rows that can't break, taller than a page")
    if prefix.startswith("U6a"):
        print("\n==== U6: footnotes in columns")
    if prefix.startswith("U7a"):
        print("\n==== U7: the space before a section's first paragraph after a page break (twips below the body's top)")
    if prefix.startswith("U8a6"):
        print("\n==== U8: left open by #3603")
        print("  U8a: lines of only spaces ended by a line break (twips from the line above's top to the text's after the break)")
        for probe in ["U8a1", "U8a2", "U8a3", "U8a4", "U8a5"]:
            above = next((e for e in LINES if e[5] == f"{probe} above"), None)
            after = next((e for e in LINES if e[5] == f"{probe} after break"), None)
            if above and after:
                gap = tw(after[1] - above[1])
                print(f"    {probe}: {gap} twips, so the spaces' line(s) {gap - tw(PITCH)}  ({above[5]} / {after[5]})")
    print(f"\n  {prefix}: {note}")
    if prefix.startswith("U7"):
        first = next((e for e in LINES if e[5].startswith(f"{prefix} first")), None)
        if first:
            print(f"    first paragraph on page {first[0]}, {tw(first[1] - TOP - ASCENT_GAP)} twips below the body's top")
    show_probe(prefix)
