# Reads the probes of word-equations2.ts, and word-equations.ts, from a PDF of them saved from Word: where Word drew each
# character of each equation, and how far each is from the next, from the PDF's own content, where Word draws each
# string of an equation's characters at a place of its own (`Tm`), in its font for maths, Cambria Math, often a character
# to each.
#
#   python3 word-equations2.py word-equations2.pdf
#
# Lengths are in twips, across the page from the left margin. Each line prints its probe, from the text before it, then
# each character of its equations with how far it is from the next character, of the equation or of the text after it,
# which is its width and the room Word puts after it: an italic letter's italic correction, and the space round an
# operator. It reads the content's text as Word for Mac writes it: in a space of 300 to the inch (`0.24 0 0 0.24 cm`),
# each font's characters coded by one byte and turned into text by the font's `ToUnicode`.
import re
import sys
import zlib

LEFT = 1440
# Twips in a unit of the content's space, 1/300 inch
UNIT = 4.8
# How far apart, in units, characters of one line may be drawn down the page
LINE = 8
# What a character whose text its font doesn't give is read as
UNKNOWN = "\ufffd"


def objects(data):
    """The PDF's objects, by their numbers: their dictionaries and their streams, uncompressed"""
    found = {}
    for number, body in re.findall(rb"(\d+) 0 obj(.*?)endobj", data, re.S):
        stream = re.search(rb"stream\r?\n(.*?)\r?\nendstream", body, re.S)
        content = body
        if stream:
            try:
                content = body[: stream.start()] + zlib.decompress(stream.group(1))
            except zlib.error:
                content = body
        found[int(number)] = content
    return found


def to_unicode(cmap):
    """The text each code of a font stands for, from its ToUnicode CMap"""
    codes = {}
    text = cmap.decode("latin1")
    for block in re.findall(r"beginbfchar(.*?)endbfchar", text, re.S):
        for code, value in re.findall(r"<([0-9a-fA-F]+)>\s*<([0-9a-fA-F ]+)>", block):
            codes[int(code, 16)] = bytes.fromhex(value.replace(" ", "")).decode("utf-16-be")
    for block in re.findall(r"beginbfrange(.*?)endbfrange", text, re.S):
        for start, end, value in re.findall(r"<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>", block):
            first = int.from_bytes(bytes.fromhex(value), "big")
            for offset, code in enumerate(range(int(start, 16), int(end, 16) + 1)):
                codes[code] = chr(first + offset)
    return codes


def fonts_of(found, resources):
    """Each font a page's resources name, by its name, as (base font, the text of each code, the width of each code in
    thousandths of its size)"""
    fonts = {}
    font_dict = re.search(rb"/Font\s*<<(.*?)>>", resources, re.S)
    if not font_dict:
        reference = re.search(rb"/Font\s+(\d+) 0 R", resources)
        font_dict = re.search(rb"<<(.*?)>>", found[int(reference.group(1))], re.S) if reference else None
    for name, number in re.findall(rb"/(\w+)\s+(\d+) 0 R", font_dict.group(1) if font_dict else b""):
        font = found[int(number)]
        base = re.search(rb"/BaseFont\s*/(\S+)", font)
        cmap = re.search(rb"/ToUnicode\s+(\d+) 0 R", font)
        first = re.search(rb"/FirstChar\s+(\d+)", font)
        widths = re.search(rb"/Widths\s*\[([^\]]*)\]", font)
        advances = {}
        if first and widths:
            advances = {int(first.group(1)) + index: float(width) for index, width in enumerate(widths.group(1).split())}
        fonts[name.decode()] = (
            base.group(1).decode() if base else "",
            to_unicode(found[int(cmap.group(1))]) if cmap else {},
            advances,
        )
    return fonts


def shown_parts(operand):
    """The parts of a Tj or TJ's operand, in order: the bytes of each string, and each number between them, by which TJ
    moves the next string back, in thousandths of the font's size"""
    parts = []
    for raw, number in re.findall(rb"\(((?:\\.|[^\\)])*)\)|(-?[\d.]+)", operand):
        if number:
            parts.append(float(number))
        else:
            escapes = {b"n": b"\n", b"r": b"\r", b"t": b"\t", b"b": b"\b", b"f": b"\f"}
            parts.append(re.sub(rb"\\([nrtbf()\\])", lambda escape: escapes.get(escape.group(1), escape.group(1)), raw))
    return parts


def glyphs_of_page(found, page):
    """Each character drawn on a page: (x in twips from the left margin, y, font, text, its width in the font's thousandths
    of an em, whether it is drawn at a place of its own), each placed by its string's place and the widths of the
    characters before it in the string, with the character spacing (`Tc`) and TJ's numbers"""
    resources = re.search(rb"/Resources\s+(\d+) 0 R", page)
    resource_dict = found[int(resources.group(1))] if resources else page
    fonts = fonts_of(found, resource_dict)
    contents = re.search(rb"/Contents\s+(\d+) 0 R", page)
    content = found[int(contents.group(1))] if contents else b""
    drawn = []
    for block in re.findall(rb"BT(.*?)ET", content, re.S):
        # Each operator of the block in turn, with its operands: a place (Tm), a font (Tf), character spacing (Tc) and
        # strings shown (Tj, TJ)
        x = y = size = character_spacing = 0.0
        scale = 1.0
        # Whether the next character is drawn at a place of its own, rather than after the one before in its string, at
        # its width in the PDF's font, which is rounded to a thousandth of an em
        placed = False
        base, codes, advances = "", {}, {}
        operators = rb"(\[(?:\\.|[^\]\\])*\]|\((?:\\.|[^\\)])*\))\s*(TJ|Tj)|((?:[-\d.]+\s+){6})Tm|/(\w+)\s+([\d.]+)\s+Tf|([-\d.]+)\s+Tc"
        for shown, show, matrix, font, font_size, spacing in re.findall(operators, block, re.S):
            if matrix:
                values = [float(value) for value in matrix.split()]
                scale, x, y = values[0], values[4], values[5]
                placed = True
            elif font:
                base, codes, advances = fonts.get(font.decode(), ("", {}, {}))
                size = float(font_size)
            elif spacing:
                character_spacing = float(spacing)
            elif show:
                em = scale * size
                for part in shown_parts(shown):
                    if isinstance(part, float):
                        x -= part / 1000 * em
                        continue
                    for byte in part:
                        drawn.append((x * UNIT - LEFT, y, base, codes.get(byte, UNKNOWN), advances.get(byte, 0), placed))
                        placed = False
                        x += advances.get(byte, 0) / 1000 * em + character_spacing * em
    return drawn


def rows_of(path):
    """Each line's characters, from the top of each page: [(probe, [(x, font, text, width, placed)])]"""
    data = open(path, "rb").read()
    found = objects(data)
    pages = [body for body in found.values() if re.search(rb"/Type\s*/Page[^s]", body)]
    # The pages in their order, by the page tree's kids
    kids = re.search(rb"/Kids\s*\[([^\]]*)\]", next(body for body in found.values() if re.search(rb"/Type\s*/Pages", body)))
    order = [int(number) for number in re.findall(rb"(\d+) 0 R", kids.group(1))] if kids else []
    pages = [found[number] for number in order] or pages
    rows = []
    for page in pages:
        drawn = glyphs_of_page(found, page)
        # The lines, from the top, each the characters within a couple of units of its baseline, as an equation's may be
        # drawn a little above or below the text's
        baselines = []
        for y in sorted({item[1] for item in drawn}, reverse=True):
            if not baselines or baselines[-1] - y > LINE:
                baselines.append(y)
        rows.append([])
        for y in baselines:
            row = sorted(
                ((x, base, text, width, placed) for x, line_y, base, text, width, placed in drawn if abs(line_y - y) <= LINE),
                key=lambda item: item[0],
            )
            name = re.match(r"(EQ\d+\w*)", "".join(item[2] for item in row))
            rows[-1].append((name.group(1) if name else "?", row))
    return rows


def main(path):
    for index, page in enumerate(rows_of(path), start=1):
        print(f"\n== page {index}")
        for name, row in page:
            maths = [i for i, item in enumerate(row) if "Math" in item[1]]
            if not maths:
                continue
            shown = []
            for i in range(maths[0], maths[-1] + 1):
                if "Math" not in row[i][1]:
                    continue
                after = row[i + 1][0] - row[i][0] if i + 1 < len(row) else None
                shown.append(f"{row[i][2]}@{row[i][0]:.1f}" + (f"(+{after:.2f})" if after is not None else ""))
            print(f"   {name:7} " + "  ".join(shown))


# The size of the probes' equations, in twips to the em, and the spaces between their atoms, in twips: 3, 4 and 5
# eighteenths of an em
EM = 220
THIN, MEDIUM, THICK = (EM * spaces / 18 for spaces in (3, 4, 5))
# What follows each character in the probes this reads its width from, by what is between them: nothing, or a space of
# these eighteenths
BINARY = set("+\u2212\u00d7\u00f7\u00b1\u2213\u22c5\u2217\u2218")
RELATION = set("=<>\u2264\u2265\u2260\u2248\u2261\u223c\u2192\u2190")
PUNCTUATION = set(",;:!?")


def widths(paths):
    """The width and italic correction of each character of the probes' equations, in thousandths of an em, as Word drew
    them: a character's width is how far the next is from it where nothing is between them, and the space Word puts after
    it where it is an operator or punctuation, where both are drawn at places of their own, or else its width in the PDF's
    font, to a thousandth of an em. An italic letter's italic correction
    is what is left of how far "+" is from it in EQ6 (`L+1`), past its width and the 4 eighteenths before the "+"."""
    measured = {}
    font_widths = {}
    corrections = {}
    for path in paths:
        for page in rows_of(path):
            for name, row in page:
                maths = [i for i, item in enumerate(row) if "Math" in item[1]]
                # EQ6's equations, each a letter, "+" and "1"
                first = maths[0] if [row[i][2] for i in maths][1:] == ["+", "1"] else None
                for i, (x, base, text, width, placed) in enumerate(row):
                    if "Math" not in base:
                        continue
                    font_widths.setdefault(text, width)
                    following = row[i + 1] if i + 1 < len(row) else None
                    # Only how far apart two characters drawn at places of their own are is Word's own
                    if following is None or not (placed and following[4]):
                        continue
                    gap = following[0] - x
                    next_text = following[2]
                    if i == first:
                        corrections[text] = gap
                        continue
                    letter_follows = "Math" in following[1] and (next_text.isalnum() or ord(next_text[0]) > 0xFFFF or next_text in "\u2032")
                    if text in BINARY and letter_follows:
                        measured.setdefault(text, gap - MEDIUM)
                    elif text in RELATION and letter_follows:
                        measured.setdefault(text, gap - THICK)
                    elif text in PUNCTUATION and letter_follows:
                        measured.setdefault(text, gap - THIN)
                    elif letter_follows or (text in "()[]{}|/" and "Math" in following[1]):
                        measured.setdefault(text, gap)
    table = {}
    for text, width in font_widths.items():
        if text == UNKNOWN:
            continue
        advance = measured.get(text, width / 1000 * EM)
        correction = corrections[text] - advance - MEDIUM if text in corrections else 0
        # Cambria Math's space, which its text in Word's PDF gives as a tab
        table[" " if text == "\t" else text] = [round(advance / EM * 1000, 2), round(max(correction, 0) / EM * 1000, 2)]
    return table


if sys.argv[1] == "--json":
    import json

    print(json.dumps(widths(sys.argv[2:]), ensure_ascii=False, indent=1, sort_keys=True))
else:
    main(sys.argv[1])
