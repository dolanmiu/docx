# Reads the probes of word-line-heights.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows.
#
#   python3 word-line-heights.py word-line-heights.html
#
# It also measures what the line heights of docx/layout were checked against before this probe:
#
#   python3 word-line-heights.py --pitch word-rules.html "P3 on 51 "      the lines starting so, on their first page
#   python3 word-line-heights.py --runs text-and-spacing.word.html        each run of evenly spaced lines of one size
#   python3 word-line-heights.py --rows tables-across-pages.word.html     the lines of each row's cells on each page
#
# Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so one gap between lines is only good to about 5 twips. The
# pitch of lines is found from all of their places on the grid: the range of heights that would put every line where it
# is, and the place of the first, which is narrow over a page of lines.
import html
import re
import sys
from collections import OrderedDict, defaultdict

GRID = 4.8


def read(path):
    """Each line of each page, as (page, top in twips, left in points, text)"""
    text = open(path).read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for x, y, words in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">(.*?)</line>', content, re.S):
            words = " ".join(html.unescape(word) for word in re.findall(r">([^<]*)</word>", words))
            found.append((page, float(y) * 20, float(x), words))
    return found


def pitch(tops):
    """The range of line heights, in twips, that puts lines at these tops on the grid. LibreOffice's PDFs aren't on it,
    and lines that aren't evenly spaced fit no height, so then it is the mean gap between them"""
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
    return (round(min(heights), 3), round(max(heights), 3)) if heights else f"about {round((tops[-1] - tops[0]) / (len(tops) - 1), 3)}"


def first_page(lines, prefix):
    """The lines starting with prefix on the page of the first of them"""
    starting = [line for line in lines if line[3].startswith(prefix)]
    return [line for line in starting if line[0] == starting[0][0]] if starting else []


def probes(lines):
    print("== H: the pitch of a page of lines, in twips")
    for probe in sorted({line[3].split(" ")[0] for line in lines if re.match(r"^H[a-z] ", line[3])}):
        page = first_page(lines, probe + " ")
        print(f"  {page[0][3].rsplit(' ', 1)[0]:40} {len(page)} lines: {pitch([line[1] for line in page])}")

    def count(probe, label):
        top = first_page(lines, f"{probe} top")[0][0]
        return sum(1 for line in lines if line[0] == top and re.match(rf"^{probe} {label} \d+$", line[3]))

    def page_of(text):
        top = first_page(lines, text.split(" ")[0] + " top")[0][0]
        return next(line[0] for line in lines if line[3] == text) - top + 1

    print("\n== T1: lines of the 6-line row on the first page, and the page of the row after it")
    for probe in ["T1a", "T1b", "T1c", "T1d", "T1e"]:
        print(f"  {probe}: {count(probe, 'line')} of 6, row 3 on page {page_of(probe + ' row 3')}")
    print("\n== T2: lines of the 4-line paragraph and of the 10 beside it on the first page")
    for probe in ["T2a", "T2b"]:
        print(f"  {probe}: {count(probe, 'left line')} of 4, {count(probe, 'right line')} of 10")
    print(f"  T2c: {count('T2c', 'line')} of 4, the line after it on page {page_of('T2c after')}")
    print("\n== T3: lines of the row of an at-least height on the first page")
    for probe, total in [("T3a", 10), ("T3b", 10), ("T3c", 8), ("T3d", 3)]:
        print(f"  {probe}: {count(probe, 'line')} of {total}, the cell beside them on page {page_of(probe + ' right')}")
    print("\n== T4: rows on the first page")
    for probe in ["T4a", "T4b"]:
        print(f"  {probe}: {count(probe, 'row')} of 8")


def runs(lines):
    """Each run of 5 or more lines one under the other with the same gap, to within the grid, and their pitch"""
    by_page = defaultdict(list)
    for line in lines:
        if not by_page[line[0]] or abs(by_page[line[0]][-1][1] - line[1]) > 0.1:
            by_page[line[0]].append(line)
    for page, found in by_page.items():
        run = found[:1]
        for line in found[1:] + [None]:
            gap = None if line is None or len(run) < 2 else line[1] - run[-1][1]
            if line is not None and (len(run) < 2 or abs(gap - (run[1][1] - run[0][1])) < GRID + 0.1):
                run.append(line)
                continue
            if len(run) >= 5:
                print(f"  page {page}, {len(run)} lines from {run[0][3][:40]!r}: {pitch([entry[1] for entry in run])}")
            run = [line] if line is not None else []


def rows(lines):
    """The lines of each row's two cells on each page, for rows that break, as in tables-across-pages: the rows are
    numbered in their first cell, and the second and third cells start right of 300 points"""
    found = OrderedDict()
    current = None
    for page, top, left, text in sorted(lines, key=lambda line: (line[0], round(line[1] / 40), line[2])):
        if text in ("Entry", "Found", "To do"):
            continue
        if left < 75:
            current = None
            continue
        number = re.match(r"^(\d+\.\d+)( .*)?$", text)
        if left < 100 and number:
            current = number.group(1)
            found.setdefault(current, defaultdict(lambda: [0, 0]))
            if not number.group(2):
                continue
            left = 147.6
        if current is not None:
            found[current][page][0 if left < 300 else 1] += 1
    for name, pages in found.items():
        if len(pages) > 1:
            print(name, " ".join(f"p{page}:{cells[0]},{cells[1]}" for page, cells in sorted(pages.items())))


if sys.argv[1] == "--pitch":
    page = first_page(read(sys.argv[2]), sys.argv[3])
    print(f"{len(page)} lines on page {page[0][0]}: {pitch([line[1] for line in page])}")
elif sys.argv[1] == "--runs":
    runs(read(sys.argv[2]))
elif sys.argv[1] == "--rows":
    rows(read(sys.argv[2]))
else:
    probes(read(sys.argv[1]))
