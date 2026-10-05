# Reads the probes of word-stops-office-fonts.ts from a PDF of it saved from Word, and prints what each shows, from the
# PDF's own content: where Word draws each glyph, in which font, and on which baseline.
#
#   python3 word-stops-office-fonts.py word-stops-office-fonts.pdf
#
# It reads word-stops-office-fonts.json, which the probe's script writes beside the document, from beside the PDF, and
# the PDF with word-stops-more-widths.py's functions. Each probe's lines start with a label in Calibri 11, which names
# the probe, and the text measured is in another font, whose glyphs are told apart from the label's by their font. Widths
# are in thousandths of an em of the text's size, and heights in points. Word puts its baselines on whole units of its
# 1/300 inch, so a single line's height reads to within 0.24 points, and a run of lines' to within that over their number.
#
# MB1, MB4: how far apart Word draws ten H's, ten i's, and the H's of H's with spaces between them, bold and not, at each
#   size: the bold Word makes itself draws each glyph 20 thousandths of an em further on, and the space as wide
# MB2: how much further on each glyph is in the bold than in the regular, kerned with Normal's ligatures
# MB3, FB2: how tall the lines of each run are, from the first's baseline to the last's
# FB1: the font Word drew each word of ten characters in, and how far apart, in each language
# KL1: the kerning between each glyph and the next of "ToToToToTo AVAVAVAVAV WaWaWaWaWa" with each ligature setting: how
#   much nearer than its glyph's width the next glyph is, as Word kerns it
# KL2: where each word of the line of Verdana starts, in points from the first
# DS1, DS2: how far apart the probe's lines' baselines are
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
# The labels' font
LABEL = "Calibri"


def lines_of(path):
    """Each line of each page, from the top: its glyphs from left to right, the text of its label, and its baseline. A
    word of another size is on a baseline a unit or so from the label's, so glyphs within a point of each other are a line"""
    found = pdf.objects(open(path, "rb").read())
    lines = []
    for number, page in enumerate(pdf.pages_of(found), 1):
        current = []
        for glyph in sorted(pdf.glyphs_of(found, page), key=lambda glyph: -glyph["y"]):
            if current and abs(current[0]["y"] - glyph["y"]) > 1:
                lines.append(current)
                current = []
            current.append({**glyph, "page": number})
        if current:
            lines.append(current)
    result = []
    for glyphs in lines:
        glyphs.sort(key=lambda glyph: glyph["x"])
        label = "".join(glyph["text"] for glyph in glyphs if glyph["font"] == LABEL)
        result.append({"page": glyphs[0]["page"], "y": max(glyph["y"] for glyph in glyphs), "glyphs": glyphs, "label": label})
    return result


LINES = lines_of(sys.argv[1])


def line_of(pattern):
    """The first line whose label matches, and the glyphs of its text in another font than the label's"""
    for line in LINES:
        if re.match(pattern, line["label"]):
            return line, [glyph for glyph in line["glyphs"] if glyph["font"] != LABEL]
    return None, []


def apart(glyphs, size):
    """How far apart glyphs are on average, in thousandths of an em"""
    return (glyphs[-1]["x"] - glyphs[0]["x"]) / (len(glyphs) - 1) / size * 1000


print("== MB1, MB4: how far apart Word draws the H's and i's, and the H's with spaces between them, bold and not")
for name, font, size, how in probe["measured"]:
    if not name.startswith("MB") or how != "bold":
        continue
    label = font.replace(" ", "_")
    read = {}
    for kind in ("H", "i", "space"):
        for weight in ("bold", "regular"):
            _, glyphs = line_of(rf"{name} {label} {weight} {kind} ")
            # The H's apart, as wide as the first glyph
            glyphs = [glyph for glyph in glyphs if glyph["width"] == glyphs[0]["width"]] if glyphs else []
            read[(kind, weight)] = apart(glyphs, size) if len(glyphs) > 1 else None
    if None in read.values():
        print(f"  {name} {font} {size}: not found")
        continue
    bold = {kind: read[(kind, "bold")] - read[(kind, "regular")] for kind in ("H", "i", "space")}
    space = read[("space", "bold")] - read[("H", "bold")] - (read[("space", "regular")] - read[("H", "regular")])
    print(
        f"  {name} {font:22} {size:3} points: H {read[('H', 'bold')]:7.2f} bold, {read[('H', 'regular')]:7.2f}, "
        f"{bold['H']:+6.2f}; i {bold['i']:+6.2f}; the space {space:+6.2f} wider in bold"
    )

print("\n== MB2: how much further on each glyph is in the bold than in the regular, in thousandths of an em")
for index in range(3):
    name = f"MB2{'abc'[index]}"
    _, bold = line_of(rf"{name} bold ")
    _, regular = line_of(rf"{name} regular ")
    if len(bold) == len(regular) > 1:
        steps = [
            ((bold[at + 1]["x"] - bold[at]["x"]) - (regular[at + 1]["x"] - regular[at]["x"])) / 11 * 1000 for at in range(len(bold) - 1)
        ]
        print(f"  {name} {bold[0]['font']:22} {len(bold)} glyphs: " + " ".join(f"{step:.1f}" for step in steps))

print("\n== MB3, FB2: how tall the lines of each run are, in points")
# The lines between each probe's line above and its line below, in Calibri, which are in the font measured, label and
# all, whose glyphs' text the PDF may not say: MB3's 20 lines at 11 points, then 20 at 20, and FB2's 10 with a character
# the font doesn't have, then 10 without
for name, runs in [(f"MB3{letter}", (("bold 11", 20), ("bold 20", 20))) for letter in "abc"] + [
    (f"FB2{letter}", (("with", 10), ("without", 10))) for letter in "abcdef"
]:
    above = next((at for at, line in enumerate(LINES) if line["label"].startswith(f"{name} above")), None)
    below = next((at for at, line in enumerate(LINES) if line["label"].startswith(f"{name} below")), None)
    if above is None or below is None:
        continue
    lines = LINES[above + 1 : below]
    for which, count in runs:
        run, lines = lines[:count], lines[count:]
        # From the first line's baseline to the last's on each page the run is on
        gaps = [before["y"] - after["y"] for before, after in zip(run, run[1:]) if before["page"] == after["page"]]
        if gaps:
            height = sum(gaps) / len(gaps)
            fonts = sorted({glyph["font"] for line in run for glyph in line["glyphs"]})
            print(f"  {name} {which:8} {len(run)} lines: {height:.4f}, in {', '.join(fonts)}")

print("\n== FB1: the font Word drew each word of ten characters in, and how far apart, in each language")
for line in LINES:
    found = re.match(r"^(FB1[a-z]) (\S+) ", line["label"])
    glyphs = [glyph for glyph in line["glyphs"] if glyph["font"] != LABEL or glyph["size"] < 10.5]
    if found and found.group(2) not in ("above", "below") and len(glyphs) >= 10:
        print(f"  {found.group(1)} {found.group(2):10} in {glyphs[0]['font']}, {apart(glyphs[:10], 10):.2f} apart")

print("\n== KL1: how much nearer than its width each glyph's next is, kerned, with each ligature setting")
for name, font, size, setting in probe["measured"]:
    if name.startswith("KL1"):
        _, glyphs = line_of(rf"{name} {setting} ")
        kerning = [(glyphs[at + 1]["x"] - glyphs[at]["x"]) / size * 1000 - glyphs[at]["width"] for at in range(len(glyphs) - 1)]
        print(
            f"  {name} {font:22} {setting:24} To {kerning[0]:7.1f}, AV {kerning[11]:7.1f}, VA {kerning[12]:7.1f}, Wa {kerning[22]:7.1f}, "
            f"the most {max(kerning, key=abs):7.1f}"
        )

print("\n== KL2: where each word of the line of Verdana starts, in points from the first")
_, glyphs = line_of(r"KL2 (?!above|below)")
words = probe["prose"].split(" ")
starts, at = [], 0
for word in words:
    starts.append(at)
    at += len(word) + 1
print("  " + " ".join(f"{glyphs[start]['x'] - glyphs[0]['x']:.2f}" for start in starts) + f", its last glyph at {glyphs[-1]['x'] - glyphs[0]['x']:.2f}")

print("\n== DS1, DS2: how far apart the baselines of the probe's lines are, in points, from the line above them")
for name in ("DS1a", "DS2a", "DS1b", "DS2b"):
    lines = [line for line in LINES if "".join(glyph["text"] for glyph in line["glyphs"]).startswith(name)]
    print(f"  {name}: " + " ".join(f"{before['y'] - after['y']:.2f}" for before, after in zip(lines, lines[1:])))
