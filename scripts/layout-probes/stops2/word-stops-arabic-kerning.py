# Reads how Word kerns Arabic's letters from a PDF of word-stops-arabic2.ts saved from Word (AR4): each paragraph, after
# its label in Calibri 6 such as "AR4 Arial 0628 p", is a right-to-left run of 42 words, one for each second letter in
# the order of the letters, each the first letter and the second (p) or the two between tatweels (t), with a space between
# each. A word's kerning is how far its glyphs' advances, which the PDF's font widths give, fall short of how wide Word
# draws it, from its first glyph to the end of its last, in thousandths of an em of its size, 10 points.
#
#   python3 word-stops-arabic-kerning.py word-stops-arabic-kerning.pdf [--json]
#
# It reads the PDF with word-stops-more-widths.py's functions. Glyphs the PDF's ToUnicode maps to nothing, as Calibri's
# letters mostly are, are letters all the same, and those of no width are marks, which take no room. Without --json it
# prints, for each face and context, the words found, the largest kerning and how many words are kerned by more than
# 10 thousandths, and fails when the PDF has no AR4 paragraph or one of them hasn't 42 words; with --json it writes each word's drawn width and its glyphs' advances, by face, context and pair, for
# word-stops-arabic-kerning.ts to check the layout's widths of the forms by.
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

SIZE = 10
LABEL_SIZE = 6
# The letters, in the order of the words of each paragraph
LETTERS = [chr(code) for code in [*range(0x621, 0x63B), *range(0x641, 0x64B), 0x67E, 0x686, 0x698, 0x6A9, 0x6AF, 0x6CC]]
LABEL = re.compile(r"AR4 (.+?)( bold)? ([0-9a-f]{4}) ([pt])")


def is_label(glyph):
    return abs(glyph["size"] - LABEL_SIZE) < 0.5


def paragraphs_of(glyphs):
    """Each paragraph's label and the glyphs after it, in the order they are drawn"""
    paragraphs = []
    index = 0
    while index < len(glyphs):
        if is_label(glyphs[index]):
            label = ""
            while index < len(glyphs) and is_label(glyphs[index]):
                label += glyphs[index]["text"]
                index += 1
            paragraphs.append((label.strip(), []))
        else:
            if paragraphs:
                paragraphs[-1][1].append(glyphs[index])
            index += 1
    return paragraphs


def words_of(glyphs):
    """A paragraph's words in the order of the letters: its lines from the top, each right to left, split at the spaces"""
    drawn = sorted((glyph for glyph in glyphs if glyph["width"] > 0), key=lambda glyph: -glyph["y"])
    lines = []
    for glyph in drawn:
        if lines and abs(lines[-1][0]["y"] - glyph["y"]) * 20 < 120:
            lines[-1].append(glyph)
        else:
            lines.append([glyph])
    words = []
    for line in lines:
        line.sort(key=lambda glyph: glyph["x"])
        of_line = []
        word = []
        for glyph in line:
            if glyph["text"] == " ":
                if word:
                    of_line.append(word)
                word = []
            else:
                word.append(glyph)
        if word:
            of_line.append(word)
        words.extend(reversed(of_line))
    return words


def main(path):
    found = pdf.objects(open(path, "rb").read())
    glyphs = [glyph for page in pdf.pages_of(found) for glyph in pdf.glyphs_of(found, page)]
    read = {}
    for label, drawn in paragraphs_of(glyphs):
        match = LABEL.match(label)
        if not match:
            continue
        face = match.group(1) + (" bold" if match.group(2) else "")
        first, context = chr(int(match.group(3), 16)), match.group(4)
        words = words_of(drawn)
        if len(words) != len(LETTERS):
            sys.exit(f"{face} {context} {match.group(3)}: {len(words)} words, not {len(LETTERS)}")
        for second, word in zip(LETTERS, words):
            last = word[-1]
            extent = (last["x"] + last["width"] / 1000 * SIZE - word[0]["x"]) * 1000 / SIZE
            read.setdefault(face, {}).setdefault(context, {})[first + second] = {
                "width": round(extent, 1),
                "advances": [round(glyph["width"], 1) for glyph in reversed(word)],
            }
    if not read:
        sys.exit(f"No AR4 paragraphs in {path}")
    if "--json" in sys.argv:
        print(json.dumps(read, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
        return
    for face, contexts in read.items():
        for context, words in contexts.items():
            kerning = {pair: word["width"] - sum(word["advances"]) for pair, word in words.items()}
            most = max(kerning, key=lambda pair: abs(kerning[pair]))
            kerned = sum(1 for amount in kerning.values() if abs(amount) > 10)
            print(f"{face} {context}: {len(words)} words, kerned by {kerning[most]:.1f} at most ({most}), {kerned} by more than 10")


if __name__ == "__main__":
    main(sys.argv[1])
