# Reads the probes of the word-watertight-*.ts documents from a PDF of each, and prints what each shows.
#
#   pdftotext -bbox-layout word-watertight-text.pdf word-watertight-text.html
#   pdfimages -list word-watertight-text.pdf > word-watertight-text.images.txt
#   pdftohtml -xml -i -q -zoom 1 word-watertight-text.pdf word-watertight-text
#   python3 word-watertight.py word-watertight-text
#
# It takes the name of the PDF without its extension, reads the files above beside it, and knows which document it is by
# its name: word-watertight-text, -tables, -pages, -markup, -settings, -fields, -stops, -sections, -sections2 or
# -endnotes1 to 3. Lengths are in twips, and positions are from the top and left of the page. Word's PDFs put text on a
# grid of 1/300 inch, 4.8 twips, so one position is only good to about 5 twips; the pitch of lines is found over a page
# of them, as word-line-heights.py finds it.
import html
import os
import re
import sys
from collections import defaultdict

GRID = 4.8
# Calibri 11's lines in Word, and the top and bottom of the text on A4 with 1440 margins
LINE = 2500 / 2048 * 220
TOP = 1440
BOTTOM = 16838 - 1440
LEFT = 1440
WIDTH = 9026


def read(base):
    """Each line, as a list of its words: (page, left, top, right, bottom, text), in twips. A line is what pdftotext found,
    with the words beside its first word added, as pdftotext puts words of other sizes, such as superscript, on lines of
    their own: those whose box reaches the middle of the first word's"""
    text = open(base + ".html", encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        words = [
            (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
            for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content)
        ]
        # Line numbers in the margin, which PG5a has, and LibreOffice draws on every page once a section has them
        words = [word for word in words if not (word[3] < LEFT - 20 and word[5].isdigit())]
        starts = []
        for line in re.findall(r"<line .*?</line>", content, re.S):
            for match in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">', line):
                start = next((word for word in words if abs(word[1] - float(match.group(1)) * 20) < 0.01 and abs(word[2] - float(match.group(2)) * 20) < 0.01), None)
                if start is not None:
                    starts.append(start)
                    break
        taken = set()
        for start in starts:
            if start in taken:
                continue
            middle = (start[2] + start[4]) / 2
            line = sorted((word for word in words if word[2] <= middle <= word[4] and word[1] >= start[1] - 0.01), key=lambda word: word[1])
            taken.update(line)
            found.append(line)
    return found


def read_raw(base):
    """Each line as pdftotext found it, which keeps the columns of a page apart, as a list of its words"""
    text = open(base + ".html", encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            words = [word for word in words if not (word[3] < LEFT - 20 and word[5].isdigit())]
            if words:
                found.append(words)
    return found


def fonts_of(base):
    """The font of each piece of text, from pdftohtml -xml -zoom 1: (page, top in twips, text, font family)"""
    path = base + ".xml"
    if not os.path.exists(path):
        return []
    text = open(path, encoding="utf8").read()
    families = dict(re.findall(r'<fontspec id="(\d+)" size="[^"]*" family="([^"]*)"', text))
    found = []
    for page, content in enumerate(re.findall(r"<page .*?</page>", text, re.S), 1):
        for top, font, inner in re.findall(r'<text top="(\d+)" left="\d+" width="\d+" height="\d+" font="(\d+)">(.*?)</text>', content):
            found.append((page, int(top) * 20, html.unescape(re.sub(r"<[^>]+>", "", inner)), families.get(font, "?")))
    return found


def images_by_page(base):
    """How many pictures are on each page, from pdfimages -list"""
    path = base + ".images.txt"
    counts = defaultdict(int)
    if os.path.exists(path):
        for row in open(path).read().splitlines()[2:]:
            parts = row.split()
            if parts and parts[0].isdigit():
                counts[int(parts[0])] += 1
    return counts


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


def text_of(line):
    return " ".join(word[5] for word in line)


def starting(lines, *prefix):
    """The lines whose first words are these"""
    return [line for line in lines if [word[5] for word in line[: len(prefix)]] == list(prefix)]


def first(lines, *prefix):
    found = starting(lines, *prefix)
    return found[0] if found else None


def page_probe(lines, probe, every=1, offset=0):
    """A page probe's lines on its first page, by their number, and the pitch of every `every`th of them: the number of
    lines on the page and the pitch, from the first word's top"""
    numbered = [line for line in lines if line[0][5] == probe and len(line) > 1 and line[1][5].isdigit()]
    if not numbered:
        return "not found"
    page = [line for line in numbered if line[0][0] == numbered[0][0][0]]
    tops = [line[0][2] for line in page if (int(line[1][5]) - 1) % every == offset]
    return f"{len(page)} lines on the page, pitch {pitch(tops)}" + (f" (of every {every})" if every > 1 else "")


def width(word):
    return round(word[3] - word[1], 1)


def paragraph_lines(lines, label, next_label=None):
    """The lines of a paragraph that starts with a label, up to the line starting with the next label, if given, or
    while the lines go on one under the other on the page"""
    start = next((index for index, line in enumerate(lines) if line[0][5] == label), None)
    if start is None:
        return []
    found = [lines[start]]
    for line in lines[start + 1 :]:
        if next_label is not None and line[0][5] == next_label:
            break
        if next_label is None and (line[0][0] != found[-1][0][0] or not 150 < line[0][2] - found[-1][0][2] < 800 or re.match(r"^[A-Z]{2}\d", line[0][5])):
            break
        found.append(line)
    return found


def endings(lines, label, next_label=None):
    found = paragraph_lines(lines, label, next_label)
    return f"{len(found)} lines, ending: " + " | ".join(line[-1][5] for line in found)


def text_probes(base):
    lines = read(base)
    fonts = fonts_of(base)
    print("== TX1: superscript and subscript (docx/layout ignores them: lines 268.55, digits full size)")
    for probe in ["TX1a", "TX1b"]:
        print(f"  {probe}: {page_probe(lines, probe)}")
    plain = first(lines, "TX1c", "plain")
    for label in ["sup", "sub", "plain"]:
        line = first(lines, "TX1c", label)
        if line:
            digits = line[2]
            print(
                f"  TX1c {label:5}: 40 digits {width(digits)} twips wide ({round(width(digits) / width(plain[2]), 3)} of plain), "
                f"box {round(digits[4] - digits[2], 1)} tall ({round((digits[4] - digits[2]) / (plain[2][4] - plain[2][2]), 3)} of plain), "
                f"top {round(digits[2] - line[0][2], 1)} from the label's"
            )
    big = first(lines, "TX1c", "big")
    if big:
        print(f"  TX1c big sup: 40 digits at 20 points {width(big[3])} twips wide, box {round(big[3][4] - big[3][2], 1)} tall")

    print("\n== TX2: raised and lowered text (docx/layout ignores w:position: lines 268.55)")
    for probe in ["TX2a", "TX2b", "TX2c"]:
        print(f"  {probe}: {page_probe(lines, probe)}")

    print("\n== TX3: the alphabet twice, as one word (docx/layout measures italic as upright, bold italic as bold)")
    for letter, font in zip("abcd", ["Times New Roman 10", "Calibri 11", "Cambria 11", "Arial 11"]):
        widths = {}
        for style in ["upright", "italic", "bold", "bolditalic"]:
            line = first(lines, f"TX3{letter}", style)
            widths[style] = width(line[2]) if line else None
        if widths["upright"]:
            print(
                f"  TX3{letter} {font:18}: upright {widths['upright']}, italic {widths['italic']} ({round(widths['italic'] / widths['upright'], 3)}), "
                f"bold {widths['bold']}, bold italic {widths['bolditalic']} ({round(widths['bolditalic'] / widths['bold'], 3)} of bold)"
            )

    print("\n== TX4: small capitals (docx/layout draws the small letters as capitals at 0.8 of the size)")
    for size in ["22", "40"]:
        small, caps, typed = (first(lines, "TX4", size, kind) for kind in ["small", "caps", "typed"])
        if small and caps:
            print(
                f"  TX4 {int(size) / 2:g} points: small caps {width(small[3])}, all caps {width(caps[3])}, typed {width(typed[3])}: "
                f"scale {round(width(small[3]) / width(caps[3]), 3)}, box {round(small[3][4] - small[3][2], 1)} against {round(caps[3][4] - caps[3][2], 1)}"
            )

    print("\n== TX5: paragraph borders (docx/layout ignores w:pBdr: lines 268.55)")
    for probe, note in [("TX5b", "the same top and bottom on every paragraph"), ("TX5h", "the same top, bottom and between on every paragraph")]:
        print(f"  {probe} {note}: {page_probe(lines, probe)}")
    for probe, note in [
        ("TX5a", "bottom, sz 6, 1 point away, on every other"),
        ("TX5c", "top and bottom, sz 6, on every other"),
        ("TX5d", "thematicBreak on every other"),
        ("TX5e", "top and bottom, sz 24, 4 points away, on every other"),
    ]:
        print(f"  {probe} {note}: {page_probe(lines, probe, 2, 0)}")
    print(f"  TX5f left and right borders 20 points away: {endings(lines, 'TX5f', 'TX5g')}")
    print(f"  TX5g the same without:                    {endings(lines, 'TX5g')}")

    print("\n== TX6: automatic spacing (docx/layout ignores it: no space)")
    for probe in ["TX6a", "TX6b"]:
        print(f"  {probe}: {page_probe(lines, probe)}")
    tops = {text_of(line): line[0][2] for line in lines if line[0][5] == "TX6c"}
    order = ["TX6c above", "TX6c cell 1", "TX6c cell 2", "TX6c cell 3", "TX6c below"]
    if all(name in tops for name in order):
        print("  TX6c in a cell: gaps " + ", ".join(f"{order[i]} to {order[i + 1].split(' ', 1)[1]} {round(tops[order[i + 1]] - tops[order[i]], 1)}" for i in range(4)))
    first_line = first(lines, "TX6d", "first")
    second = first(lines, "TX6d", "second")
    if first_line:
        label = first(lines, "TX1a", "1")
        print(f"  TX6d at the top of a page: first line {round(first_line[0][2] - label[0][2], 1)} below a page's first line, second {round(second[0][2] - first_line[0][2], 1)} below it")

    print("\n== TX7: lengths in characters and lines (docx/layout ignores *Chars and *Lines)")
    for label in ["TX7a", "TX7b", "TX7c", "TX7e"]:
        found = paragraph_lines(lines, label)
        if found:
            print(f"  {label}: first line at {round(found[0][0][1] - LEFT, 1)} from the margin, the next at {round(found[1][0][1] - LEFT, 1)}")
    print(f"  TX7d a line before and after: {page_probe(lines, 'TX7d')}")

    print("\n== TX8: pictures in the line (docx/layout: as tall as the picture, 600 twips, or the text when taller)")
    pages = images_by_page(base)
    last_text = max((line[0][0] for line in lines if line[0][5] == "TX7d"), default=None)
    if last_text is not None and pages:
        page = min((page for page in pages if page > last_text), default=None)
        print(f"  TX8a 30-point pictures alone: {pages.get(page, 0)} on the first page (13958 twips: 23 at 600, 21 at 654)")
    for probe, note in [
        ("TX8b", "30 points beside Calibri 11"),
        ("TX8c", "at 1.15 lines"),
        ("TX8d", "exactly 12 points"),
        ("TX8e", "at least 12 points"),
        ("TX8f", "6 points"),
        ("TX8g", "30 points beside Times New Roman 10"),
    ]:
        print(f"  {probe} {note}: {page_probe(lines, probe)}")

    print("\n== TX9: two fonts on a line (docx/layout: the taller of their lines, 268.55)")
    for probe, note in [("TX9a", "with Courier New"), ("TX9b", "with Times New Roman"), ("TX9c", "with Arial")]:
        print(f"  {probe} {note}: {page_probe(lines, probe)}")

    print("\n== TX10: soft hyphens (docx/layout: no break, and U+00AD as wide as a hyphen)")
    for label, note in [("TX10a", "w:softHyphen"), ("TX10b", "U+00AD"), ("TX10c", "none")]:
        found = paragraph_lines(lines, label)
        broken = sum(1 for line in found if line[-1][5].endswith("-"))
        print(f"  {label} {note}: {len(found)} lines, {broken} ending in a hyphen: " + " | ".join(line[-1][5] for line in found[:6]))
    d, e = first(lines, "TX10d"), first(lines, "TX10e")
    if d and e:
        print(f"  TX10d a word with soft hyphens in a line: {width(d[1])} twips; TX10e without: {width(e[1])}")

    print("\n== TX11: a hidden paragraph mark, specVanish and vanish")
    joined = any("TX11a first" in text_of(line) and "second" in text_of(line) for line in lines)
    print(f"  TX11a: the two paragraphs {'on one line' if joined else 'on lines of their own'}")
    for label in ["TX11b", "TX11c"]:
        line = next((line for line in lines if any(word[5] == label or word[5].endswith(label) for word in line)), None)
        print(f"  {label}: {text_of(line) if line else 'not found'}")

    print("\n== TX12: tabs (docx/layout: a decimal tab lines up the end, as a right tab)")
    for line in starting(lines, "TX12a"):
        print(f"  TX12a {line[1][5]:8}: from {round(line[1][1] - LEFT, 1)} to {round(line[1][3] - LEFT, 1)} (the stop is at 4000)")
    for count in ["43", "44", "45", "46"]:
        line = first(lines, "TX12b", count)
        if line:
            after = [word for word in line[3:] if word[5] == "x"]
            where = f"on the line at {round(after[0][1] - LEFT, 1)}" if after else "not on the line"
            nxt = lines[lines.index(line) + 1]
            if not after and nxt[0][5] == "x":
                where = f"on the next line at {round(nxt[0][1] - LEFT, 1)}"
            print(f"  TX12b {count} m's, ending at {round(line[2][3] - LEFT, 1)}: the x after the tab {where}")
    for label, word, edge in [("TX12c", "right", 3), ("TX12d", "left", 1), ("TX12e", "right", 3)]:
        line = first(lines, label)
        if line:
            found = [w for w in line if w[5] == word]
            nxt = lines[lines.index(line) + 1]
            target = found[0] if found else (nxt[0] if nxt[0][5] == word else None)
            print(f"  {label}: '{word}' {'on its line' if found else 'on the next line'}, its {'right' if edge == 3 else 'left'} edge at {round(target[edge] - LEFT, 1) if target else '?'}")

    print("\n== TX14: ligatures (docx/layout ignores w14:ligatures)")
    for word in ["official", "affluent", "fifty", "attitude", "fjord"]:
        widths = []
        for label in [("TX14a", "standard"), ("TX14b", "none"), ("TX14c", "all")]:
            line = next((line for line in starting(lines, *label) if line[2][5].startswith(word[:3])), None)
            widths.append(width(line[2]) if line else None)
        print(f"  {word * 6:48}: standard {widths[0]}, none {widths[1]}, all {widths[2]}")

    print("\n== TX15: emphasis marks (docx/layout ignores w:em)")
    print(f"  TX15: {page_probe(lines, 'TX15')}")

    print("\n== TX16: a border around a run (docx/layout ignores w:bdr)")
    for label in ["TX16a", "TX16b"]:
        line = first(lines, label)
        if line:
            print(f"  {label}: " + ", ".join(f"{word[5]} {round(word[1] - LEFT, 1)}-{round(word[3] - LEFT, 1)}" for word in line))

    print("\n== TX17: letters the width tables don't have (docx/layout measures them as an average letter)")
    for line in starting(lines, "TX17"):
        print(f"  {line[1][5]:12}: " + ", ".join(f"{word[5][:12]}… {width(word)}" for word in line[2:]))
    for name in ["wingdings", "symbol"]:
        found = [piece for piece in fonts if piece[2].startswith(f"TX17 {name}")]
        if found:
            print(f"  {name}: fonts on its line: {sorted({piece[3] for piece in fonts if piece[0] == found[0][0] and abs(piece[1] - found[0][1]) < 100})}")

    print("\n== TX18: fonts docx/layout doesn't have (it measures a missing sans as Arial, Garamond and Georgia as Times New Roman,")
    print("   Segoe UI and Calibri Light as Calibri, the others as Arial)")
    for line in starting(lines, "TX18"):
        font = [piece[3] for piece in fonts if "Thequick" in piece[2] and piece[0] == line[0][0] and abs(piece[1] - line[0][2]) < 120]
        print(f"  {line[1][5]:26}: {width(line[2])} twips, drawn in {font[0] if font else '?'}")

    print("\n== TX19: spaces other than U+0020 (docx/layout: an average letter wide, and no break after them)")
    for label in ["TX19a", "TX19b", "TX19c", "TX19d", "TX19e", "TX19f"]:
        line = first(lines, label)
        if line:
            gaps = [round(line[i + 1][1] - line[i][3], 1) for i in range(1, len(line) - 1)]
            print(f"  {label}: {len(line) - 1} words, gaps {gaps}")
    found = paragraph_lines(lines, "TX19g")
    print(f"  TX19g 60 words joined by en spaces: {len(found)} lines, ending: " + " | ".join(line[-1][5] for line in found))

    print("\n== TX20: justified and distributed against left-aligned (docx/layout breaks them all the same)")
    for label, nxt in [("TX20a", "TX20b"), ("TX20b", "TX20c"), ("TX20c", None)]:
        print(f"  {label}: {endings(lines, label, nxt)}")

    print("\n== TX21: list numbers 1. to 12. at 360 twips, with a hanging indent to 720, aligned right, centred and left")
    print("   (docx/layout ignores w:lvlJc: the number starts at 360 and the text at the stop at 720)")
    for alignment in ["end", "center", "start"]:
        found = [line for line in lines if any(word[5] == "TX21" for word in line) and any(word[5] == alignment for word in line)]
        for line in found:
            if line[-1][5] in ("1", "9", "10", "12"):
                label = next(i for i, word in enumerate(line) if word[5] == "TX21")
                print(f"  {alignment:6} {line[-1][5]:2}: the number from {round(line[0][1] - LEFT, 1)} to {round(line[label - 1][3] - LEFT, 1) if label else '?'}, the text from {round(line[label][1] - LEFT, 1)}")


def top_of(lines, *prefix):
    line = first(lines, *prefix)
    return line[0][2] if line else None


def gaps(lines, probe, names):
    """The distance from each named line of a probe to the next, from the top of its first word"""
    tops = [top_of(lines, probe, *name.split(" ")) for name in names]
    return ", ".join(
        f"{names[i]} to {names[i + 1]} {round(tops[i + 1] - tops[i], 1) if tops[i] is not None and tops[i + 1] is not None else '?'}"
        for i in range(len(names) - 1)
    )


def rows_of(lines, probe, count, word="row"):
    """The pitch of rows named `probe row n`, the gap from the line above the table to the first, and from the last to
    the line below it"""
    tops = [top_of(lines, probe, word, str(n)) for n in range(1, count + 1)]
    above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
    shown = [top for top in tops if top is not None]
    pitches = [round(b - a, 1) for a, b in zip(shown, shown[1:])]
    return (
        f"{len(shown)} of {count} rows shown, from above {round(shown[0] - above, 1) if shown and above else '?'}, "
        f"pitch {pitches[0] if pitches else '-'}{' to ' + str(max(pitches)) if pitches and max(pitches) != pitches[0] else ''}, "
        f"to below {round(below - shown[-1], 1) if shown and below else '?'}"
    )


def tables_probes(base):
    lines = read(base)
    print("== TB1: paragraphs in a table whose style has none after, single, 9 points; Normal has 200 after, 1.5 lines,")
    print("   11 points. docx/layout takes the table style's, then the paragraph style's over it: Normal's 200, 1.5, 11")
    for probe, note in [
        ("TB1a", "Normal"),
        ("TB1b", "Normal named"),
        ("TB1c", "a style of their own"),
        ("TB1d", "100 after of their own"),
        ("TB1e", "no table style"),
        ("TB1f", "a table style with only 9 points"),
    ]:
        tops = [top_of(lines, probe, "para", str(n)) for n in range(1, 11)]
        para = first(lines, probe, "para", "1")
        above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
        if para and all(top is not None for top in tops):
            print(
                f"  {probe} {note:32}: pitch {round((tops[-1] - tops[0]) / 9, 1)}, box {round(para[0][4] - para[0][2], 1)} tall "
                f"(11 points: 268), above to para 1 {round(tops[0] - above, 1)}, para 10 to below {round(below - tops[-1], 1)}"
            )
    print("\n== TB2: borders only the table's style has, against the table's own (docx/layout reads the table's own only)")
    print(f"  TB2a style's 3-point borders: {rows_of(lines, 'TB2a', 10)}")
    print(f"  TB2b own 3-point borders:     {rows_of(lines, 'TB2b', 10)}")
    print("\n== TB3: cells' own 3-point top and bottom borders (docx/layout ignores w:tcBorders)")
    print(f"  TB3: {rows_of(lines, 'TB3', 10)}")
    print("\n== TB4: 100 twips between cells (docx/layout ignores w:tblCellSpacing)")
    print(f"  TB4a: {rows_of(lines, 'TB4a', 10)}")
    for probe, nxt in [("TB4b", ("TB4c", "above")), ("TB4c", ("TB4c", "below"))]:
        start, end = first(lines, probe, "above"), first(lines, *nxt)
        if start and end:
            words = [word for line in lines for word in line if word[0] == start[0][0] and start[0][2] < word[2] < end[0][2] - 1 and word[1] < LEFT + WIDTH / 2 - 100]
            print(f"  {probe} left cell {'with' if probe == 'TB4b' else 'without'} the space: {len({round(w[2]) for w in words})} lines, its text from {round(min(w[1] for w in words) - LEFT, 1)} to {round(max(w[3] for w in words) - LEFT, 1)}")
    print("\n== TB5: rows kept with the next; rows 1 to 5 fit on the first page (docx/layout ignores keepNext in rows)")
    for probe, note in [("TB5a", "rows 1 to 9 kept"), ("TB5b", "one cell of each of rows 1 to 9 kept"), ("TB5c", "row 5 kept"), ("TB5d", "none kept")]:
        top = first(lines, probe, "top")
        on_first = [n for n in range(1, 11) if (line := first(lines, probe, "row", str(n))) and top and line[0][0] == top[0][0]]
        print(f"  {probe} {note:36}: rows on the first page: {on_first}")
    print("\n== TB6: text running up and down a cell 2000 twips wide (docx/layout lays it out across: one line, 268.55)")
    for probe, note in [("TB6a", "btLr, one paragraph"), ("TB6b", "tbRl, one paragraph"), ("TB6c", "btLr, 3 paragraphs")]:
        above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
        print(f"  {probe} {note}: the row is {round(below - above - LINE, 1) if above and below else '?'} tall")
    print("\n== TB7: an empty cell with a 28-point mark beside a line (docx/layout: as tall as the mark, 683)")
    for probe, note in [("TB7a", "hideMark"), ("TB7b", "without")]:
        above, below = top_of(lines, probe, "above"), top_of(lines, probe, "below")
        print(f"  {probe} {note}: the row is {round(below - above - LINE, 1) if above and below else '?'} tall")
    print("\n== TB8: a table style's 16-point first row (docx/layout ignores w:tblStylePr)")
    for probe, note in [("TB8a", "tblLook firstRow on"), ("TB8b", "off")]:
        print(f"  {probe} {note}: {gaps(lines, probe, ['above', 'row 1', 'row 2', 'row 3'])}")
    print("\n== TB9: a table sized to its text, indented 2000 (docx/layout ignores w:tblInd)")
    for probe in ["TB9a", "TB9b"]:
        found = paragraph_lines(lines, probe)
        found = [line for line in found if line[0][5] == probe or not (len(line) > 1 and line[1][5] == "above")][1:] if found and len(found[0]) > 1 and found[0][1][5] == "above" else found
        cell = [line for line in lines if line and line[0][0] == (first(lines, probe, "above") or [[0]])[0][0]]
        words = [word for line in cell for word in line if line[0][5] != probe or (len(line) > 1 and line[1][5] not in ("above", "below"))]
        if words:
            print(f"  {probe}: text from {round(min(w[1] for w in words) - LEFT, 1)} to {round(max(w[3] for w in words) - LEFT, 1)}, in {len({round(w[2]) for w in words})} lines")
    print("\n== TB10: rows 3 to 7 of 10 hidden (docx/layout ignores w:hidden in rows)")
    print(f"  TB10: {rows_of(lines, 'TB10', 10)}")
    print("\n== TB11: a 3000-twip table floating at the left margin, then prose (docx/layout lays it out where it is written)")
    cell = top_of(lines, "TB11", "cell", "1")
    prose_lines = [line for line in lines if line[0][0] == (first(lines, "TB11", "above") or [[0]])[0][0] and line[0][5] != "TB11"]
    start = first(lines, "TB11", "the")
    if start:
        prose_lines = [start] + prose_lines
    for line in prose_lines[:10]:
        print(f"  line at {round(line[0][2] - TOP, 1)}: from {round(line[0][1] - LEFT, 1)}: {text_of(line)[:50]}")


def pages_probes(base):
    lines = read(base)
    print("== PG1: a continuous section with other margins, from line 21 of a page (docx/layout keeps the page's first")
    print("   section's bottom margin on the page the section starts on, and the new section's margins after)")
    for probe, note in [("PG1a", "bottom margin 5000"), ("PG1b", "bottom margin 720"), ("PG1c", "top margin 4000")]:
        own = [line for line in lines if line[0][5] == probe and len(line) > 2 and line[1][5] in ("A", "B")]
        if not own:
            continue
        for page in sorted({line[0][0] for line in own})[:2]:
            on = [line for line in own if line[0][0] == page]
            a = sum(1 for line in on if line[1][5] == "A")
            print(
                f"  {probe} {note}, page {page - own[0][0][0] + 1}: {a} lines of A and {len(on) - a} of B, the first at {round(on[0][0][2], 1)}, "
                f"the last at {round(on[-1][0][2], 1)}, which leaves {round(16838 - on[-1][0][2] - LINE, 1)} below it"
            )
    print("\n== PG2: a continuous section numbered from 7, and from I, after 30 lines (docx/layout: the page it starts on keeps")
    print("   its number, and the next is numbered on from it, as the restart is only read for a section on a new page)")
    for probe in ["PG2a", "PG2b"]:
        own = [line for line in lines if line[0][5] == probe and len(line) > 3 and line[1][5] in ("A", "B")]
        footers = [line for line in lines if line[0][5] == probe and len(line) > 1 and line[1][5] == "footer"]
        for page in sorted({line[0][0] for line in own})[:3]:
            on = [line for line in own if line[0][0] == page]
            shown = {kind: sorted({line[-1][5] for line in on if line[1][5] == kind}) for kind in ("A", "B")}
            foot = [text_of(line) for line in footers if line[0][0] == page]
            print(f"  {probe} page {page - own[0][0][0] + 1}: A's lines show {shown['A']}, B's {shown['B']}, footer: {foot}")
    print("\n== PG3: a continuous section on landscape pages (docx/layout starts it on a new page)")
    a, b = first(lines, "PG3", "A", "1"), first(lines, "PG3", "B", "1")
    if a and b:
        print(f"  PG3: B starts on {'the same page as A' if a[0][0] == b[0][0] else 'a new page'}")
    print("\n== PG4: a 2-inch picture floating in the header, 3 inches down and 4.5 across, text wrapping round it on both")
    print("   sides (docx/layout ignores drawings in headers: every body line is the width of the page)")
    start = first(lines, "PG4")
    if start:
        body = [line for line in lines if line[0][0] == start[0][0] and line[0][2] >= start[0][2] - 1]
        for line in body[:20]:
            print(f"  line at {round(line[0][2], 1)}: from {round(line[0][1] - LEFT, 1)} to {round(line[-1][3] - LEFT, 1)}" + ("  <- beside the picture (4320 to 7200 down)" if 4320 - 268 < line[0][2] < 7200 else ""))
    print("\n== PG5: line numbers (docx/layout ignores them)")
    print(f"  PG5a with:    {endings(lines, 'PG5a')}")
    print(f"  PG5b without: {endings(lines, 'PG5b')}")
    print("\n== PG6: page borders 31 points from the text (docx/layout ignores them)")
    print(f"  PG6: {page_probe(lines, 'PG6')}")
    print("\n== PG7: fields Word may write itself (docx/layout measures what is written: 1 January 2000, and nothing for the rest)")
    for line in lines:
        if line[0][5] in ("PG7a", "PG7b", "PG7c", "PG7d", "PG7e"):
            print(f"  {text_of(line)}")
    print("\n== PG8: 3 endnotes of 30 lines after a line (docx/layout: no continuation separator above the endnotes on the next page)")
    refs = first(lines, "PG8", "refs")
    # The first line of each note starts with its number
    notes = [line for line in lines if "PG8 note" in text_of(line)]
    if refs and notes:
        print(f"  the first endnote line is {round(notes[0][0][2] - refs[0][2], 1)} below the line referring to them")
        for page in sorted({line[0][0] for line in notes}):
            on = [line for line in notes if line[0][0] == page]
            print(f"  page {page - refs[0][0] + 1}: {len(on)} endnote lines, from '{text_of(on[0])}' at {round(on[0][0][2], 1)} ({round(on[0][0][2] - TOP, 1)} below the margin)")


def markup_probes(base):
    lines = read(base)
    print("== MK1: 40 words deleted in a tracked change (docx/layout leaves deleted text out, as MK1b)")
    for label, nxt, note in [("MK1a", "MK1b", "deleted"), ("MK1b", "MK1c", "without them"), ("MK1c", None, "as plain text")]:
        print(f"  {label} {note:14}: {endings(lines, label, nxt)}")
    print("\n== MK2: 40 words inserted in a tracked change (docx/layout lays inserted text out, as MK2b)")
    for label, nxt, note in [("MK2a", "MK2b", "inserted"), ("MK2b", None, "as plain text")]:
        print(f"  {label} {note:14}: {endings(lines, label, nxt)}")
    print("\n== MK3: a paragraph whose mark is deleted (docx/layout keeps it a paragraph of its own)")
    for word in ["first", "second", "third"]:
        line = next((line for line in lines if "MK3" in text_of(line) and word in text_of(line)), None)
        print(f"  MK3 {word}: {text_of(line) if line else 'not found'}")
    print("\n== MK4: a comment on 10 words (docx/layout ignores comments)")
    for label, nxt in [("MK4a", "MK4b"), ("MK4b", None)]:
        print(f"  {label}: {endings(lines, label, nxt)}")
    print("\n== MK5: a tracked change of formatting")
    for label, nxt in [("MK5a", "MK5b"), ("MK5b", None)]:
        print(f"  {label}: {endings(lines, label, nxt)}")
    print("\n== MK6: row 3 of 5 deleted (docx/layout lays deleted rows out)")
    shown = [n for n in range(1, 6) if first(lines, "MK6", "row", str(n))]
    print(f"  MK6: rows shown {shown}, {gaps(lines, 'MK6', ['above', 'row 1', 'row 2', 'row 4', 'below'])}")
    print("\n  The page's text is " + (f"{round(max(w[3] for l in lines for w in l) - min(w[1] for l in lines for w in l), 1)} twips across" if lines else "?") + " (9026 unscaled)")


def settings_probes(base):
    lines = read(base)
    print("== ST1: a dirty page reference written as 99, to a bookmark on page 2")
    line = first(lines, "ST1", "see")
    print(f"  ST1: {text_of(line) if line else 'not found'}  (99: Word didn't update it; 2: it did)")
    print("\n== ST2: TB1 again, with overrideTableStyleFontSizeAndJustification (docx/layout: Normal's 200 after, 1.5, 11 points)")
    for probe, note in [("ST2a", "Normal"), ("ST2c", "a style of their own"), ("ST2e", "no table style"), ("ST2f", "a table style with only 9 points")]:
        tops = [top_of(lines, probe, "para", str(n)) for n in range(1, 11)]
        para = first(lines, probe, "para", "1")
        if para and all(top is not None for top in tops):
            print(f"  {probe} {note:32}: pitch {round((tops[-1] - tops[0]) / 9, 1)}, box {round(para[0][4] - para[0][2], 1)} tall (11 points: 268)")
    print("\n== ST3: a 1440 gutter at the top (docx/layout takes it from the width: 51 lines on a page)")
    print(f"  ST3: {page_probe(lines, 'ST3')}")
    numbered = [line for line in lines if line[0][5] == "ST3"]
    if numbered:
        print(f"  ST3 the first line at {round(numbered[0][0][2], 1)}, from {round(numbered[0][0][1], 1)} across")


def fields_probes(base):
    lines = read(base)
    print("== FD: page references and counts as Word wrote them once its fields were updated")
    print("   (docx/layout: FD1 the page the bookmark starts on; FD2, FD3 and FD4 left blank)")
    for line in lines:
        text = text_of(line)
        if re.match(r"^(FD1 reference|FD2 above|FD2 below|FD2 other|FD3 roman|FD3 ALPHABETIC|FD3 Ordinal|FD3 picture|FD3 numpages|FD3 sectionpages|FD4 reference)", text):
            print(f"  {text}")
    for name in ["FD1 bookmark starts", "FD1 bookmark ends", "FD2 target", "FD3 target"]:
        line = next((line for line in lines if text_of(line).startswith(name)), None)
        if line:
            print(f"  '{name}' is on page {line[0][0]} of the PDF")


def layout_of(lines, probe):
    """Where a probe's lines are: for each page, each column (by where its lines start across the page), the runs of
    numbered lines, such as `SP1a fill 1-47`, and the other lines"""
    own = [line for line in lines if re.search(rf"(^|\s){probe}(\s|$)", text_of(line))]
    if not own:
        return ["  not found"]
    first_page = own[0][0][0]
    out = []
    for page in sorted({line[0][0] for line in own}):
        columns = defaultdict(list)
        for line in own:
            if line[0][0] == page:
                columns[round((line[0][1] - LEFT) / 400) * 400].append(line)
        parts = []
        for x in sorted(columns):
            runs = []
            for line in columns[x]:
                text = re.sub(r"^\d+\s+", "", text_of(line))
                match = re.match(rf"^{probe}\s+(.*?)\s*(\d+)$", text)
                label, number = (match.group(1), int(match.group(2))) if match else (text[len(probe) + 1:] if text.startswith(probe) else text, None)
                if runs and number is not None and runs[-1][0] == label and runs[-1][2] == number - 1:
                    runs[-1][2] = number
                else:
                    runs.append([label, number, number])
            described = ", ".join(f"{label} {a}" + (f"-{b}" if b != a else "") if a is not None else label for label, a, b in runs)
            parts.append(f"from {x}: {described}")
        out.append(f"  page {page - first_page + 1}: " + "; ".join(parts))
    return out


def stops_probes(base):
    lines = read(base)
    raw = read_raw(base)
    for probe, note in [
        ("SP1a", "a 12-line note from line 48 of the first of 2 columns"),
        ("SP1b", "the same from line 48 of the second"),
        ("SP2", "a 120-line note at a section's end, before a section numbered from 1"),
        ("SP3a", "room for 2 note lines, a note of a 4-line paragraph kept together and 4 lines"),
        ("SP3b", "room for 3, a note of 2 lines kept with the next and 4 lines"),
        ("SP3c", "room for 3, a note of a line and a table of 3 rows of 3 lines"),
        ("SP3d", "room for 4, a note of a line and a table of a header row and 6 rows"),
        ("SP4", "a line kept with a 6-line paragraph, on line 45, with an 8-line note"),
        ("SP5", "a line at a page's top with a note of 55 lines kept together"),
        ("SP6", "two continuous sections of 2 columns, each with a 2-line note"),
        ("SP7", "notes from the narrow first column and the wide second (2000, 6306)"),
        ("SP8", "a section starting in the second column, with a 10-line note, beside 45 lines"),
        ("SP9", "a 3-line note from line 50 of the second column"),
        ("SP10", "a section starting in the next column, of 2000 and 6306, after 2 equal columns"),
        ("SP11", "a continuous break after a section that started in the second of 3 columns"),
        ("SP12", "a 120-line paragraph kept together, in columns of 2000 and 6306"),
        ("SP13", "a line kept with the next, before a 60-line paragraph kept together, in 2 columns"),
        ("SP16", "a table sized to its text going on from a column of 6306 into one of 2000"),
    ]:
        print(f"== {probe}: {note}")
        for row in layout_of(raw, probe):
            print(row)
        if probe == "SP2":
            for line in lines:
                if text_of(line).startswith("SP2 next"):
                    print(f"  {text_of(line)} (PDF page {line[0][0]})")
        if probe == "SP16":
            for line in raw:
                if text_of(line).startswith("SP16 row") or text_of(line).startswith("SP16 text"):
                    print(f"  {text_of(line)[:30]:30} from {round(line[0][1] - LEFT)} to {round(line[-1][3] - LEFT)} (PDF page {line[0][0]})")
        print()

    print("== SP14: rows of 3000 + 6026 and 4000 + 5026, sized by Word (a) and fixed (b): where each cell's text starts")
    for probe in ["SP14a", "SP14b"]:
        for row in ["1", "2"]:
            starts = [round(word[1] - LEFT) for line in lines for i, word in enumerate(line) if word[5] == probe and i + 2 < len(line) and line[i + 1][5] == "row" and line[i + 2][5] == row]
            print(f"  {probe} row {row}: cells' text from {starts}")
    print("\n== SP15: long words in tables whose cells have widths: where each cell's text starts, and the word's box")
    for probe in ["SP15a", "SP15b", "SP15c"]:
        found = [(round(word[1] - LEFT), round(word[3] - LEFT), word[5][:12]) for line in lines for word in line if line[0][0] == (first(lines, probe, "above") or [[0]])[0][0] and (word[5] == probe or word[5].startswith("mmm") or word[5] in ("right", "one", "two", "three"))]
        print(f"  {probe}: {found[:12]}")
    print("\n== SP17: long words across 2 and 3 columns of tables given no widths: where each column's text starts")
    for line in lines:
        text = text_of(line)
        if re.match(r"^(one|two words|one two words|one two words three short words)", text) or text.startswith("one "):
            print(f"  page {line[0][0]}, top {round(line[0][2])}: " + ", ".join(f"{word[5]} {round(word[1] - LEFT)}" for word in line))
    for line in lines:
        if line[0][5].startswith("mmm"):
            print(f"  word of {len(line[0][5])} m's from {round(line[0][1] - LEFT)} to {round(line[0][3] - LEFT)}")
    print("\n== SP18: justified lines whose last word fits only with the spaces this much narrower: the first line's last word")
    for share in ["3", "6", "10", "15", "20", "25", "33"]:
        line = first(lines, "SP18", share)
        if line:
            print(f"  {share}%: ends with '{line[-1][5]}' ({'squeezed in' if line[-1][5] == 'coast' else 'wrapped'})")
    print("\n== SP19: a table style's 16-point first row, where Normal has no size of its own (docx/layout ignores w:tblStylePr)")
    for probe, note in [("SP19a", "tblLook firstRow on"), ("SP19b", "off")]:
        print(f"  {probe} {note}: {gaps(lines, probe, ['above', 'row 1', 'row 2', 'row 3'])}")


def numbers_shown(lines, probe, kinds):
    """The page numbers a probe's lines show, by the section each is in (`kinds`), and its footer, on each page"""
    own = [line for line in lines if line[0][5] == probe and len(line) > 3 and line[1][5] in kinds]
    footers = [line for line in lines if line[0][5] == probe and len(line) > 1 and line[1][5] == "footer"]
    for page in sorted({line[0][0] for line in own})[:3]:
        on = [line for line in own if line[0][0] == page]
        shown = ", ".join(f"{kind}'s {sorted({line[-1][5] for line in on if line[1][5] == kind}, key=lambda n: (len(n), n))}" for kind in kinds)
        foot = [text_of(line) for line in footers if line[0][0] == page]
        print(f"  {probe} page {page - own[0][0][0] + 1}: lines show {shown}, footer: {foot}")
    starts = [first(lines, probe, kind, "1") for kind in kinds[1:]]
    for kind, start in zip(kinds[1:], starts):
        if start:
            print(f"  {probe} {kind} starts on page {start[0][0] - own[0][0][0] + 1}, {round(start[0][2] - TOP, 1)} below the margin")


def notes_by_page(lines, probe):
    """Where a probe's endnotes are on each page: how many lines, and where the first and last are"""
    refs = first(lines, probe, "refs")
    notes = [line for line in lines if f"{probe} note" in text_of(line)]
    if not refs or not notes:
        print(f"  {probe}: not found")
        return
    print(f"  the line referring to them at {round(refs[0][2] - TOP, 1)} below the margin, on page 1")
    for page in sorted({line[0][0] for line in notes}):
        on = [line for line in notes if line[0][0] == page]
        print(
            f"  page {page - refs[0][0] + 1}: {len(on)} endnote lines, from '{text_of(on[0])}' at {round(on[0][0][2] - TOP, 1)} below the margin"
            f" to '{text_of(on[-1])}' at {round(on[-1][0][2] - TOP, 1)}"
        )


def sections_probes(base):
    raw = read_raw(base)
    lines = read(base)
    print("== SC1: a section in the next column numbered from 7, after 30 lines in the first of 2 columns (docx/layout:")
    print("   numbers the page after on from the page it starts on)")
    numbers_shown(raw, "SC1", ["A", "B"])
    print("\n== SC2: continuous sections numbered from 7 (docx/layout: the page the section starts on keeps its number, and the")
    print("   next is numbered on from it)")
    for probe, note in [
        ("SC2a", "after 51 lines, the empty paragraph ending the section at the top of page 2"),
        ("SC2b", "after 50 lines and the empty paragraph ending the section, at the top of page 2"),
        ("SC2c", "after 51 lines, the last of which ends the section, at the top of page 2"),
        ("SC2d", "after 10 lines, then one numbered from 20 after 10 more, on one page"),
    ]:
        print(f"  {probe}: {note}")
        numbers_shown(raw, probe, ["A", "B", "C"] if probe == "SC2d" else ["A", "B"])
    print("\n== SC3: a 1440 gutter at the top with a header below the top margin (header at 708; docx/layout: the body starts")
    print("   at the margin and gutter or below the header, whichever is lower)")
    for probe, count in [("SC3a", 5), ("SC3b", 10)]:
        body = [line for line in lines if line[0][5] == probe and len(line) > 1 and line[1][5].isdigit()]
        header = [line for line in lines if line[0][5] == probe and len(line) > 1 and line[1][5] == "header" and body and line[0][0] == body[0][0][0]]
        if len(header) == count:
            print(f"  {probe} header: the first line at {round(header[0][0][2], 1)}, the last at {round(header[-1][0][2], 1)}, which ends at {round(header[-1][0][2] + LINE, 1)}")
        if body:
            print(f"  {probe} body: {page_probe(lines, probe)}, the first at {round(body[0][0][2], 1)}, from {round(body[0][0][1], 1)} across")
    start = next((index for index, line in enumerate(lines) if text_of(line).startswith("SC3a prose")), None)
    if start is not None:
        found = [lines[start]]
        for line in lines[start + 1 :]:
            if line[0][5].startswith("SC") and not (len(line) > 1 and line[1][5] == "header"):
                break
            if not line[0][5].startswith("SC"):
                found.append(line)
        print(f"  SC3a prose: {len(found)} lines, ending: " + " | ".join(f"{line[-1][5]} {round(line[-1][3] - LEFT)}" for line in found[:12]))
    print("\n== SC4: endnotes of 49, 60 and 10 lines after a line; the separator 1 line tall, the continuation separator 3")
    print("   (docx/layout: the continuation separator above an endnote continued on the next page, as PG8)")
    notes_by_page(lines, "SC4")


def sections2_probes(base):
    lines = read(base)
    print("== SC5: endnotes of 5 and 5 lines after 50 lines, so only the separator fits below them; the separator 1 line tall,")
    print("   the continuation separator 3 (docx/layout stops)")
    last = first(lines, "SC5", "49")
    if last:
        print(f"  SC5 49 at {round(last[0][2] - TOP, 1)} below the margin, on page {last[0][0]}")
    notes_by_page(lines, "SC5")


def endnotes_probes(base):
    lines = read(base)
    probe = "EN" + base[-1]
    print(f"== {probe}: endnotes of lines exactly 288 tall, on the pages after the first, below the continuation separator")
    print("   (EN1: 47 fit with the separator's 268.55 counted, 48 without; EN2, the separator 1100 tall: 44 with it counted,")
    print("   48 without; EN3: a first line of 183, then 47 with the separator counted unless a line may go 29.55 past the margin)")
    notes_by_page(lines, probe)


PROBES = {
    "word-watertight-text": text_probes,
    "word-watertight-tables": tables_probes,
    "word-watertight-pages": pages_probes,
    "word-watertight-markup": markup_probes,
    "word-watertight-settings": settings_probes,
    "word-watertight-fields": fields_probes,
    "word-watertight-stops": stops_probes,
    "word-watertight-sections": sections_probes,
    "word-watertight-sections2": sections2_probes,
    "word-watertight-endnotes1": endnotes_probes,
    "word-watertight-endnotes2": endnotes_probes,
    "word-watertight-endnotes3": endnotes_probes,
}

if __name__ == "__main__":
    base = sys.argv[1]
    name = os.path.basename(base)
    PROBES[name](base)
