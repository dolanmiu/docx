# Reads the probes of word-table-formats.ts and word-table-formats2.ts from a PDF of each, and prints what each shows.
#
#   pdftotext -bbox-layout word-table-formats.pdf word-table-formats.html
#   pdftohtml -xml -i -q -zoom 1 word-table-formats.pdf word-table-formats
#   python3 word-table-formats.py word-table-formats
#
# and the same for word-table-formats2, which it knows by its name.
#
# It takes the name of the PDF without its extension, and reads the two files above beside it: where each word is from the
# first, and the size of each cell's text in CF from the second. Lengths are in twips, and positions are from the top and
# left of the page's text. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so one position is only good to about
# 5 twips, and the pitch of rows is found over several of them. "Words a line" lists how many words each line of a
# paragraph has, from which the width it was broken in can be worked out with docx/layout's widths.
# cspell:ignore pdftohtml fontspec
import html
import re
import sys

# Calibri 11's lines in Word, and the top and left of the text on A4 with 1440 margins
LINE = 2500 / 2048 * 220
TOP = 1440
LEFT = 1440
WIDTH = 9026


def read(base):
    """Each line, as pdftotext found it, as a list of its words: (page, left, top, right, bottom, text), in twips"""
    text = open(base + ".html", encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if words:
                found.append(words)
    return found


def sizes_of(base):
    """The size in points of each piece of text, from pdftohtml -xml -zoom 1, by its text"""
    text = open(base + ".xml", encoding="utf8").read()
    sizes = dict(re.findall(r'<fontspec id="(\d+)" size="([\d.]+)"', text))
    return {html.unescape(re.sub(r"<[^>]+>", "", inner)).strip(): float(sizes[font]) for font, inner in re.findall(r'<text [^>]*font="(\d+)">(.*?)</text>', text)}


def placed_sizes_of(base):
    """The size in points of each piece of text, from pdftohtml -xml -zoom 1, with its page and its top in twips"""
    text = open(base + ".xml", encoding="utf8").read()
    sizes = dict(re.findall(r'<fontspec id="(\d+)" size="([\d.]+)"', text))
    return [
        (page, int(top) * 20, html.unescape(re.sub(r"<[^>]+>", "", inner)).strip(), float(sizes[font]))
        for page, content in enumerate(re.findall(r"<page .*?</page>", text, re.S), 1)
        for top, font, inner in re.findall(r'<text top="(\d+)" [^>]*font="(\d+)">(.*?)</text>', content)
    ]


def words_of(lines):
    return [word for line in lines for word in line]


def first(lines, *prefix):
    """The first word of the first run of words that are these, as a line"""
    for line in lines:
        for index in range(len(line) - len(prefix) + 1):
            if [word[5] for word in line[index : index + len(prefix)]] == list(prefix):
                return line[index:]
    return None


def top_of(lines, *prefix):
    line = first(lines, *prefix)
    return line[0][2] if line else None


def page_of(lines, *prefix):
    line = first(lines, *prefix)
    return line[0][0] if line else None


def rows(lines, probe, count, word="row"):
    """The pitch of rows named `probe row n`, the gap from the line above the table to the first, and from the last to
    the line below it, from the tops of their first words"""
    tops = [top_of(lines, probe, word, str(n)) for n in range(1, count + 1)]
    above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
    if None in tops or above is None or below is None:
        return "not found"
    pitches = [round(b - a, 1) for a, b in zip(tops, tops[1:])]
    return f"from above {round(tops[0] - above, 1)}, pitch {round((tops[-1] - tops[0]) / (count - 1), 1)} ({', '.join(map(str, pitches))}), to below {round(below - tops[-1], 1)}"


def row_height(lines, probe):
    """How tall a table of one row between a line above it and one below is"""
    above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
    return round(below - above - LINE, 1) if above is not None and below is not None else "?"


def between(lines, probe):
    """The lines of a probe's table, those between its line above and its line below on the page"""
    above, below = first(lines, probe, "above"), first(lines, probe, "below")
    if above is None or below is None:
        return []
    return [line for line in lines if line[0][0] == above[0][0] and above[0][2] + 1 < line[0][2] < below[0][2] - 1]


def column(lines, low, high=LEFT + WIDTH * 2):
    """The words of lines whose left edge is between two positions across the page, grouped back into lines by their top"""
    words = sorted((word for word in words_of(lines) if low <= word[1] < high), key=lambda word: (round(word[2]), word[1]))
    grouped = {}
    for word in words:
        grouped.setdefault(round(word[2] / 10), []).append(word)
    return list(grouped.values())


def paragraph(found):
    """Where a cell's lines start and end across the page, and how many words each has"""
    if not found:
        return "not found"
    return (
        f"from {round(min(line[0][1] for line in found) - LEFT, 1)} to {round(max(line[-1][3] for line in found) - LEFT, 1)}, "
        f"{len(found)} lines, words a line {[len(line) for line in found]}"
    )


def border_probes(lines):
    print("== BS: each style of border, 1.5 points unless given, as a table's top, inside and bottom borders, 5 one-line rows.")
    print("   The room a border takes is the pitch less a line (268.55)")
    styles = [
        "single", "thick", "double", "dotted", "dashed", "dotDash", "dotDotDash", "triple", "thinThickSmallGap", "thickThinSmallGap",
        "thinThickThinSmallGap", "thinThickMediumGap", "thickThinMediumGap", "thinThickThinMediumGap", "thinThickLargeGap", "thickThinLargeGap",
        "thinThickThinLargeGap", "wave", "doubleWave", "dashSmallGap", "dashDotStroked", "threeDEmboss", "threeDEngrave", "outset", "inset",
    ]  # fmt: skip
    extra = ["double 0.5", "double 3", "thinThickSmallGap 0.5", "thinThickSmallGap 3", "triple 0.5", "single, space 10 points"]
    for index, name in enumerate(styles + extra, 1):
        probe = f"BS{index}"
        tops = [top_of(lines, probe, "row", str(n)) for n in range(1, 6)]
        above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
        if None in tops or above is None or below is None:
            print(f"  {probe:5} {name:24}: not found")
            continue
        room = (tops[-1] - tops[0]) / 4 - LINE
        print(f"  {probe:5} {name:24}: inside {round(room, 1):6}, top {round(tops[0] - above - LINE, 1):6}, bottom {round(below - tops[-1] - LINE, 1):6}")


def conflict_probes(lines):
    print("\n== BC: borders that disagree. Pitch is from the top of each row's text to the next")
    left = [top_of(lines, "BC1", "row", str(n)) for n in range(1, 6)]
    right = [top_of(lines, "BC1", "right", str(n)) for n in range(1, 6)]
    print(f"  BC1 a 3-point top border on the left cell of rows 2 to 5 only: {rows(lines, 'BC1', 5)}")
    if None not in left and None not in right:
        print(f"      the right cell's text below the left's, in each row: {[round(r - l, 1) for l, r in zip(left, right)]}")
    print(f"  BC2 each cell 1.5 points above and 3 below:                   {rows(lines, 'BC2', 5)}")
    print(f"  BC3 the table's 3 points, rows 2 to 5 a cell's half point:   {rows(lines, 'BC3', 5)}")
    print(f"  BC4 the table's 3 points, rows 2 to 5 a cell's nil:          {rows(lines, 'BC4', 5)}")
    print(f"  BC5 the table's 3 points, rows 2 to 5 a cell's none:         {rows(lines, 'BC5', 5)}")
    print(f"  BC6 the table's own 3-point top only, its style's 1 point:   {rows(lines, 'BC6', 5)}")
    for probe, note in [("BC7", "a cell's 6-point left and right borders"), ("BC8", "the table's 6-point left and right"), ("BC9", "a cell's 6-point borders, margins 108")]:
        print(f"  {probe} {note}: {paragraph(between(lines, probe))}")


def spacing_probes(lines):
    print("\n== CS: space between cells")
    print(f"  CS1 100, with half-point borders on every side: {rows(lines, 'CS1', 5)}")
    print(f"  CS2 100, with 3-point borders on every side:    {rows(lines, 'CS2', 5)}")
    print(f"  CS3 100, with cells' 3-point top and bottom:    {rows(lines, 'CS3', 5)}")
    print(f"  CS4 100, and 300 of row 3's own:                {rows(lines, 'CS4', 5)}")
    for probe in ["CS5", "CS6"]:
        found = between(lines, probe)
        right = first(found, probe, "right")
        print(f"  {probe} sized to its text, 200 between cells:")
        if right is not None:
            print(f"      left cell:  {paragraph(column(found, 0, right[0][1] - 1))}")
            print(f"      right cell: {paragraph(column(found, right[0][1] - 1))}")
    print(f"  CS7 one column, 100 between cells: {paragraph(between(lines, 'CS7'))}")
    found = between(lines, "CS8")
    middle, right = first(found, "CS8", "middle"), first(found, "CS8", "right")
    if middle is not None and right is not None:
        print(f"  CS8 three columns of 3008, 100 between cells:")
        print(f"      left:   {paragraph(column(found, 0, middle[0][1] - 1))}")
        print(f"      middle: {paragraph(column(found, middle[0][1] - 1, right[0][1] - 1))}")
        print(f"      right:  {paragraph(column(found, right[0][1] - 1))}")


def border_break_probes(lines):
    print("\n== BB: one-line rows whose cells have 3-point top and bottom borders, the 5th ending this much above the bottom")
    for probe, note in [("BB1", "30 to spare"), ("BB2", "90 to spare")]:
        start = page_of(lines, probe, "top")
        on = [n for n in range(1, 9) if start is not None and page_of(lines, probe, "row", str(n)) == start]
        print(f"  {probe} {note}: rows on the first page: {on}")


def kept_probes(lines):
    print("\n== KR: rows kept with the next. The pages each row's first line is on, from the probe's first page")
    for probe, count, note in [
        ("KR1", 10, "a cell's first paragraph kept, rows 1 to 9; rows 1 and 2 fit"),
        ("KR2", 10, "a cell's second paragraph kept, rows 1 to 9; rows 1 and 2 fit"),
        ("KR3", 10, "the last row kept; the table ends at the bottom of the page"),
        ("KR4", 10, "every row kept; the table ends at the bottom of the page"),
        ("KR5", 60, "rows 1 to 59 kept, after 20 lines"),
        ("KR6", 10, "a paragraph kept, before rows 1 to 3 kept; it and rows 1 and 2 fit"),
        ("KR7", 10, "row 5 kept, before a row of 10 lines; rows 1 to 5 and 4 lines fit"),
    ]:
        start = page_of(lines, probe, "top")
        if start is None:
            print(f"  {probe}: not found")
            continue
        pages = {}
        for n in range(1, count + 1):
            page = page_of(lines, probe, "row", str(n))
            pages.setdefault(page - start + 1 if page else "?", []).append(n)
        shown = "; ".join(f"page {page}: rows {found[0]} to {found[-1]}" if len(found) > 1 else f"page {page}: row {found[0]}" for page, found in pages.items())
        print(f"  {probe} {note}:\n      {shown}")
        if probe == "KR6":
            print(f"      the kept paragraph on page {page_of(lines, probe, 'kept') - start + 1}")
        if probe == "KR7":
            on = [n for n in range(1, 11) if page_of(lines, probe, "row", "6", "line", str(n)) == start]
            print(f"      row 6's lines on the first page: {on}")
        after = page_of(lines, probe, "after")
        print(f"      the paragraph after the table on page {after - start + 1 if after else '?'}")


def vertical_probes(lines):
    print("\n== VT: text that runs up a cell 2000 wide")
    print(f"  VT1 a row of only a cell of it: the row is {row_height(lines, 'VT1')} tall")
    print(f"  VT2 with 200 above and below, beside a line: the row is {row_height(lines, 'VT2')} tall")
    found = between(lines, "VT3")
    right = first(found, "VT3", "right")
    print(f"  VT3 in a table sized to its text, beside prose: {paragraph(column(found, right[0][1] - 1)) if right else 'not found'}")
    print(f"  VT4 merged down 3 rows, beside 3 rows of a line: {rows(lines, 'VT4', 3)}")


def hide_mark_probes(lines):
    print("\n== HM: hideMark in an empty cell with a 28-point mark, beside a line (as tall as its text: 268.55)")
    for probe, note in [
        ("HM1", "with 100 above and below the cell's text"),
        ("HM2", "with 400 after the empty paragraph"),
        ("HM3", "a line of text before an empty paragraph"),
        ("HM4", "both cells empty, with hideMark"),
    ]:
        print(f"  {probe} {note}: the row is {row_height(lines, probe)} tall")


def conditional_probes(lines, sizes):
    print("\n== CF: the size of each cell's text, in points, from the part of the table style that applied:")
    print("   wholeTable 10, band1Vert 12, band2Vert 13, band1Horz 14, band2Horz 15, firstCol 16, lastCol 17, firstRow 18,")
    print("   lastRow 19, neCell 20, nwCell 21, seCell 22, swCell 23, none 11")
    for probe, count, note in [
        ("CF1", 5, "tblLook every part on"),
        ("CF2", 5, "no tblLook"),
        ("CF3", 5, "Word's default: the first row and column, and bands of rows"),
        ("CF4", 5, "every part off"),
        ("CF5", 5, "Word's default as w:val 04A0"),
        ("CF6", 6, "every part on, bands of 2 rows and 2 columns"),
    ]:
        print(f"  {probe} {note}:")
        for row in range(1, count + 1):
            print("      " + " ".join(f"{sizes.get(f'{probe} r{row}c{column}', '?'):>5}" for column in range(1, 6)))
    print(f"  CF7 a first row with 400 after:           {gaps(lines, 'CF7')}")
    print(f"  CF8 a first row with a 3-point bottom:    {rows(lines, 'CF8', 5)}")
    print(f"  CF9 a first row with 200 above and below: {rows(lines, 'CF9', 5)}")


def gaps(lines, probe):
    """The gaps between rows named `probe rNc1`"""
    tops = [top_of(lines, probe, f"r{n}c1") for n in range(1, 6)]
    above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
    if None in tops or above is None or below is None:
        return "not found"
    return f"from above {round(tops[0] - above, 1)}, then {', '.join(str(round(b - a, 1)) for a, b in zip(tops, tops[1:]))}, to below {round(below - tops[-1], 1)}"


def indent_probes(lines):
    print("\n== TI: indented tables")
    print(f"  TI1 sized to its text, indented -500: {paragraph(between(lines, 'TI1'))}")
    print(f"  TI2 100% of the width, indented 2000: {paragraph(between(lines, 'TI2'))}")
    found = between(lines, "TI3")
    right = first(found, "TI3", "right")
    print(f"  TI3 cells of 2000 and 2500 and a word 2894 wide, indented 4000:")
    if right is not None:
        print(f"      left:  {paragraph(column(found, 0, right[0][1] - 1))}")
        print(f"      right: {paragraph(column(found, right[0][1] - 1))}")
    print(f"  TI4 sized to its text, its style indented 2000: {paragraph(between(lines, 'TI4'))}")


def second_probes(base):
    lines = read(base)
    placed = placed_sizes_of(base)
    print("== MG: a row of a cell of a line with these margins, beside a cell of 2 lines (537.1 tall)")
    for probe, note in [("MG1", "300 above"), ("MG2", "300 below"), ("MG3", "200 above and below"), ("MG4", "hideMark, empty, 100 above and below")]:
        print(f"  {probe} {note}: the row is {row_height(lines, probe)} tall")
    print("\n== BS: each style of border as a table's top, inside and bottom borders, at half a point, then 3 points")
    styles = [
        "thick", "dotted", "dashed", "dotDash", "dotDotDash", "dashSmallGap", "thickThinSmallGap", "thinThickThinSmallGap",
        "thinThickMediumGap", "thickThinMediumGap", "thinThickThinMediumGap", "thinThickLargeGap", "thickThinLargeGap",
        "thinThickThinLargeGap", "wave", "doubleWave", "dashDotStroked", "threeDEmboss", "threeDEngrave", "outset", "inset",
    ]  # fmt: skip
    for index, name in enumerate([f"{style} 0.5" for style in styles] + [f"{style} 3" for style in styles], 1):
        probe = f"BS{index}"
        tops = [top_of(lines, probe, "row", str(n)) for n in range(1, 6)]
        above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
        if None in tops or above is None or below is None:
            print(f"  {probe:5} {name:26}: not found")
            continue
        print(f"  {probe:5} {name:26}: inside {round((tops[-1] - tops[0]) / 4 - LINE, 1):6}, top {round(tops[0] - above - LINE, 1):6}, bottom {round(below - tops[-1] - LINE, 1):6}")
    print("\n== BC: left and right borders beside text")
    print(f"  BC10 a cell's 6-point left and right borders, margins 30: {paragraph(between(lines, 'BC10'))}")
    found = between(lines, "BC11")
    right = first(found, "BC11", "right")
    if right is not None:
        print("  BC11 a 6-point border between two cells, no margins:")
        print(f"      left:  {paragraph(column(found, 0, right[0][1] - 1))}")
        print(f"      right: {paragraph(column(found, right[0][1] - 1))}")
    print("\n== VT: text that runs up a cell")
    print(f"  VT5 a row of only a cell of it, in 16 points: the row is {row_height(lines, 'VT5')} tall")
    print(f"  VT6 paragraphs of 11 and 20 points, beside a line: the row is {row_height(lines, 'VT6')} tall")
    print(f"  VT7 400 after its paragraph, beside a line: the row is {row_height(lines, 'VT7')} tall")
    print("\n== CF: the size of each cell's text, as in word-table-formats")
    for probe, note in [
        ("CF10", "first and last rows and columns, no corners, every part on"),
        ("CF11", "bands of rows, the first row on"),
        ("CF12", "bands of rows, the first row off"),
        ("CF13", "bands of rows and columns"),
        ("CF14", "bands of rows and columns, no tblLook"),
    ]:
        print(f"  {probe} {note}:")
        above, below = first(lines, probe, "above"), first(lines, probe, "below")
        cells = {} if above is None or below is None else {text: size for page, top, text, size in placed if page == above[0][0] and above[0][2] < top < below[0][2]}
        for row in range(1, 6):
            print("      " + " ".join(f"{cells.get(f'r{row}c{column}', '?'):>5}" for column in range(1, 6)))
    print("\n== CS: space between cells, 100")
    for probe, note in [("CS9", "columns of 2000 and 7026"), ("CS10", "no width of the table's own"), ("CS11", "3-point left, right and inside borders"), ("CS14", "laid out fixed")]:
        found = between(lines, probe)
        right = first(found, probe, "right")
        print(f"  {probe} {note}:")
        if right is not None:
            print(f"      left:  {paragraph(column(found, 0, right[0][1] - 1))}")
            print(f"      right: {paragraph(column(found, right[0][1] - 1))}")
    print(f"  CS13 the table's top and bottom 3 points, between rows half a point: {rows(lines, 'CS13', 5)}")
    for probe, note in [("CS12a", "50 to spare below the 6th row's text"), ("CS12b", "150 to spare")]:
        start = page_of(lines, probe, "top")
        on = [n for n in range(1, 11) if start is not None and page_of(lines, probe, "row", str(n)) == start]
        print(f"  {probe} {note}: rows on the first page: {on}")
    print("\n== KR8: rows whose second cell only is kept with the next, rows 1 to 4 fit")
    start = page_of(lines, "KR8", "top")
    on = [n for n in range(1, 11) if start is not None and page_of(lines, "KR8", "row", str(n)) == start]
    print(f"  rows on the first page: {on}")


def main(base):
    if base.endswith("word-table-formats2"):
        second_probes(base)
        return
    lines = read(base)
    border_probes(lines)
    conflict_probes(lines)
    spacing_probes(lines)
    border_break_probes(lines)
    kept_probes(lines)
    vertical_probes(lines)
    hide_mark_probes(lines)
    conditional_probes(lines, sizes_of(base))
    indent_probes(lines)


if __name__ == "__main__":
    main(sys.argv[1])
