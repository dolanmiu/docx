# Reads the widths of word-stops-more-widths.ts from a PDF of it saved from Word: how wide Word draws each character of
# Hebrew, Arabic, Devanagari, Thai, box drawing, blocks, geometric shapes, symbols and dingbats in each of the width tables'
# fonts, plain and bold, and the font it draws each in, from the PDF's own content: each character's word is ten of it,
# after its code point in Calibri 6, and Word draws each glyph with the width its font's `Widths` give it, so a
# character's width is a tenth of its glyphs' widths, at the size they are drawn. It reads the ascent and descent of each
# font the characters are drawn in from its descriptor too, which is how far above and below the baseline Word makes room
# for it in a line (Calibri's 952 and 269 thousandths of an em are its lines' 1220.7).
#
#   python3 word-stops-more-widths.py word-stops-more-widths.pdf [--json]
#
# It reads the .json the probe's script writes beside the document, beside this reader. Widths are in thousandths of an em
# of the characters' size, 10 points. Without --json it prints, for each face, which fonts Word drew its characters in, and
# where a character's glyphs are drawn closer together or further apart than their widths, as on a line Word squeezed.
# cspell:ignore Tm Tf Tc Tj TJ cm bfchar bfrange endbfchar endbfrange
import json
import os
import re
import sys
import zlib

# The probe's .json beside the PDF, such as word-stops-more-widths-office.json, or this one's own beside the reader
BESIDE = os.path.splitext(sys.argv[1])[0] + ".json" if __name__ == "__main__" and len(sys.argv) > 1 else ""
OWN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "word-stops-more-widths.json")
probe = json.load(open(BESIDE if os.path.exists(BESIDE) else OWN, encoding="utf8"))
SIZE = probe["size"]
COPIES = probe["copies"]
FACES = probe["faces"]
PARAGRAPHS = probe["paragraphs"]
# The size of the code points written before each character's word, in points
LABEL_SIZE = 6


def key_of(face):
    """The name of a font's face, such as "Calibri bold\""""
    return f"{face['font']}{' bold' if face['bold'] else ''}{' italic' if face.get('italic') else ''}"


def objects(data):
    """The PDF's objects, by their numbers: their dictionaries and their streams, uncompressed"""
    found = {}
    for number, body in re.findall(rb"(\d+) 0 obj(.*?)endobj", data, re.S):
        stream = re.search(rb"stream\r?\n(.*?)\r?\nendstream", body, re.S)
        content = body
        if stream:
            # Word ends some streams with bytes after their compressed data, which zlib.decompress takes as an error, as
            # it did a page of word-stops-font-widths' in Book Antiqua and in Impact, bold
            try:
                content = body[: stream.start()] + zlib.decompressobj().decompress(stream.group(1))
            except zlib.error:
                content = body
        found[int(number)] = content
    return found


def pages_of(found):
    """The pages, in their order in the page tree"""
    root = next(number for number, body in found.items() if re.search(rb"/Type\s*/Pages", body) and not re.search(rb"/Parent", body))
    order = []

    def walk(number):
        body = found[number]
        if re.search(rb"/Type\s*/Pages", body):
            for kid in re.findall(rb"(\d+) 0 R", re.search(rb"/Kids\s*\[([^\]]*)\]", body).group(1)):
                walk(int(kid))
        else:
            order.append(body)

    walk(root)
    return order


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


def fonts_of(found, page):
    """Each font a page's resources name: its name without a subset's prefix, the text of each code, the width of each
    code in thousandths of its size, and its descriptor's ascent and descent"""
    resources = re.search(rb"/Resources\s+(\d+) 0 R", page)
    resource_dict = found[int(resources.group(1))] if resources else page
    font_dict = re.search(rb"/Font\s*<<(.*?)>>", resource_dict, re.S)
    if not font_dict:
        reference = re.search(rb"/Font\s+(\d+) 0 R", resource_dict)
        font_dict = re.search(rb"<<(.*?)>>", found[int(reference.group(1))], re.S) if reference else None
    fonts = {}
    for name, number in re.findall(rb"/(\w+)\s+(\d+) 0 R", font_dict.group(1) if font_dict else b""):
        font = found[int(number)]
        base = re.search(rb"/BaseFont\s*/(\S+)", font)
        cmap = re.search(rb"/ToUnicode\s+(\d+) 0 R", font)
        first = re.search(rb"/FirstChar\s+(\d+)", font)
        widths = re.search(rb"/Widths\s*\[([^\]]*)\]", font)
        descriptor = re.search(rb"/FontDescriptor\s+(\d+) 0 R", font)
        described = found[int(descriptor.group(1))] if descriptor else b""
        ascent = re.search(rb"/Ascent\s+(-?[\d.]+)", described)
        descent = re.search(rb"/Descent\s+(-?[\d.]+)", described)
        fonts[name.decode()] = {
            "name": re.sub(r"^[A-Z]{6}\+", "", base.group(1).decode()) if base else "",
            "codes": to_unicode(found[int(cmap.group(1))]) if cmap else {},
            "widths": {int(first.group(1)) + index: float(width) for index, width in enumerate(widths.group(1).split())}
            if first and widths
            else {},
            "ascent": float(ascent.group(1)) if ascent else None,
            "descent": -float(descent.group(1)) if descent else None,
        }
    return fonts


def multiply(one, other):
    a, b, c, d, e, f = one
    g, h, i, j, k, l = other
    return [a * g + b * i, a * h + b * j, c * g + d * i, c * h + d * j, e * g + f * i + k, e * h + f * j + l]


TOKENS = re.compile(rb"\[(?:\\.|[^\]\\])*\]|\((?:\\.|[^\\)])*\)|/[^\s/\[\]()<>]+|[-+]?\d*\.?\d+|[A-Za-z'\"*]+")
ESCAPES = {b"n": b"\n", b"r": b"\r", b"t": b"\t", b"b": b"\b", b"f": b"\f"}


def shown_parts(operand):
    """The parts of a Tj or TJ's operand: the bytes of each string, and the numbers between them"""
    parts = []
    for raw, number in re.findall(rb"\(((?:\\.|[^\\)])*)\)|(-?[\d.]+)", operand):
        if number:
            parts.append(float(number))
        else:
            parts.append(re.sub(rb"\\([nrtbf()\\])", lambda escape: ESCAPES.get(escape.group(1), escape.group(1)), raw))
    return parts


def glyphs_of(found, page):
    """Each glyph drawn on a page, in the order it is drawn: its text, font, width in thousandths of its size, the size it
    is drawn at in points, and where it is across the page, in points"""
    fonts = fonts_of(found, page)
    contents = re.search(rb"/Contents\s+(\d+) 0 R", page)
    content = found[int(contents.group(1))] if contents else b""
    stack, matrix, operands, drawn = [], [1, 0, 0, 1, 0, 0], [], []
    text_matrix, along, size, spacing, font = [1, 0, 0, 1, 0, 0], 0.0, 1.0, 0.0, None
    for token in TOKENS.findall(content):
        if re.fullmatch(rb"[-+]?\d*\.?\d+", token) or token[:1] in (b"(", b"[", b"/"):
            operands.append(float(token) if token[:1] not in (b"(", b"[", b"/") else token)
            continue
        if token == b"q":
            stack.append(matrix[:])
        elif token == b"Q":
            matrix = stack.pop() if stack else [1, 0, 0, 1, 0, 0]
        elif token == b"cm":
            matrix = multiply(operands[-6:], matrix)
        elif token in (b"BT", b"Tm"):
            text_matrix, along = (operands[-6:] if token == b"Tm" else [1, 0, 0, 1, 0, 0]), 0.0
        elif token == b"Tf":
            font, size = fonts.get(operands[-2].decode()[1:]), operands[-1]
        elif token == b"Tc":
            spacing = operands[-1]
        elif token in (b"Tj", b"TJ") and font is not None:
            full = multiply(text_matrix, matrix)
            scale = (full[0] ** 2 + full[1] ** 2) ** 0.5
            for part in shown_parts(operands[-1]):
                if isinstance(part, float):
                    along -= part / 1000 * size
                    continue
                for byte in part:
                    width = font["widths"].get(byte, 0)
                    drawn.append(
                        {
                            "text": font["codes"].get(byte, "�"),
                            "font": font["name"],
                            "width": width,
                            "size": size * scale,
                            "x": full[4] + along * full[0],
                            "y": full[5] + along * full[1],
                            "ascent": font["ascent"],
                            "descent": font["descent"],
                        }
                    )
                    along += width / 1000 * size + spacing * size
        operands = []
    return drawn


def main(path):
    found = objects(open(path, "rb").read())
    glyphs = [glyph for page in pages_of(found) for glyph in glyphs_of(found, page)]
    widths = {key_of(face): {} for face in FACES}
    fonts = {}
    squeezed = []
    # The paragraphs of W, in order: "W1 " in Calibri 10, then each character's code point in Calibri 6, a space, its ten
    # copies and a space
    index = 0
    while index < len(glyphs):
        glyph = glyphs[index]
        label = re.match(r"W(\d+) ", "".join(g["text"] for g in glyphs[index : index + 6]))
        if not (glyph["text"] == "W" and abs(glyph["size"] - SIZE) < 0.5 and label):
            index += 1
            continue
        paragraph = int(label.group(1)) - 1
        if paragraph >= len(FACES) * len(PARAGRAPHS):
            break
        face = key_of(FACES[paragraph // len(PARAGRAPHS)])
        codes = PARAGRAPHS[paragraph % len(PARAGRAPHS)]
        index += len(label.group(0))
        for code in codes:
            # Its code point, in small glyphs
            while index < len(glyphs) and not (glyphs[index]["text"] == "u" and abs(glyphs[index]["size"] - LABEL_SIZE) < 0.5):
                index += 1
            index += 5
            # Up to the next code point, or the paragraph's end, whose mark Word draws as a space at its size, 11 points
            word = []
            while index < len(glyphs) and not (
                (glyphs[index]["text"] == "u" and abs(glyphs[index]["size"] - LABEL_SIZE) < 0.5)
                or glyphs[index]["text"] == "W"
                or (word and abs(glyphs[index]["size"] - word[0]["size"]) > 0.5)
            ):
                word.append(glyphs[index])
                index += 1
            # Not the spaces round it, which Cambria's text calls tabs and Courier New's has no text for, nor the paragraph's
            # mark, at its own size
            copies = [glyph for glyph in word if abs(glyph["size"] - word[0]["size"]) < 0.3]
            while copies and (copies[0]["text"].isspace() or copies[0]["text"] == "\ufffd"):
                copies = copies[1:]
            while copies and (copies[-1]["text"].isspace() or copies[-1]["text"] == "\ufffd"):
                copies = copies[:-1]
            if not copies:
                continue
            # In thousandths of an em: how far apart Word puts the copies on a line, from the first to the last of the most
            # on one line, which is the width it lays the character out with, its glyph's width as the font has it, in
            # finer units than the 1000 of the PDF's widths: Arial's ═ is 1451 of 2048, 708.496, which the PDF writes as 708.
            # But for some, such as MS Gothic's ┒, whose glyph is 500, which Word lays out 519.5 apart in bold, as it makes
            # the bold face itself, drawing them further apart than their glyphs. A character drawn as several glyphs, such
            # as a mark on a dotted circle, is the distance between their first glyphs. Word draws text a little larger than
            # it lays it out, at sizes of whole units of its PDF's 1/300 inch, 10 points at 10.08
            if len(copies) % COPIES != 0:
                continue
            each = len(copies) // COPIES
            starts = copies[::each]
            runs = [[starts[0]]]
            for start in starts[1:]:
                if abs(start["y"] - runs[-1][-1]["y"]) < 1:
                    runs[-1].append(start)
                else:
                    runs.append([start])
            longest = max(runs, key=len)
            if len(longest) < 2:
                continue
            width = abs(longest[-1]["x"] - longest[0]["x"]) * 1000 / SIZE / (len(longest) - 1)
            pitches = sorted(abs(later["x"] - earlier["x"]) * 1000 / SIZE for earlier, later in zip(longest, longest[1:]))
            drawn_in = sorted({glyph["font"] for glyph in copies})
            glyph_widths = sum(glyph["width"] for glyph in copies) / COPIES
            widths[face][f"{code:04x}"] = {"width": round(width, 2), "glyphs": glyph_widths, "font": "+".join(drawn_in)}
            for glyph in copies:
                fonts.setdefault(glyph["font"], {"ascent": glyph["ascent"], "descent": glyph["descent"]})
            # Copies drawn other distances apart, as on a line Word squeezed or stretched
            if pitches[-1] - pitches[0] > 1.5:
                squeezed.append((face, f"{code:04x}", round(pitches[0], 1), round(pitches[-1], 1)))
    if "--json" in sys.argv:
        print(json.dumps({"widths": widths, "fonts": fonts}, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
        return
    for face, characters in widths.items():
        by_font = {}
        for code, read in characters.items():
            by_font.setdefault(read["font"], []).append(code)
        print(f"{face}: {len(characters)} characters")
        for font, codes in sorted(by_font.items(), key=lambda entry: -len(entry[1])):
            print(f"    {font}: {len(codes)}: {' '.join(codes[:16])}{' ...' if len(codes) > 16 else ''}")
    print("Fonts:", json.dumps(fonts, sort_keys=True))
    others = [(face, code, read) for face, characters in widths.items() for code, read in characters.items() if abs(read["width"] - read["glyphs"]) > 1]
    print(f"Laid out at other widths than their glyphs': {len(others)}")
    for face, code, read in others[:80]:
        print(f"    {face} {code}: {read['width']} apart, glyphs {read['glyphs']}, in {read['font']}")
    print(f"Copies other distances apart: {len(squeezed)}")
    for face, code, least, most in squeezed[:20]:
        print(f"    {face} {code}: {least} to {most}")


# Its functions read other probes' PDFs too, such as word-stops-arabic.py's
if __name__ == "__main__":
    main(sys.argv[1])
