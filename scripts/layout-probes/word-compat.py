# Reads the probes of word-compat.ts from a PDF of each of its two documents, and prints what each shows, side by side:
# word-compat-on, with the compatibility settings Word writes in every document it makes, and word-compat-off, without.
#
#   pdftotext -bbox-layout word-compat-on.pdf word-compat-on.html
#   pdftotext -bbox-layout word-compat-off.pdf word-compat-off.html
#   python3 word-compat.py word-compat-on.html word-compat-off.html
#
# Lengths are in twips. Word's PDFs put text on a grid of 1/300 inch (4.8 twips), so a pitch is found over several lines.
import html
import re
import sys
import unicodedata

LEFT = 1440
WIDTH = 9026
# Calibri's lines in Word, in twips, at each size in points
LINE = {size: 2500 / 2048 * size * 20 for size in (9, 10, 11, 12, 14, 16)}


def read(path):
    """Each page's lines, each a list of its words: (left, top, right, bottom, text) in twips, the ligatures Word draws
    written out as their letters"""
    text = open(path, encoding="utf8").read()
    pages = []
    for content in re.findall(r"<page [^>]*>(.*?)</page>", text, re.S):
        lines = []
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, unicodedata.normalize("NFKC", html.unescape(word)))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if words:
                lines.append(words)
        pages.append(lines)
    return pages


def text_of(line):
    return " ".join(word[4] for word in line)


def find(pages, start):
    """The page index and line index of the first line whose text starts with these words"""
    for index, lines in enumerate(pages):
        for number, line in enumerate(lines):
            if text_of(line).startswith(start):
                return index, number
    return None, None


def nearest(height):
    """The size in points whose Calibri line is nearest this height"""
    return min(LINE, key=lambda size: abs(LINE[size] - height))


def pitches(pages, names):
    """The pitch from each of these lines to the next, where both are found on the same page"""
    found = [find(pages, name) for name in names]
    tops = []
    for page, number in found:
        tops.append(None if page is None else (page, pages[page][number][0][1]))
    return [
        None if a is None or b is None or a[0] != b[0] else b[1] - a[1]
        for a, b in zip(tops, tops[1:])
    ]


def cs1(pages, probe):
    """CS1: the pitch of the 10 paragraphs, and how far the prose's first lines reach"""
    steps = [step for step in pitches(pages, [f"{probe} para {i}" for i in range(1, 11)]) if step is not None]
    pitch = sum(steps) / len(steps) if steps else None
    page, number = find(pages, f"{probe} prose")
    rights = []
    if page is not None:
        for line in pages[page][number : number + 6]:
            if text_of(line).startswith(f"{probe} below"):
                break
            rights.append(round(line[-1][2] - LEFT))
    size = f"{nearest(pitch)} points" if pitch else "?"
    return f"pitch {pitch:.1f} ({size}), prose lines end at {rights} (justified: {WIDTH} but the last)" if pitch else "not found"


def cs2(pages, probe, rows):
    """CS2: the pitch from each row to the next, as the size of Calibri whose line it is, and the rows on the next page"""
    names = [f"{probe} row {i}" for i in range(1, rows + 1)] + [f"{probe} below"]
    steps = pitches(pages, names)
    sizes = [("-" if step is None else str(nearest(step))) for step in steps]
    out = f"rows' sizes {' '.join(sizes)}"
    # The header rows repeated at the top of the next page, before the rows that go on there
    page, _ = find(pages, f"{probe} row {rows}")
    first, _ = find(pages, f"{probe} row 1")
    if page is not None and first is not None and page != first:
        lines = pages[page]
        tops = [line[0][1] for line in lines]
        heads = [f"{text_of(line)[len(probe) + 1 :]} {nearest(b - a)}" for line, a, b in zip(lines[:4], tops, tops[1:])]
        out += f"; top of page {page + 1}: {', '.join(heads)}"
    return out


def cs3(pages, probe):
    """CS3: how wide the text after the probe's label is"""
    page, number = find(pages, probe)
    if page is None:
        return "not found"
    line = pages[page][number]
    words = line[2:]
    return f"{words[-1][2] - words[0][0]:.1f} wide: {text_of(words)}"


def cs4(pages, probe):
    """CS4: the page the paragraph's first line is on, how it ends, and where the next line is"""
    page, number = find(pages, probe)
    if page is None:
        return "not found"
    line = pages[page][number]
    lines = pages[page]
    after = lines[number + 1] if number + 1 < len(lines) else (pages[page + 1][0] if page + 1 < len(pages) else None)
    where = "the last line of its page" if number + 1 == len(lines) else f"line {number + 1} of its page"
    return f"page {page + 1}, {where}, ends {' '.join(word[4] for word in line[-2:])!r}; next line starts {text_of(after)[:20]!r}"


def report(on, off):
    print("== CS1: a table style of 9 points, justified, and paragraphs in Normal, of 12 points, left-aligned")
    for probe, what in (("CS1a", "Normal"), ("CS1b", "a style based on Normal"), ("CS1c", "no table style")):
        print(f"  {probe} {what}")
        print(f"    on:  {cs1(on, probe)}")
        print(f"    off: {cs1(off, probe)}")
    print("\n== CS2: a table style's first row 16 points, bands 14 and 10, over 11 (each row's size from its pitch)")
    for probe, rows, what in (("CS2a", 6, "2 header rows"), ("CS2b", 6, "3"), ("CS2c", 6, "1"), ("CS2d", 6, "none"), ("CS2e", 60, "2, across pages"), ("CS2f", 6, "2, the first row off")):
        print(f"  {probe} {what}")
        print(f"    on:  {cs2(on, probe, rows)}")
        print(f"    off: {cs2(off, probe, rows)}")
    print("\n== CS3: OpenType features in Calibri 12")
    for probe in ("CS3a kerned", "CS3b plain", "CS3c joined", "CS3d plain", "CS3e proportional", "CS3f tabular", "CS3g plain"):
        print(f"  {probe}")
        print(f"    on:  {cs3(on, probe)}")
        print(f"    off: {cs3(off, probe)}")
    print("\n== CS4: a line that ends at the hyphen of well-known, at a page's foot (CS4a) and top (CS4b)")
    for probe in ("CS4a", "CS4b"):
        print(f"  {probe}")
        print(f"    on:  {cs4(on, probe)}")
        print(f"    off: {cs4(off, probe)}")


if __name__ == "__main__":
    report(read(sys.argv[1]), read(sys.argv[2]))
