# Reads the probes of word-units.ts and word-units2.ts from pdftotext -bbox-layout's HTML of a PDF of either, and prints
# what each shows.
#
#   python3 word-units.py word-units.html
#   python3 word-units.py word-units2.html
#
# Lengths are in twips. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so a line's place is good to about 5
# twips, and the pitch of lines is found over a page of them, as word-line-heights.py finds it.
import html
import re
import sys

GRID = 4.8


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


def read_words(path):
    """Each line's words, as (text of the line, [(left, right, word)]), in twips"""
    text = open(path).read()
    found = []
    for content in re.findall(r"<line .*?</line>", text, re.S):
        words = [
            (float(x) * 20, float(right) * 20, html.unescape(word))
            for x, right, word in re.findall(r'<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', content)
        ]
        found.append((" ".join(word for _, _, word in words), words))
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


def first_page(lines, pattern):
    """The lines matching pattern on the page of the first of them"""
    matching = [line for line in lines if re.match(pattern, line[4])]
    return [line for line in matching if line[0] == matching[0][0]] if matching else []


def line(lines, text):
    return next(found for found in lines if found[4] == text or found[4].startswith(text + " "))


def probes(lines):
    print("== U1: a page of 8.5 by 11 inches, margins of 1 inch, 1.5 on the left, the header half an inch down")
    page = first_page(lines, r"^U1 \d+$")
    print(f"  {len(page)} lines on the first page, the first at {page[0][1]:.1f} down and {page[0][2]:.1f} across")
    print(f"  U1 right ends {line(lines, 'U1 right')[3]:.1f} across; U1 header is {line(lines, 'U1 header')[1]:.1f} down")

    print("\n== U2: the pitch of a page of lines of 12 points, as \"12pt\" (a) and 24 half-points (b)")
    for probe in ["U2a", "U2b"]:
        page = first_page(lines, rf"^{probe} \d+$")
        print(f"  {probe}: {len(page)} lines, pitch {pitch([found[1] for found in page])}")

    print("\n== U3: indents in units (a) and in twips (b): where each line starts, and where the right-aligned one ends")
    for probe in ["U3a", "U3b"]:
        hanging = line(lines, f"{probe} hanging")
        following = lines[lines.index(hanging) + 1]
        print(
            f"  {probe}: hanging first line {hanging[2]:.1f}, next {following[2]:.1f}; "
            f"right ends {line(lines, probe + ' right')[3]:.1f}; first line {line(lines, probe + ' first line')[2]:.1f}"
        )

    print("\n== U4: where 20 letters spaced 2 points apart, and the word after them, end: \"2pt\" (a) and 40 twips (b)")
    for probe in ["U4a", "U4b"]:
        print(f"  {probe}: {line(lines, probe)[3]:.1f}")

    print("\n== U5: a table's widths and row height in units (a) and twips (b): where cell B starts, and the line after")
    for probe in ["U5a", "U5b"]:
        cell = line(lines, f"{probe} cell B")
        after = line(lines, f"{probe} after")
        print(f"  {probe}: cell B {cell[2]:.1f} across, the line after {after[1] - cell[1]:.1f} below it")

    print("\n== U6: where the lines of 2 columns an inch apart start")
    page = first_page(lines, r"^U6 ")
    print(f"  {sorted({round(found[2], 1) for found in page})}")

    print("\n== U7: lines on the first page, with the bottom margin at 4800 (a), 4801 (b), 4800.4 (c, e) and 4800.6 (d, f)")
    for probe in ["U7a", "U7b", "U7c", "U7d", "U7e", "U7f"]:
        print(f"  {probe}: {len(first_page(lines, rf'^{probe} \d+$'))}")

    print("\n== U8: the pitch of a page of lines of 11.2 (a), 11.25 (b), 11.3 (c), 11 (d) and 11.5 points (e)")
    for probe in ["U8a", "U8b", "U8c", "U8d", "U8e"]:
        page = first_page(lines, rf"^{probe} \d+$")
        print(f"  {probe}: {len(page)} lines, pitch {pitch([found[1] for found in page])}")


def probes2(lines, words):
    """word-units2: each length as Word read it, from where its text is across the page, against a length in numbers"""

    def across(prefix, reference):
        found = [(text, left) for _, _, left, _, text in lines if text.startswith(prefix + " ")]
        start = next(left for text, left in found if text == f"{prefix} {reference}")
        return [(text.split(" ")[1], round(left - start + reference, 2)) for text, left in found]

    print("== V1: left indents, in twips, from where each line starts")
    for length, twips in across("V1", 4800):
        print(f"  {length:>12}: {twips}")
    print("\n== V2: a page's left margin, in twips")
    for length, twips in across("V2", 1440):
        print(f"  {length:>12}: {twips}")

    print("\n== V3: the size of 20 letters, in points, from their width against those at 11 points")
    # Letters larger than the line's text are a line of their own in pdftotext's output, so they are the next word of x's
    flat = [word for _, found in words for word in found]
    runs = {}
    for index, (_, _, word) in enumerate(flat):
        if word == "V3":
            left, right, _ = next(found for found in flat[index + 2 :] if re.fullmatch(r"x+", found[2]))
            runs[flat[index + 1][2]] = right - left
    for length, width in runs.items():
        print(f"  {length:>12}: {round(width / runs['22'] * 11, 3)}")

    print("\n== V4: character spacing, in twips, from the step between letters against that of 40 twips")
    steps = {}
    for text, found in words:
        if text.startswith("V4 "):
            letters = [left for left, _, word in found if word == "x"]
            steps[text.split(" ")[1]] = (letters[-1] - letters[0]) / (len(letters) - 1)
    for length, step in steps.items():
        print(f"  {length:>12}: {round(step - steps['40'] + 40, 2)}")

    print("\n== V5: a table's first column, in twips, from where the cell after it starts")
    cells = [left for _, _, left, _, text in lines if text == "V5 cell B"]
    for length, left in zip(["1440", "72.7pt", "1.000417in"], cells):
        print(f"  {length:>12}: {round(left - cells[0] + 1440, 2)}")

    print("\n== V6: a row at least this tall, in twips, from the line after the table, to about 5 twips")
    rows = [top for _, top, _, _, text in lines if text.startswith("V6 ") and text != "V6 gap" and text != "V6 after"]
    after = [top for _, top, _, _, text in lines if text == "V6 after"]
    for length, top, below in zip(["720", "36.7pt"], rows, after):
        print(f"  {length:>12}: {round(below - top - (after[0] - rows[0]) + 720, 1)}")


lines = read(sys.argv[1])
if any(line[4].startswith("V1 ") for line in lines):
    probes2(lines, read_words(sys.argv[1]))
else:
    probes(lines)
