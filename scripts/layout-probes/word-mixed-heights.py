# Reads the probes of word-mixed-heights.ts from a PDF of it, and prints the height of each probe's lines.
#
#   pdftotext -bbox-layout word-mixed-heights.pdf word-mixed-heights.html
#   python3 word-mixed-heights.py word-mixed-heights.html
#
# Lengths are in twips. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so one position is only good to about 5
# twips; the pitch of lines is found over a page of them, as word-line-heights.py finds it. Beside each probe are the
# heights each way Word might work it out gives, from the fonts' ascents and descents (thousandths of an em, from the
# fonts' tables, with the line gap above the text, as Word puts it).
# cspell:ignore bbox
import html
import re
import sys

GRID = 4.8

# Ascent with the line gap above it, and descent, in units of 2048 to the em
FONTS = {
    "Calibri": (1950, 550),
    "Courier New": (1705, 615),
    "Arial": (1854 + 67, 434),
    "Times New Roman": (1825 + 87, 443),
}


def metrics(font, points):
    """A font's ascent and descent at a size, in twips"""
    ascent, descent = FONTS[font]
    return ascent / 2048 * points * 20, descent / 2048 * points * 20


def line(*fonts):
    """The height of a line of these fonts (name, points): the tallest ascent and the deepest descent"""
    sizes = [metrics(font, points) for font, points in fonts]
    return max(ascent for ascent, _ in sizes) + max(descent for _, descent in sizes)


def tallest(*fonts):
    """The tallest of these fonts' own lines"""
    return max(line(font) for font in fonts)


def read(path):
    """Each line pdftotext found, as a list of its words: (page, left, top, right, bottom, text), in twips"""
    text = open(path, encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for row in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', row)
            ]
            if words:
                found.append(words)
    return found


def pitch(tops):
    """The range of line heights that puts lines at these tops on the grid, or the mean gap where none does, as LibreOffice's
    PDFs aren't on the grid"""
    if len(tops) < 2:
        return "-"
    mean = f"about {round((tops[-1] - tops[0]) / (len(tops) - 1), 2)}"
    if any(abs((top - tops[0]) / GRID - round((top - tops[0]) / GRID)) > 0.01 for top in tops):
        return mean
    places = [round((top - tops[0]) / GRID) for top in tops]
    heights = []
    height = 100.0
    while height < 2000:
        low, high = -0.5, 0.5
        for index, place in enumerate(places):
            low = max(low, place - 0.5 - index * height / GRID)
            high = min(high, place + 0.5 - index * height / GRID)
            if low >= high:
                break
        if low < high:
            heights.append(height)
        height += 0.005
    return f"{round(min(heights), 2)} to {round(max(heights), 2)}" if heights else mean


def tops_of(lines, probe):
    """The tops of a page probe's numbered lines on its first page"""
    numbered = [row for row in lines if row[0][5] == probe and len(row) > 1 and row[1][5].isdigit()]
    if not numbered:
        return []
    return [row[0][2] for row in numbered if row[0][0] == numbered[0][0][0]]


def page_probe(lines, probe, less=0.0):
    """The number of a page probe's lines on its first page, and their pitch, less a line of known height between them"""
    tops = tops_of(lines, probe)
    if not tops:
        return "not found"
    found = pitch(tops)
    if less and " to " in found:
        low, high = (float(value) - less for value in found.split(" to "))
        found = f"{round(low, 2)} to {round(high, 2)} (less the line of Calibri between)"
    elif less and found.startswith("about "):
        found = f"about {round(float(found[6:]) - less, 2)} (less the line of Calibri between)"
    return f"{len(tops)} on the page, pitch {found}"


def guesses(*values):
    return "; ".join(f"{name} {round(value, 2)}" for name, value in values)


def main(path):
    lines = read(path)
    calibri = line(("Calibri", 11))
    both = line(("Calibri", 11), ("Courier New", 11))

    print("== MH1: Calibri 11 with Courier New 11 (single: 275.53)")
    for probe, lines_of in [("MH1a", 1.15), ("MH1b", 1.5), ("MH1c", 2), ("MH1d", 0.8)]:
        print(f"  {probe} at {lines_of} lines: {page_probe(lines, probe)}")
        print(f"       {guesses(('both lines', lines_of * both), ('both and the extra of Calibri', both + (lines_of - 1) * calibri))}")
    print(f"  MH1e at least 13.5 points: {page_probe(lines, 'MH1e')}")
    print(f"       {guesses(('the line of both', both), ('the taller font', max(calibri, 270)))}")

    print("\n== MH2: fonts with a line gap, which Word puts above the text")
    print(f"  MH2a Arial 11 with Courier New 11: {page_probe(lines, 'MH2a')}")
    arial = metrics("Arial", 11)
    courier = metrics("Courier New", 11)
    print(f"       {guesses(('gap above', line(('Arial', 11), ('Courier New', 11))), ('gap left out', max(arial[0] - 67 / 2048 * 220 + courier[1], tallest(('Arial', 11), ('Courier New', 11)))))}")
    print(f"  MH2b Times New Roman 20 with Courier New 20: {page_probe(lines, 'MH2b')}")
    times = metrics("Times New Roman", 20)
    courier20 = metrics("Courier New", 20)
    print(f"       {guesses(('gap above', line(('Times New Roman', 20), ('Courier New', 20))), ('gap left out', max(times[0] - 87 / 2048 * 400 + courier20[1], tallest(('Times New Roman', 20), ('Courier New', 20)))))}")
    print(f"  MH2c Times New Roman 10 with Courier New 10 at 1.5 lines: {page_probe(lines, 'MH2c')}")
    print(f"       {guesses(('1.5 of the line of both', 1.5 * line(('Times New Roman', 10), ('Courier New', 10))))}")

    print("\n== MH3: a 30-point picture alone in its paragraph (single spaced: about 600, word-watertight-text TX8a)")
    for probe, lines_of, note in [("MH3a", 1.15, ""), ("MH3b", 1.5, ""), ("MH3c", 0.8, ""), ("MH3d", 1.5, ", mark in Times New Roman 10"), ("MH3e", 1, "")]:
        print(f"  {probe} at {lines_of} lines{note}: {page_probe(lines, probe, calibri)}")
        mark = line(("Times New Roman", 10)) if note else calibri
        print(f"       {guesses(('the picture', 600), ('the extra of its mark', 600 + (lines_of - 1) * mark), ('the picture spaced', 600 * lines_of))}")

    print("\n== MH4: a 30-point picture beside text")
    descent = metrics("Calibri", 11)[1]
    for probe, lines_of, text, note in [
        ("MH4a", 0.8, calibri, "beside Calibri 11"),
        ("MH4b", 1.5, both, "beside Calibri 11 and Courier New 11"),
        ("MH4c", 1.5, line(("Times New Roman", 10)), "beside Times New Roman 10"),
        ("MH4d", 1.5, calibri, "beside Calibri 11"),
        ("MH4e", 1.5, line(("Calibri", 8)), "beside Calibri 8, mark Calibri 11"),
    ]:
        print(f"  {probe} at {lines_of} lines, {note}: {page_probe(lines, probe)}")
        depth = metrics("Courier New", 11)[1] if probe == "MH4b" else metrics("Times New Roman", 10)[1] if probe == "MH4c" else metrics("Calibri", 8)[1] if probe == "MH4e" else descent
        print(f"       {guesses(('the extra of the text', 600 + depth + (lines_of - 1) * text), ('the extra of the mark', 600 + depth + (lines_of - 1) * calibri))}")

    print("\n== MH5: a 30-point picture beside 12-point text: the line is 600 and the font's descent")
    groups = {}
    for row in lines:
        match = re.match(r"^(\d+)-(\d+)$", row[1][5]) if row[0][5] == "MH5" and len(row) > 1 else None
        if match:
            groups.setdefault(int(match.group(1)), []).append(row)
    for number, rows in sorted(groups.items()):
        # The font's name, before its ideographs or Hangul
        name = " ".join(word[5] for word in rows[0][2:] if word[5].isascii())
        on_page = [row for row in rows if row[0][0] == rows[0][0][0]]
        tops = [row[0][2] for row in on_page]
        found = pitch(tops)
        if " to " in found:
            low, high = (float(value) - 600 for value in found.split(" to "))
            descent_of = f"descent {round(low, 2)} to {round(high, 2)} at 12 points, {round(low / 240 * 1000, 1)} to {round(high / 240 * 1000, 1)} thousandths"
        else:
            descent_of = f"pitch {found}"
        print(f"  MH5 {number:2} {name[:24]:24} {len(on_page)} lines: {descent_of}")

    print("\n== MH6: East Asian fonts beside Latin ones")
    for probe, note in [
        ("MH6a", "MS Mincho 12 with Courier New 12"),
        ("MH6b", "MS Mincho 10.5 with Times New Roman 12"),
        ("MH6c", "Yu Mincho 10.5 with Calibri 10.5"),
        ("MH6d", "MS Mincho 12 with Calibri 16"),
    ]:
        print(f"  {probe} {note}: {page_probe(lines, probe)}")

    print("\n== MH7: a picture alone in its paragraph, shorter than its mark's line (268.55)")
    for probe, points in [("MH7a", 6), ("MH7b", 12)]:
        print(f"  {probe} {points} points: {page_probe(lines, probe, calibri)}")
        print(f"       {guesses(('the picture', points * 20), ('the mark', calibri))}")


if __name__ == "__main__":
    main(sys.argv[1])
