# cspell:ignore Donau
# Reads the probes of word-breaks-and-tabs.ts from a PDF of it, and prints what each shows.
#
#   pdftotext -bbox-layout word-breaks-and-tabs.pdf word-breaks-and-tabs.html
#   python3 word-breaks-and-tabs.py word-breaks-and-tabs.html
#
# Lengths are in twips, across from the left margin and down from the line above the probe. Word's PDFs put text on a
# grid of 1/300 inch, 4.8 twips, so one position is only good to about 5 twips.
import html
import re
import sys

LEFT = 1440


def read(path):
    """Each line, as a list of its words: (page, left, top, right, bottom, text), in twips. pdftotext's lines on the same
    page at the same height are one line, as it splits a line at a tab, and puts table cells side by side on one too"""
    text = open(path, encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if not words:
                continue
            same = next((other for other in found if other[0][0] == page and abs(other[0][2] - words[0][2]) < 20), None)
            if same is None:
                found.append(words)
            else:
                same.extend(words)
                same.sort(key=lambda word: word[1])
    return found


def text_of(line):
    return " ".join(word[5] for word in line)


def find(lines, *starts):
    """The index of the first line whose text starts with these words"""
    for index, line in enumerate(lines):
        if [word[5] for word in line[: len(starts)]] == list(starts):
            return index
    return None


def between(lines, probe):
    """The lines between a probe's line above and its line below, and the line above"""
    above, below = find(lines, probe, "above"), find(lines, probe, "below")
    if above is None or below is None:
        return None, []
    return lines[above], lines[above + 1 : below + 1]


def describe(line, above):
    """Where a line is: its top below the top of the line above, its left and right edges, its height, and its text"""
    top = round(line[0][2] - above[0][2], 1) if line[0][0] == above[0][0] else f"page {line[0][0]}"
    return f"{top:>8} | {round(line[0][1] - LEFT, 1):>7} to {round(line[-1][3] - LEFT, 1):>7} | tall {round(max(w[4] - w[2] for w in line), 1):>5} | {text_of(line)[:70]}"


def show(lines, probe, note):
    print(f"  {probe}: {note}")
    above, found = between(lines, probe)
    if above is None:
        print("    not found")
        return
    for line in found:
        print(f"    {describe(line, above)}")


def main(path):
    lines = read(path)

    print("== HM1: two paragraphs joined by a hidden mark, of different formatting (down | across | height | text)")
    for probe, note in [
        ("HM1a", "the first indented 1440"),
        ("HM1b", "the second indented 1440"),
        ("HM1c", "the first centred"),
        ("HM1d", "the second centred"),
        ("HM1e", "the first with 480 before and after"),
        ("HM1f", "the second with 480 before and after"),
        ("HM1g", "the first in a style of 16 points with 240 before"),
        ("HM1h", "the first double spaced"),
        ("HM1i", "the second double spaced"),
    ]:
        show(lines, probe, note)

    print("\n== HM2: a hidden mark before a table, and at the end of a table cell")
    show(lines, "HM2a", "before a table")
    show(lines, "HM2b", "rows: a cell of one paragraph with a hidden mark; a cell whose last paragraph's mark is hidden")

    print("\n== HM3: hidden paragraphs (a line is 268.55: the line below at 268.55 means the paragraph took no room)")
    for probe, note in [
        ("HM3a", "text and mark hidden"),
        ("HM3b", "empty, mark hidden"),
        ("HM3c", "of a hidden style"),
        ("HM3d", "text hidden, mark not"),
        ("HM3e", "empty, mark hidden, 480 before and after"),
    ]:
        show(lines, probe, note)

    print("\n== HM4 to HM7")
    show(lines, "HM4", "numbered, the first's mark hidden")
    show(lines, "HM5a", "specVanish alone")
    show(lines, "HM5b", "vanish and specVanish")
    show(lines, "HM6", "three paragraphs, two hidden marks")
    show(lines, "HM7", "a hidden mark in a cell of a table sized to its text")

    print("\n== SH1: justified lines whose last word fits only squeezed by this share of its spaces, or broken at a soft hyphen")
    print("== SH2: lines whose last word's first part ends this many twips short of the end of the line")
    for index, line in enumerate(lines):
        if line[0][5] in ("SH1a", "SH1b", "SH1c", "SH1d", "SH1e", "SH1f", "SH2") and len(line) > 1 and line[1][5] != "hyphen":
            print(f"  {line[0][5]} {line[1][5]:>3}: the line ends with {line[-1][5]!r} at {round(line[-1][3] - LEFT, 1)}; the next starts with {lines[index + 1][0][5]!r}")

    print("\n== SH3: a long word in a column of a table sized to its text, with soft hyphens (a) and without (b)")
    for probe in ["SH3a", "SH3b"]:
        start = find(lines, probe, "above")
        if start is not None:
            for line in lines[start + 1 : start + 3]:
                print(f"    {probe}: " + ", ".join(f"{w[5][:24]!r} {round(w[1] - LEFT, 1)} to {round(w[3] - LEFT, 1)}" for w in line[:3]))
    print("\n== SH4: a word with soft hyphens longer than a line")
    start = find(lines, "SH4")
    if start is not None:
        for line in lines[start : start + 4]:
            if line is not lines[start] and line[0][5].startswith("DT"):
                break
            print(f"    ends at {round(line[-1][3] - LEFT, 1)}: ...{text_of(line)[-40:]}")

    print("\n== DT: text at a decimal tab at 4000 (from | to, of each word after the label)")
    for line in lines:
        if re.fullmatch(r"DT\d+", line[0][5]):
            words = ", ".join(f"{w[5]!r} {round(w[1] - LEFT, 1)} to {round(w[3] - LEFT, 1)}" for w in line[1:])
            print(f"  {line[0][5]:5}: {words}")

    print("\n== TP: tabs past the margin at 9026")
    for label in ["TP1", "TP2", "TP3", "TP4", "TP5", "TP6", "TP7", "TP9"]:
        index = next((i for i, line in enumerate(lines) if any(word[5] == label for word in line)), None)
        if index is None:
            print(f"  {label}: not found")
            continue
        for line in lines[index : index + 2]:
            print(f"  {label}: {round(line[0][1] - LEFT, 1):>7} to {round(line[-1][3] - LEFT, 1):>7} | {text_of(line)[:60]}")


if __name__ == "__main__":
    main(sys.argv[1])
