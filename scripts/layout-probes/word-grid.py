# Reads the probes of word-grid.ts from a PDF of word-grid.docx or word-grid2.docx, or those of word-grid3.ts from a PDF of
# word-grid3.docx, and prints what each shows.
#
#   pdftotext -bbox-layout word-grid.pdf word-grid.html
#   python3 word-grid.py word-grid.html
#
# Lengths are in twips, and the tops of lines are the tops of their words' boxes, which pdftotext takes from each font's
# ascent, so lines of one font and size can be read against each other, and lines of others only by how far apart the
# lines around them are. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so one position is only good to about 5
# twips. Most probes are on a grid of 360 twips, and the text starts 1440 down the page.
# cspell:ignore bbox
import html
import re
import sys
from collections import defaultdict

GRID = 360
TOP = 1440


def read(path):
    """Each line pdftotext found, as (page, left, top, right, bottom, text, words), in twips, with each word as (left, right,
    text)"""
    text = open(path, encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for row in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', row)
            ]
            if words:
                found.append(
                    (
                        page,
                        min(w[0] for w in words),
                        min(w[1] for w in words),
                        max(w[2] for w in words),
                        max(w[3] for w in words),
                        " ".join(w[4] for w in words),
                        [(w[0], w[2], w[4]) for w in words],
                    )
                )
    return found


def grids(span, pitch=GRID):
    """A distance in lines of the grid"""
    return f"{span / pitch:.2f}"


def ramps(lines):
    """G1: the line of each font and size, between lines of Times New Roman 8: how far apart the lines around it are, the
    lines of the grid it takes when Times New Roman 8 takes one, and where its box is from the top of the line before"""
    by_name = defaultdict(list)
    for line in lines:
        match = re.match(r"(G1[a-g]) (r?)([\d.]+)\b", line[5])
        if match:
            by_name[match.group(1)].append((match.group(2) == "r", float(match.group(3)), line))
    for name, rows in sorted(by_name.items()):
        print(f"{name}: size, lines of the grid it takes, the top and bottom of its box from the top of the line before")
        changes = []
        previous = None
        for index, (is_ref, size, line) in enumerate(rows):
            if is_ref or index + 1 >= len(rows) or not rows[index - 1][0]:
                continue
            before = rows[index - 1][2]
            after = rows[index + 1][2]
            if before[0] != after[0]:
                print(f"  {size}: across a page")
                continue
            taken = (after[2] - before[2]) / GRID - 1
            print(f"  {size}: {taken:.2f}  box {line[2] - before[2]:.0f} to {line[4] - before[2]:.0f}")
            rounded = round(taken)
            if previous is not None and rounded != previous[1]:
                changes.append(f"{previous[0]} -> {size}: {previous[1]} -> {rounded}")
            previous = (size, rounded)
        print(f"  changes: {'; '.join(changes)}")


def named(lines, pattern):
    """The lines whose text matches a pattern, in order"""
    return [line for line in lines if re.match(pattern, line[5])]


def pitches(lines, name, pitch=GRID):
    """The tops of a probe's lines from the first, and how far apart they are"""
    found = named(lines, rf"{re.escape(name)} \d+\b")
    if not found:
        print(f"{name}: not found")
        return
    tops = [line[2] for line in found]
    gaps = [b - a for a, b in zip(tops, tops[1:])]
    print(f"{name}: page {found[0][0]}, first at {tops[0] - TOP:.0f} below the margin, gaps {[round(gap) for gap in gaps]} ({grids(sum(gaps) / max(1, len(gaps)), pitch)} lines of {pitch})")


def tops(lines, pattern, pitch=GRID):
    """The tops of the lines matching a pattern, from the margin and in lines of the grid"""
    for line in named(lines, pattern):
        print(f"  p{line[0]} {line[2] - TOP:7.0f} ({grids(line[2] - TOP, pitch)})  {line[5][:50]}")


def characters(lines, name):
    """The lines after a label, up to the next: how many characters each has, and how wide it is"""
    index = next((i for i, line in enumerate(lines) if line[5] == name), None)
    if index is None:
        print(f"{name}: not found")
        return
    print(f"{name}: characters, left, right, width, and the widths of its words")
    for line in lines[index + 1 :]:
        if re.match(r"^(C[A-D]|E[12])\w*$", line[5]):
            break
        count = len(line[5].replace(" ", ""))
        words = " ".join(f"{right - left:.0f}" for left, right, _ in line[6][:6])
        print(f"  {count:4d} {line[1]:6.0f} {line[3]:6.0f} {line[3] - line[1]:6.0f}  top {line[2] - TOP:6.0f}  words {words}")


def probes3(lines):
    """word-grid3: each line of each page, with its top from the margin, how many ideographs it has and how far across it
    goes, for the lines of text, notes, headers and cells of H1 to H11, and the lines down the page of VH1"""
    page = 0
    for line in lines:
        if line[0] != page:
            page = line[0]
            print(f"page {page}")
        print(f"  top {line[2] - TOP:6.0f}  {line[5].count('永'):3d} ideographs  {line[1]:6.0f} to {line[3]:6.0f}  {line[5].replace('永', '')[:40]}")


def main(path):
    lines = read(path)
    if any(line[5].startswith("H1") for line in lines):
        probes3(lines)
        return
    if any(line[5].startswith("E1") for line in lines):
        for name in ["E1a", "E1b", "E2a", "E2b"]:
            characters(lines, name)
        return
    ramps(lines)
    print("G2: the first line of each page, its box from the margin, and the gaps to the next two")
    for letter in "abcdefg":
        found = named(lines, rf"G2{letter} \d")
        if found:
            print(f"  G2{letter}: {found[0][2] - TOP:.0f} to {found[0][4] - TOP:.0f}, gaps {[round(b[2] - a[2]) for a, b in zip(found, found[1:])]}")
    for name in [f"G3{letter}" for letter in "abcdefghijklmnop"] + [f"G4{letter}" for letter in "abcdefghij"]:
        pitches(lines, name)
    print("G5: the tops of the lines from the margin")
    tops(lines, r"G5")
    for name, pitch in [("G6a", 360), ("G6b", 312)]:
        print(f"{name}: the tops of the lines from the margin")
        tops(lines, rf"{name}", pitch)
    for name in ["G7a", "G7b", "G7c", "G7d", "G7e"]:
        pitches(lines, name)
    print("G8: the tops of the lines from the margin")
    tops(lines, r"G8")
    print("G9: the tops of the header, the text, the footnote and the footer, from the margin")
    tops(lines, r"G9 (head|body|note|foot)")
    for name, pitch in [("G10a", 240), ("G10b", 240), ("G10c", 312), ("G10d", 200), ("G10e", 500), ("G13", 360)]:
        pitches(lines, name, pitch)
    print("G11: the tops of the lines from the margin")
    tops(lines, r"G11")
    print("G12: the tops of the lines from the margin")
    tops(lines, r"G12")
    for name in ["G14a", "G14b", "G14c"]:
        found = named(lines, rf"{name} \d+\b")
        if found:
            first = [line for line in found if line[0] == found[0][0]]
            print(f"{name}: {len(first)} lines on its first page, the last {first[-1][2] - TOP:.0f} below the margin, then {found[len(first)][5] if len(found) > len(first) else '-'}")
    for grid in ["CA", "CB", "CC", "CD"]:
        for number in range(1, 12):
            characters(lines, f"{grid}{number}")


if __name__ == "__main__":
    main(sys.argv[1])
