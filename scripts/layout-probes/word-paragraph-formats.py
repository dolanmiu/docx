# Reads the probes of word-paragraph-formats.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each
# shows.
#
#   python3 word-paragraph-formats.py word-paragraph-formats.html
#
# Lengths are in twips. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so a line's place is good to about 5
# twips. Calibri 11's lines are 268.55 twips, and the top of the first on a page is 1441 twips down. A thin border is 15
# twips wide and 20 from the text, so 35 with its space.
import html
import re
import sys

GRID = 4.8
LINE = 268.55
FIRST = 1441.0


def read(path):
    """Each line of each page, as (page, top, left, right, text), in twips"""
    text = open(path).read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for x, y, right, words in re.findall(
            r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">(.*?)</line>', content, re.S
        ):
            words = " ".join(html.unescape(word) for word in re.findall(r">([^<]*)</word>", words))
            found.append((page, float(y) * 20, float(x) * 20, float(right) * 20, words))
    return found


def pitch(tops):
    """The range of line heights that puts lines at these tops on the grid, or the mean gap off it, as LibreOffice's are"""
    if any(abs((top - tops[0]) / GRID - round((top - tops[0]) / GRID)) > 0.01 for top in tops):
        return f"about {round((tops[-1] - tops[0]) / (len(tops) - 1), 3)}"
    places = [round((top - tops[0]) / GRID) for top in tops]
    heights = []
    height = 100.0
    while height < 1000:
        low, high = -0.5, 0.5
        for index, place in enumerate(places):
            low = max(low, place - 0.5 - index * height / GRID)
            high = min(high, place + 0.5 - index * height / GRID)
            if low >= high:
                break
        if low < high:
            heights.append(height)
        height += 0.0005
    return f"{round(min(heights), 3)} to {round(max(heights), 3)}" if heights else f"about {round((tops[-1] - tops[0]) / (len(tops) - 1), 3)}"


def index_of(lines, text):
    """The first line that starts with this text, after a list's number or bullet if it has one"""
    pattern = re.compile(rf"^(?:\S{{1,3}} )?{re.escape(text)}(?: |$)")
    return next(index for index, found in enumerate(lines) if pattern.match(found[4]))


def line(lines, text):
    return lines[index_of(lines, text)]


def gap(lines, above, below):
    """How far below the top of one line the top of another is, or where each is when they are on different pages"""
    first, second = line(lines, above), line(lines, below)
    if first[0] != second[0]:
        return f"on pages {first[0]} and {second[0]}"
    return f"{second[1] - first[1]:.1f}"


def where(lines, text):
    """The page a line is on, and how far below the top of a page's first line it is"""
    found = line(lines, text)
    return f"page {found[0]}, {found[1] - FIRST:.1f} below the top"


def paragraph(lines, text):
    """The lines of a paragraph: the one starting with its text, and those after it on its page up to the next probe's"""
    start = index_of(lines, text)
    end = next(
        (index for index in range(start + 1, len(lines)) if re.match(r"[A-Z]\d+t? ", lines[index][4]) or lines[index][0] != lines[start][0]),
        len(lines),
    )
    return lines[start:end]


def probes(lines):
    print("== A0: automatic space before the document's first paragraph (280 with it, 0 without)")
    print(f"  A0 first: {where(lines, 'A0 first')}; A0 second {gap(lines, 'A0 first', 'A0 second')} below it")

    print("\n== B1: the space next to a border. The larger of the two outside the border: 703.55; both, a side each: 903.55")
    for probe, above, below in [
        ("B1a", "B1a bordered", "B1a next"),
        ("B1b", "B1b bordered", "B1b next"),
        ("B1c", "B1c above", "B1c bordered"),
        ("B1d", "B1d above", "B1d bordered"),
    ]:
        print(f"  {probe}: {below} {gap(lines, above, below)} below {above}")
    print(f"  B1 start to B1a bordered {gap(lines, 'B1 start', 'B1a bordered')}, B1d bordered to B1 end {gap(lines, 'B1d bordered', 'B1 end')}")

    print("\n== B2: five paragraphs with the same borders, 100 before and 200 after, without (a) and with (b) a between border")
    for probe, above, below in [("B2a", "B2 above", "B2 middle"), ("B2b", "B2 middle", "B2 below")]:
        inside = [gap(lines, f"{probe} {n}", f"{probe} {n + 1}") for n in range(1, 5)]
        print(
            f"  {probe}: {above} to the first {gap(lines, above, f'{probe} 1')}, between them {inside}, "
            f"the last to {below} {gap(lines, f'{probe} 5', below)}"
        )

    print("\n== B3: a top border and 400 before, at the top of a page it flows onto (35: the border, 435: both, 0: neither)")
    print(f"  B3 bordered: {where(lines, 'B3 bordered')}; B3 after {gap(lines, 'B3 bordered', 'B3 after')} below it")

    print("\n== B4: a line that fits at the bottom of a page, but not with its border below")
    print(f"  B4a fill 50: {where(lines, 'B4a fill 50')}")
    print(f"  B4a bordered: {where(lines, 'B4a bordered')}; B4a after: {where(lines, 'B4a after')}")
    print(f"  B4b fill 50: {where(lines, 'B4b fill 50')}")
    print(f"  B4b first: {where(lines, 'B4b first')}; B4b second: {where(lines, 'B4b second')}; B4b after: {where(lines, 'B4b after')}")

    print("\n== B5: two paragraphs with the same borders and something else different (one box: 268.55, two: 338.55)")
    for probe, what in [
        ("B5a", "left indent 0 and 720"),
        ("B5b", "right indent 0 and 720"),
        ("B5c", "first line indent 0 and 720"),
        ("B5d", "100 after the first (one box: 368.55, two: 438.55)"),
        ("B5e", "black and red"),
        ("B5f", "a between border on the second"),
        ("B5g", "a left border on the second"),
        ("B5h", "left-aligned and centred"),
        ("B5z", "both indented 720"),
    ]:
        print(f"  {probe} {what}: {gap(lines, f'{probe} 1', f'{probe} 2')}")

    print("\n== B6: the room each style's top and bottom borders take, 0 points from the text, by the gaps around the box")
    names = sorted({re.match(r"B6 (\S+ \d+) ", text).group(1) for _, _, _, _, text in lines if text.startswith("B6 ")}, key=lambda name: (name.split()[0], int(name.split()[1])))
    for name in names:
        above = []
        below = []
        for n in [1, 2, 3]:
            plain, box = line(lines, f"B6 {name} plain {n}"), line(lines, f"B6 {name} box {n}")
            if plain[0] == box[0]:
                above.append(box[1] - plain[1] - LINE)
            if n < 3:
                after = line(lines, f"B6 {name} plain {n + 1}")
                if after[0] == box[0]:
                    below.append(after[1] - box[1] - LINE)
        mean = lambda values: f"{sum(values) / len(values):.1f}" if values else "?"
        print(f"  {name:28}: top {mean(above):>6} {[round(value, 1) for value in above]}, bottom {mean(below):>6} {[round(value, 1) for value in below]}")

    print("\n== B7: a paragraph of 12 lines with top and bottom borders, across a page (0 at the top of the next: no border there)")
    first = [found for found in lines if found[4].startswith("B7 line ")]
    pages = sorted({found[0] for found in first})
    for page in pages:
        on = [found for found in first if found[0] == page]
        print(f"  page {page}: {on[0][4]} to {on[-1][4]}, the first {on[0][1] - FIRST:.1f} below the top")
    print(f"  B7 after: {gap(lines, 'B7 line 12', 'B7 after')} below B7 line 12")

    print("\n== B8: a paragraph with top and bottom borders in a table cell (303.55 each with them)")
    print(f"  B8 above to cell {gap(lines, 'B8 above', 'B8 cell')}, cell to below {gap(lines, 'B8 cell', 'B8 below')}")

    print("\n== B9: contextual spacing and borders")
    print(f"  B9a, the same borders: start to 1 {gap(lines, 'B9 start', 'B9a 1')}, 1 to 2 {gap(lines, 'B9a 1', 'B9a 2')}, 2 to middle {gap(lines, 'B9a 2', 'B9 middle')}")
    print(f"  B9b, a bottom border on the first: 1 to 2 {gap(lines, 'B9b 1', 'B9b 2')}")

    print("\n== B10: paragraphs exactly 12 points apart, the middle one with top and bottom borders (275 each with them)")
    print(f"  B10 above to box {gap(lines, 'B10 above', 'B10 box')}, box to below {gap(lines, 'B10 box', 'B10 below')}")

    print("\n== A1, A2: automatic spacing in a bulleted list, and with contextual spacing (548.55 with 280, 268.55 without)")
    print(f"  A1: above to item 1 {gap(lines, 'A1 above', 'A1 item 1')}, " + ", ".join(gap(lines, f"A1 item {n}", f"A1 item {n + 1}") for n in [1, 2, 3]) + f", item 4 to below {gap(lines, 'A1 item 4', 'A1 below')}")
    print(f"  A1b: a bulleted paragraph to a numbered one {gap(lines, 'A1b bullet', 'A1b number')}, to below {gap(lines, 'A1b number', 'A1b below')}")
    print(f"  A2: above to 1 {gap(lines, 'A2 above', 'A2 1')}, 1 to 2 {gap(lines, 'A2 1', 'A2 2')}, 2 to 3 {gap(lines, 'A2 2', 'A2 3')}, 3 to below {gap(lines, 'A2 3', 'A2 below')}")

    print("\n== A4 to A6: automatic spacing next to a table, with space of its own, and against the next paragraph's")
    for above, below in [
        ("A4 above", "A4 before table"),
        ("A4 before table", "A4 cell"),
        ("A4 cell", "A4 after table"),
        ("A4 after table", "A5 above"),
        ("A5 above", "A5 auto600"),
        ("A5 auto600", "A5 after600"),
        ("A5 after600", "A5 next"),
        ("A6 first", "A6 second"),
        ("A6 second", "A6 end"),
    ]:
        print(f"  {above} to {below}: {gap(lines, above, below)}")

    print("\n== A7: automatic spacing in a footnote")
    print(f"  A7 note 1 to A7 note 2: {gap(lines, 'A7 note 1', 'A7 note 2')}; A7 note 1: {where(lines, 'A7 note 1')}")

    print("\n== A8: automatic space before a paragraph with a page break before it (280 with it, 0 without)")
    print(f"  A8 broken: {where(lines, 'A8 broken')}")

    print("\n== C1 to C16: indents in characters. A character is 220 at 11 points, 400 at 20 and 200 in Times New Roman 10")
    for probe, what in [
        ("C1", "leftChars 400"),
        ("C2", "rightChars 400"),
        ("C2t", "right 880"),
        ("C3", "hangingChars 200"),
        ("C4", "left 720, firstLineChars 200"),
        ("C5", "firstLineChars 200, its first word 20 points"),
        ("C6", "firstLineChars 200, its fifth word 20 points"),
        ("C7", "left 720, leftChars 0"),
        ("C8", "leftChars 400, firstLineChars 200"),
        ("C9", "left 1440, hangingChars 200"),
        ("C10", "firstLine 720, firstLineChars 0"),
        ("C11", "leftChars 400, hangingChars 200, at 20 points"),
        ("C12", "firstLineChars 200, its mark 20 points and its text 11"),
        ("C13", "firstLineChars 200, Times New Roman 10"),
        ("C14", "left 720, hanging 360, leftChars 400, hangingChars 200"),
        ("C15", "startChars 400"),
        ("C16", "right 720, rightChars 400"),
        ("C16t", "right 720"),
    ]:
        found = paragraph(lines, probe)
        starts = [round(left - 1440, 1) for _, _, left, _, _ in found]
        ends = [text.split()[-1] for _, _, _, _, text in found]
        rights = [round(right - 1440, 1) for _, _, _, right, _ in found]
        print(f"  {probe:4} {what:52}: {len(found)} lines, the first at {starts[0]}, the next at {starts[1] if len(starts) > 1 else '-'}; ending {' | '.join(ends)}; right edges {rights[:-1]}")

    print("\n== L1: 20-point paragraphs with half a line before each (a 20-point line and 120: 608.3)")
    page = [found for found in lines if re.match(r"^L1 \d+$", found[4])]
    page = [found for found in page if found[0] == page[0][0]]
    print(f"  {len(page)} lines on the page, pitch {pitch([found[1] for found in page])}")

    print("\n== L2, L3: a line before with 600 twips before too; a line after with automatic space after too")
    print(f"  L2 above to L2 lines {gap(lines, 'L2 above', 'L2 lines')} (240 + 268.55: 508.55; 600: 868.55)")
    print(f"  L3 lines to L3 below {gap(lines, 'L3 lines', 'L3 below')} (240: 508.55; 280: 548.55)")

    print("\n== A3: a header of two paragraphs with automatic space before and after, 708 from the top of the page")
    header = [found for found in lines if found[4].startswith("A3 header")]
    print("  " + ", ".join(f"{text} {top:.1f} down" for _, top, _, _, text in header[:2]) + f"; A3 body {line(lines, 'A3 body')[1]:.1f} down")


if __name__ == "__main__":
    probes(read(sys.argv[1]))
