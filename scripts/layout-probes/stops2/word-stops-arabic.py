# Reads the widths of word-stops-arabic.ts's Arabic letters from a PDF of it saved from Word: how wide Word draws each
# letter in each of its forms, isolated, final, initial and medial, and each lam-alef ligature, in each of the width
# tables' fonts, plain and bold, and the font it draws each in. Each word is ten copies of a form, parted by zero-width
# non-joiners, after its label in Calibri 6, such as u0628m; a copy's width is how far apart Word puts the copies, from
# the first to the last on one line, less the tatweels around the letter, at the width of the tatweels' word, t0640.
#
#   python3 word-stops-arabic.py word-stops-arabic.pdf [--json]
#
# It reads word-stops-arabic.json, which the probe's script writes beside the document, from beside the PDF. Widths are
# in thousandths of an em of the text's size, 10 points. It reads the PDF with word-stops-more-widths.py's functions.
# cspell:ignore tatweel tatweels
import importlib.util
import json
import os
import re
import sys

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location(
    "more_widths", os.path.join(os.path.dirname(os.path.abspath(__file__)), "word-stops-more-widths.py")
)
pdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdf)

probe = json.load(open(os.path.splitext(sys.argv[1])[0] + ".json", encoding="utf8"))
SIZE = probe["size"]
COPIES = probe["copies"]
FACES = probe["faces"]
PARAGRAPHS = probe["paragraphs"]
LABEL_SIZE = 6


def key_of(face):
    """The name of a font's face, such as "Calibri bold\""""
    return f"{face['font']}{' bold' if face['bold'] else ''}"


def is_label(glyph):
    return abs(glyph["size"] - LABEL_SIZE) < 0.5


def main(path):
    found = pdf.objects(open(path, "rb").read())
    glyphs = [glyph for page in pdf.pages_of(found) for glyph in pdf.glyphs_of(found, page)]
    advances = {key_of(face): {} for face in FACES}
    index = 0
    while index < len(glyphs):
        text = "".join(glyph["text"] for glyph in glyphs[index : index + 10])
        heading = re.match(r"AR1 (\d+) ", text)
        if not (glyphs[index]["text"] == "A" and not is_label(glyphs[index]) and heading):
            index += 1
            continue
        paragraph = int(heading.group(1)) - 1
        face = key_of(FACES[paragraph // len(PARAGRAPHS)])
        index += len(heading.group(0))
        for word in PARAGRAPHS[paragraph % len(PARAGRAPHS)]:
            # Its label, in small glyphs
            while index < len(glyphs) and not is_label(glyphs[index]):
                index += 1
            index += len(word["label"])
            drawn = []
            while index < len(glyphs) and not is_label(glyphs[index]) and not glyphs[index]["text"] == "A":
                drawn.append(glyphs[index])
                index += 1
            # Not the spaces round it, which Courier New's glyphs map to U+FFFD, nor the paragraph's mark
            copies = [
                glyph
                for glyph in drawn
                if abs(glyph["size"] - SIZE) < 0.5 and not glyph["text"].isspace() and glyph["text"] != "\ufffd"
            ]
            if not copies or len(copies) % COPIES != 0:
                continue
            each = len(copies) // COPIES
            starts = sorted(copies, key=lambda glyph: (-glyph["y"], glyph["x"]))[::each]
            line = [start for start in starts if abs(start["y"] - starts[0]["y"]) < 1]
            if len(line) < 2:
                continue
            advance = abs(line[-1]["x"] - line[0]["x"]) * 1000 / SIZE / (len(line) - 1)
            fonts = sorted({glyph["font"] for glyph in copies})
            advances[face][word["label"]] = {"advance": advance, "tatweels": word["tatweels"], "font": "+".join(fonts)}
    widths = {}
    for face, words in advances.items():
        tatweel = words.get("t0640", {}).get("advance")
        widths[face] = {
            label: {
                "width": round(read["advance"] - read["tatweels"] * tatweel, 2) if tatweel is not None else None,
                "font": read["font"],
            }
            for label, read in words.items()
        }
    if "--json" in sys.argv:
        print(json.dumps(widths, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
        return
    for face, words in widths.items():
        expected = sum(len(paragraph) for paragraph in PARAGRAPHS)
        print(f"{face}: {len(words)} of {expected} words, drawn in {sorted({read['font'] for read in words.values()})}")
        for label in sorted(words)[:12]:
            print(f"    {label}: {words[label]['width']}")


if __name__ == "__main__":
    main(sys.argv[1])
