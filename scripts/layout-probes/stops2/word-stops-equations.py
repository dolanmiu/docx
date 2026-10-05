# Reads Word's PDF of word-stops-equations.ts's documents: for each probe, how wide Word made its equation in its line of
# text, and how far its line goes above and below its baseline, from where Word drew the lines of Calibri 11 around it,
# and each glyph Word drew for the equation, with where it is from the line's baseline. Word draws text at places of
# 1/300 inch, so the ascent and descent are each pinned to an interval: the line's baseline is within half a unit of where
# Word drew it, and each line of Calibri 11 is 2500/2048 of its size below the one before (`word-equations.docx` EQ2), so
# a run of them pins their baselines closer. With --json, it prints these as JSON, in points, by probe.
#
#   python3 scripts/layout-probes/stops2/word-stops-equations.py scripts/layout-probes/stops2/word-stops-equations.pdf [--json]
#
# It reads the PDF's own content, as Word for Mac writes it: each page in a space of 300 units to the inch
# (`0.24 0 0 0.24 0 y cm`), with each string of characters at a place of its own (`Tm`), in fonts coded by one byte. The
# smaller glyphs Cambria Math has for scripts have no text in Word's PDF, so they are printed as "?", with their size.
import json
import re
import sys
import zlib

# Points in a unit of the content's space, 1/300 inch, and the page's margin, in units
UNIT = 0.24
MARGIN = 300
# Calibri 11's line, as Word lays it out: its ascent and descent, in units
ASCENT = 1950 / 2048 * 11 / UNIT
DESCENT = 550 / 2048 * 11 / UNIT
# Calibri 11's size in units, which Word draws at 46 (11.04 points) but lays out at 11 points
SIZE = 11 / UNIT


def objects(data):
    """The PDF's objects, by their numbers: their dictionaries and their streams, uncompressed"""
    found = {}
    for number, body in re.findall(rb"(\d+) 0 obj(.*?)endobj", data, re.S):
        stream = re.search(rb"stream\r?\n(.*?)endstream", body, re.S)
        content = body
        if stream:
            try:
                # Past the end of the compressed data, such as the line break before endstream, is left out
                content = body[: stream.start()] + zlib.decompressobj().decompress(stream.group(1))
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
    """Each font a page's resources name: (base font, the text of each code, the width of each code in thousandths of its size)"""
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


def read_string(data, at):
    """A literal string starting at data[at], its opening bracket: (its bytes, where it ends)"""
    depth = 0
    out = bytearray()
    at += 1
    while True:
        character = data[at]
        if character == 0x5C:
            following = data[at + 1]
            if 0x30 <= following <= 0x37:
                digits = re.match(rb"[0-7]{1,3}", data[at + 1 : at + 4]).group(0)
                out.append(int(digits, 8))
                at += 1 + len(digits)
                continue
            out.append({0x6E: 10, 0x72: 13, 0x74: 9, 0x62: 8, 0x66: 12}.get(following, following))
            at += 2
            continue
        if character == 0x28:
            depth += 1
        elif character == 0x29:
            if depth == 0:
                return bytes(out), at + 1
            depth -= 1
        out.append(character)
        at += 1


def operators(block):
    """The text operators of a BT ... ET block, in turn, with their operands: Tm, Tf, Tc, and Tj or TJ's strings and numbers"""
    stack = []
    at = 0
    while at < len(block):
        character = block[at]
        if chr(character).isspace():
            at += 1
        elif character == 0x28:
            text, at = read_string(block, at)
            stack.append(text)
        elif character == 0x5B:
            parts = []
            at += 1
            while True:
                while chr(block[at]).isspace():
                    at += 1
                if block[at] == 0x5D:
                    at += 1
                    break
                if block[at] == 0x28:
                    text, at = read_string(block, at)
                    parts.append(text)
                else:
                    number = re.match(rb"[-\d.]+", block[at:]).group(0)
                    parts.append(float(number))
                    at += len(number)
            stack.append(parts)
        elif character == 0x2F:
            name = re.match(rb"/([^\s/\[\(]+)", block[at:]).group(1)
            stack.append(name.decode())
            at += 1 + len(name)
        else:
            word = re.match(rb"[^\s/\[\(]+", block[at:]).group(0)
            at += len(word)
            try:
                stack.append(float(word))
                continue
            except ValueError:
                pass
            yield word.decode("latin1"), stack
            stack = []


def glyphs_of_page(found, page):
    """Each character drawn on a page: (x, y in units from the top and left margins, font, text, size in units, width in thousandths)"""
    resources = re.search(rb"/Resources\s+(\d+) 0 R", page)
    fonts = fonts_of(found, found[int(resources.group(1))] if resources else page)
    contents = re.search(rb"/Contents\s+(\d+) 0 R", page)
    content = found[int(contents.group(1))] if contents else b""
    box = re.search(rb"/MediaBox\s*\[\s*[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+([-\d.]+)\s*\]", page)
    height = float(box.group(1)) if box else 841.92
    drawn = []
    for matrix, block in re.findall(rb"((?:[-\d.]+\s+){6})cm\s+BT(.*?)ET", content, re.S):
        a, _, _, d, e, f = [float(value) for value in matrix.split()]
        x = y = size = spacing = 0.0
        scale = 1.0
        base, codes, advances = "", {}, {}
        for operator, operands in operators(block):
            if operator == "Tm":
                scale, x, y = operands[-6], operands[-2], operands[-1]
            elif operator == "Tf":
                base, codes, advances = fonts.get(operands[-2], ("", {}, {}))
                size = operands[-1]
            elif operator == "Tc":
                spacing = operands[-1]
            elif operator in ("Tj", "TJ"):
                em = scale * size
                for part in operands[-1] if operator == "TJ" else [operands[-1]]:
                    if isinstance(part, float):
                        x -= part / 1000 * em
                        continue
                    for byte in part:
                        across = (a * x + e) / UNIT - MARGIN
                        down = (height - (d * y + f)) / UNIT - MARGIN
                        drawn.append((across, down, base, codes.get(byte, "?"), em, advances.get(byte, 0)))
                        x += advances.get(byte, 0) / 1000 * em + spacing * em
    return drawn


def pages_of(path):
    """Each page's characters, in the pages' order, from the page tree's root down"""
    data = open(path, "rb").read()
    found = objects(data)
    catalog = next(body for body in found.values() if re.search(rb"/Type\s*/Catalog", body))
    root = int(re.search(rb"/Pages\s+(\d+) 0 R", catalog).group(1))

    def leaves(number):
        node = found[number]
        if not re.search(rb"/Type\s*/Pages", node):
            return [number]
        kids = re.search(rb"/Kids\s*\[([^\]]*)\]", node).group(1)
        return [leaf for kid in re.findall(rb"(\d+) 0 R", kids) for leaf in leaves(int(kid))]

    return [glyphs_of_page(found, found[number]) for number in leaves(root)]


def probes_of(pages):
    """Each probe's lines and equation, from its line "<name> above" to its line "<name> below": the lines of text on its page
    (their baselines, in units, and the characters of each), and the characters of its equation"""
    found = {}
    for number, drawn in enumerate(pages, 1):
        text = [glyph for glyph in drawn if "Math" not in glyph[2]]
        maths = [glyph for glyph in drawn if "Math" in glyph[2]]
        lines = {}
        for glyph in text:
            lines.setdefault(round(glyph[1]), []).append(glyph)
        baselines = sorted(lines)
        texts = ["".join(glyph[3] for glyph in sorted(lines[y])).strip() for y in baselines]
        for index, line in enumerate(texts):
            name = re.match(r"^(EQS?\d+\w*) above$", line)
            if not name or texts[index + 2 : index + 3] != [f"{name.group(1)} below"]:
                continue
            middle = baselines[index + 1]
            found[name.group(1)] = {
                "page": number,
                "baselines": baselines,
                "lines": texts,
                "index": index + 1,
                "line": sorted(lines[middle]),
                "maths": sorted(glyph for glyph in maths if baselines[index] < glyph[1] < baselines[index + 2]),
            }
    return found


def pinned(probe, equations):
    """The interval each of a line's baselines is in, in units, pinned by the runs of lines of Calibri 11 around it: each
    within half a unit of where Word drew it, and a line of Calibri 11 below the one before. Two lines are taken as next to
    each other only where Word drew them a line of Calibri 11 apart, so lines without text between them, such as those of an
    equation broken across lines, break the run"""
    baselines = probe["baselines"]
    calibri = [i not in equations for i in range(len(baselines))]
    bounds = [[y - 0.5, y + 0.5] for y in baselines]
    pitch = ASCENT + DESCENT
    calibri = [
        alone and (i + 1 >= len(baselines) or abs(baselines[i + 1] - baselines[i] - pitch) < 1.5 or i + 1 in equations)
        for i, alone in enumerate(calibri)
    ]
    for _ in range(3):
        for i in range(len(baselines) - 1):
            if calibri[i] and calibri[i + 1]:
                bounds[i + 1] = [max(bounds[i + 1][0], bounds[i][0] + pitch), min(bounds[i + 1][1], bounds[i][1] + pitch)]
        for i in range(len(baselines) - 2, -1, -1):
            if calibri[i] and calibri[i + 1]:
                bounds[i] = [max(bounds[i][0], bounds[i + 1][0] - pitch), min(bounds[i][1], bounds[i + 1][1] - pitch)]
    return bounds


def read(path):
    """Word's numbers for each probe, in points: its equation's width in a line of text, and its line's ascent, descent and
    height, as intervals"""
    pages = pages_of(path)
    probes = probes_of(pages)
    # The lines of equations on each page, which aren't lines of Calibri 11 alone: the probes', and those with an equation's
    # glyphs on their baseline
    equations = {}
    for probe in probes.values():
        equations.setdefault(probe["page"], set()).add(probe["baselines"][probe["index"]])
    for number, drawn in enumerate(pages, 1):
        on = {round(glyph[1]) for glyph in drawn if "Math" in glyph[2]}
        equations.setdefault(number, set()).update(on)
    out = {}
    for name, probe in probes.items():
        others = {i for i, y in enumerate(probe["baselines"]) if y in equations[probe["page"]]}
        bounds = pinned(probe, others)
        i = probe["index"]
        top = [bounds[i - 1][0] + DESCENT, bounds[i - 1][1] + DESCENT]
        bottom = [bounds[i + 1][0] - ASCENT, bounds[i + 1][1] - ASCENT]
        entry = {
            "ascent": [round((bounds[i][0] - top[1]) * UNIT, 3), round((bounds[i][1] - top[0]) * UNIT, 3)],
            "descent": [round((bottom[0] - bounds[i][1]) * UNIT, 3), round((bottom[1] - bounds[i][0]) * UNIT, 3)],
            "height": [round((bottom[0] - top[1]) * UNIT, 3), round((bottom[1] - top[0]) * UNIT, 3)],
        }
        if probe["maths"]:
            first = min(glyph[0] for glyph in probe["maths"])
            before = [glyph for glyph in probe["line"] if glyph[0] < first]
            after = [glyph for glyph in probe["line"] if glyph[0] > first]
            if before and after:
                end = before[-1][0] + before[-1][5] / 1000 * SIZE
                entry["width"] = round((after[0][0] - end) * UNIT, 3)
        out[name] = entry
    return out, probes


def main():
    path = sys.argv[1]
    numbers, probes = read(path)
    if "--json" in sys.argv:
        print(json.dumps(numbers, indent=1, sort_keys=True))
        return
    for name, entry in numbers.items():
        probe = probes[name]
        print(f"\n{name}  (page {probe['page']})")
        width = f"width {entry['width']:.3f}  " if "width" in entry else ""
        print(f"    {width}ascent {entry['ascent']}  descent {entry['descent']}  height {entry['height']}  (points)")
        baseline = probe["baselines"][probe["index"]]
        for x, y, font, text, size, _ in probe["maths"]:
            print(f"    {text!r:8} {font.split('+')[-1]:14} size {size * UNIT:5.2f}  x {x * UNIT:8.2f}  rise {(baseline - y) * UNIT:6.2f}")


main()
