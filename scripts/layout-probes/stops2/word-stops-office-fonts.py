# Reads the probes of word-stops-office-fonts.ts from a PDF of it, and prints what each shows.
#
#   pdftotext -bbox-layout word-stops-office-fonts.pdf word-stops-office-fonts.html
#   pdftohtml -xml -i -q -zoom 1 word-stops-office-fonts.pdf word-stops-office-fonts
#   python3 word-stops-office-fonts.py word-stops-office-fonts
#
# It takes the name of the PDF without its extension, and reads the files above beside it, and the .json the probe's
# script writes beside the document. Widths are in thousandths of an em of the text's size, and heights in points.
#
# MB1, MB4: each character's width, from a word of ten H's and one of ten i's, and the space's, from ten H's apart, bold
#   and not: the bold Word makes is as much wider at each size, in thousandths of an em, as the 18 at 10 points if it is
#   of an em, or 18 at 10 points and less at larger sizes if it is of a point
# MB2: where each word starts, bold and not, kerned with Normal's ligatures, in points from the first
# MB3, FB2: how tall each run of lines is, from where pdftotext puts their bottoms
# FB1: the font Word drew each word of ten characters in, and its width, in each language
# KL1: the width of "ToToToToTo", "AVAVAVAVAV" and "WaWaWaWaWa" with each ligature setting, kerned: less than without kerning
#   where Word kerns them
# KL2: where each word of the line of Verdana starts, in points from the first
# DS1, DS2: how far apart the probe's lines are, which is how tall each is
# cspell:ignore bbox pdftohtml fontspec
import html
import json
import re
import sys

base = sys.argv[1]
probe = json.load(open(base + ".json", encoding="utf8"))
text = open(base + ".html", encoding="utf8").read()
xml = open(base + ".xml", encoding="utf8").read()

# Each line: page, bottom, and its words (left, right, text), in points, in order
lines = []
for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for bottom, words in re.findall(r'<line xMin="[\d.]+" yMin="[\d.]+" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>', content, re.S):
        found = [
            (float(x0), float(x1), html.unescape(word))
            for x0, x1, word in re.findall(r'<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', words)
        ]
        lines.append((page, float(bottom), found))

# The font of each piece of text pdftohtml found, by page: (top, left, right) in points
families = dict(re.findall(r'<fontspec id="(\d+)" size="[^"]*" family="([^"]*)"', xml))
pieces = {}
for page, content in re.findall(r'<page number="(\d+)".*?>(.*?)</page>', xml, re.S):
    for top, left, width, font in re.findall(r'<text top="(-?\d+)" left="(-?\d+)" width="(\d+)" height="\d+" font="(\d+)"', content):
        pieces.setdefault(int(page), []).append((int(top), int(left), int(left) + int(width), families[font].split("+")[-1]))


def font_at(page, bottom, left, right):
    middle = (left + right) / 2
    found = [name for top, start, end, name in pieces.get(page, []) if top <= bottom + 2 and bottom - top < 80 and start - 1 <= middle <= end + 1]
    return found[-1] if found else None


# Each word of each page: (page, top, bottom, left, right, text), in points
words_of_pages = []
for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content):
        words_of_pages.append((page, float(y0), float(y1), float(x0), float(x1), html.unescape(word)))


def line_of(*start):
    """The words of the line whose first words are these: the words level with them, from left to right, to "end", as
    (left, right, text). pdftotext puts words of other sizes beside them on lines of their own, so the line is made again
    from the words whose boxes are level with the first word's"""
    for index, (page, top, bottom, left, right, word) in enumerate(words_of_pages):
        if word != start[0]:
            continue
        level = sorted(
            (other for other in words_of_pages if other[0] == page and other[3] >= left and other[1] < bottom and other[2] > top),
            key=lambda other: other[3],
        )
        texts = [other[5] for other in level]
        if texts[: len(start)] != list(start):
            continue
        found = []
        for other in level:
            found.append((other[3], other[4], other[5]))
            if other[5] == "end":
                break
        return (page, bottom, found)
    return None


def words_after(line, count):
    """The words of a line after its probe's name and how it is written"""
    return line[2][2 : 2 + count]


print("== MB1, MB4: widths of H, i and the space, bold and not, in thousandths of an em")
widths = {}
for name, font, size, how in probe["measured"]:
    if not name.startswith("MB"):
        continue
    copies = probe["copies"].get(str(size), 10)
    em = size / 1000
    found = {kind: line_of(name, font.replace(" ", "_"), how, kind) for kind in ("H", "i", "space")}
    if any(line is None for line in found.values()):
        print(f"  {name} {font} {size} {how}: not found")
        continue
    h = (found["H"][2][4][1] - found["H"][2][4][0]) / copies / em
    i = (found["i"][2][4][1] - found["i"][2][4][0]) / copies / em
    spaced = found["space"][2][4 : 4 + copies]
    space = ((spaced[-1][0] - spaced[0][0]) - (copies - 1) * (spaced[0][1] - spaced[0][0])) / (copies - 1) / em
    widths[(name, font, how)] = (h, i, space)
    if how == "regular" and (name, font, "bold") in widths:
        bold = widths[(name, font, "bold")]
        print(
            f"  {name} {font:22} {size:3} points: H {bold[0]:7.2f} bold, {h:7.2f}, {bold[0] - h:+6.2f}; "
            f"i {bold[1] - i:+6.2f}; space {bold[2]:6.2f} bold, {space:6.2f}"
        )

print("\n== MB2: where each word starts, kerned with Normal's ligatures, in points")
for index in range(3):
    name = f"MB2{'abc'[index]}"
    for how in ("bold", "regular"):
        line = line_of(name, how)
        if line:
            starts = [round(left - line[2][2][0], 2) for left, _, _ in line[2][2:-1]]
            print(f"  {name} {how:8} {starts}")

print("\n== MB3, FB2: the height of the lines of each run, in points")
runs = {}
for page, bottom, words in lines:
    found = re.match(r"^((?:MB3|FB2)[a-z]) (.+) line \d+(?: (with|without).*)?$", " ".join(word for _, _, word in words))
    if found:
        key = (found.group(1), found.group(2), found.group(3))
        runs.setdefault(key, {}).setdefault(page, []).append(bottom)
for (name, label, which), pages in runs.items():
    gaps = sum(len(bottoms) - 1 for bottoms in pages.values())
    if gaps > 0:
        height = sum(max(bottoms) - min(bottoms) for bottoms in pages.values()) / gaps
        print(f"  {name} {label} {which or ''}: {height:.4f}")

print("\n== FB1: the font Word drew each word in, and its width, in each language")
for page, bottom, words in lines:
    if words and re.match(r"^FB1[a-z]$", words[0][2]) and len(words) >= 3 and words[1][2] not in ("above", "below"):
        left, right, word = words[2]
        print(f"  {words[0][2]} {words[1][2]:10} {word[:1]} in {font_at(page, bottom, left, right)}, {right - left:.2f} points")

print("\n== KL1: widths of the kerned pairs with each ligature setting, in points")
for name, font, size, setting in probe["measured"]:
    if name.startswith("KL1"):
        line = line_of(name, setting)
        if line:
            print(f"  {name} {font:22} {setting:24} " + " ".join(f"{right - left:7.3f}" for left, right, _ in words_after(line, 3)))

print("\n== KL2: where each word of the line of Verdana starts, in points")
line = line_of("KL2", probe["prose"].split(" ")[0])
if line:
    print("  " + str([round(left - line[2][1][0], 2) for left, _, _ in line[2][1:-1]]))

print("\n== DS1, DS2: how far apart the probe's lines are, in points")
for name in ("DS1a", "DS1b", "DS2a", "DS2b"):
    bottoms = [bottom for _, bottom, words in lines if words and words[0][2] == name]
    print(f"  {name}: " + " ".join(f"{after - before:.3f}" for before, after in zip(bottoms, bottoms[1:])))
