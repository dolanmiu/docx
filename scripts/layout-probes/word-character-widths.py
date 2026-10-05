# Reads the probes of word-character-widths.ts from a PDF of it, and prints what each shows: how wide each character is
# in each font, and which font it is drawn in (W), how wide each space is (S), whether lines break after it (B), and
# whether a word before it at the end of a line stays on the line (H).
#
#   pdftotext -bbox-layout word-character-widths.pdf word-character-widths.html
#   pdftohtml -xml -i -q -zoom 1 word-character-widths.pdf word-character-widths
#   python3 word-character-widths.py word-character-widths [--json]
#
# It takes the name of the PDF without its extension, and reads the two files above beside it, and the .json of the same
# name beside this reader, which the probe's script writes with the document: the fonts, the characters of each paragraph
# of W, and the spaces and words of S, B and H. It reads word-italic-widths.pdf, which the script writes with "italic", the
# same way. Widths are in thousandths of an em. With --json, it prints what it read as JSON,
# which scripts/generate-font-widths.ts takes: for each font and face, each character's width and the font Word drew it
# in, and each space's width. Characters on a line Word drew squeezed, and those it drew with no text, aren't in it.
# cspell:ignore bbox fontspec pdftohtml WSBH AAAAAC caladea carlito liberationsans liberationserif liberationmono couriernew timesnewroman
import html
import json
import os
import re
import sys

base = sys.argv[1]
# The probe's .json is beside this reader, or in stops2 beside it for the documents of lay-stops2's batch, such as
# word-stops-font-kerning
HERE = os.path.dirname(os.path.abspath(__file__))
SIDECAR = os.path.join(HERE, os.path.basename(base) + ".json")
if not os.path.exists(SIDECAR):
    SIDECAR = os.path.join(HERE, "stops2", os.path.basename(base) + ".json")
probe = json.load(open(SIDECAR, encoding="utf8"))
SIZE = probe["size"]
COPIES = probe["copies"]
FACES = probe["faces"]
PARAGRAPHS = probe["paragraphs"]
SPACES = probe["spaces"]
# A twip is a twentieth of a point, and an em of 10-point text 200 of them
EM = SIZE * 20
LABEL = re.compile(r"^([WSBH])(\d+)$")


def key_of(face):
    """The name of a font's face, such as "Calibri bold italic\""""
    return f"{face['font']}{' bold' if face['bold'] else ''}{' italic' if face.get('italic') else ''}"


def read_lines():
    """Each line of the PDF: (page, [(left, right, top, text)]), in twips. pdftotext puts words of other sizes on the same
    line, such as the small code points before the characters, on lines of their own, in an order of its own, so the lines
    are made again from where the words are: those whose bottoms are within 4 points of each other, from left to right"""
    text = open(base + ".html", encoding="utf8").read()
    lines = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        words = sorted(
            (float(y1) * 20, float(x0) * 20, float(x1) * 20, float(y0) * 20, html.unescape(word))
            for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content)
        )
        rows = []
        for word in words:
            if rows and word[0] - rows[-1][0][0] < 80:
                rows[-1].append(word)
            else:
                rows.append([word])
        lines.extend((page, [(left, right, top, word) for _, left, right, top, word in sorted(row, key=lambda word: word[1])]) for row in rows)
    return lines


def read_fonts():
    """The pieces of text pdftohtml found, by page: (top, left, right) in twips, and the name of their font"""
    text = open(base + ".xml", encoding="utf8").read()
    pieces = {}
    for page, content in re.findall(r'<page number="(\d+)".*?>(.*?)</page>', text, re.S):
        families = dict(re.findall(r'<fontspec id="(\d+)" size="[^"]*" family="([^"]*)"', text))
        for top, left, width, font in re.findall(r'<text top="(-?\d+)" left="(-?\d+)" width="(\d+)" height="\d+" font="(\d+)"', content):
            # The name without the prefix of a subset, such as AAAAAC+Calibri
            name = families[font].split("+")[-1]
            pieces.setdefault(int(page), []).append((int(top) * 20, int(left) * 20, (int(left) + int(width)) * 20, name))
    return pieces


# The fonts LibreOffice draws in place of Word's, as it has none of them
ALIASES = {"carlito": "calibri", "caladea": "cambria", "liberationsans": "arial", "liberationserif": "timesnewroman", "liberationmono": "couriernew"}


def is_own(font, key):
    """Whether a font is the one of a face, such as ArialMT or Arial-BoldMT for Arial, and not another, such as Cambria Math"""
    name = re.sub(r"[^a-z]", "", (font or "").lower())
    name = next((word + name[len(alias) :] for alias, word in ALIASES.items() if name.startswith(alias)), name)
    return name.startswith(re.sub(r"[^a-z]", "", key.replace(" bold", "").replace(" italic", "").lower())) and "math" not in name


def font_at(pieces, page, top, left, right):
    """The font of the piece of text a word is in"""
    middle = (left + right) / 2
    found = [name for piece_top, piece_left, piece_right, name in pieces.get(page, []) if abs(piece_top - top) < 60 and piece_left - 20 <= middle <= piece_right + 20]
    return found[0] if found else None


lines = read_lines()
pieces = read_fonts()

# The words of each probe, in order, with the line each is on: (line index, page, top, left, right, text)
probes = {}
current = None
for index, (page, words) in enumerate(lines):
    for left, right, top, word in words:
        found = LABEL.match(word)
        if found:
            current = (found.group(1), int(found.group(2)))
            probes[current] = []
        elif current is not None:
            probes[current].append((index, page, top, left, right, word))

result = {"widths": {}, "lines": {}, "spaces": {}, "breaks": {}, "hangs": {}}
problems = []

# W: each character's word is ten of it, after its code point, so its width is a tenth of the word's. A word can be in
# pieces, where a line breaks after a dash in it, or where pdftotext finds gaps in it, so its width is what the pieces
# between its code point and the next take on each line
CODE = re.compile(r"^u([0-9a-f]{4})$")
# Calibri's widths of the characters of the code points, in thousandths of an em, and their size in points. Word drew a
# few lines squeezed, closer together than their characters' widths, even the code points in Calibri, so a line whose code
# points aren't as wide as they are in Calibri doesn't show its characters' widths
LABEL_WIDTHS = {"u": 525, **{digit: 507 for digit in "0123456789"}, "a": 479, "b": 525, "c": 423, "d": 525, "e": 498, "f": 305}
LABEL_SIZE = 6
squeezed = {
    word[0]
    for words in probes.values()
    for word in words
    if CODE.match(word[5]) and abs((word[4] - word[3]) / (sum(LABEL_WIDTHS[c] for c in word[5]) * LABEL_SIZE * 20 / 1000) - 1) > 0.03
}
# A character's word is the pieces that follow on from its code point: on the code point's line, the first within a space
# of it and each next within GAP of the one before, and where the word is broken at the end of the line, those that follow
# on from where the next line starts. Word draws some characters in another font, such as the arrows it draws in Apple
# Color Emoji, with a box pdftotext puts above or below their line, so they can be read in among the words of the line
# before or after it: those don't follow on from the code point, and are left out
MARGIN = min((left for _, words in lines for left, _, _, word in words if LABEL.match(word)), default=0)
SPACE = 200
GAP = 40


def follow_on(parts, start, first):
    """The parts that follow on from `start`: the first that starts within `first` after it, and each next within GAP of
    the end of the one before"""
    kept = []
    end = start
    for part in sorted(parts, key=lambda part: part[3]):
        if end - GAP / 2 <= part[3] <= end + (GAP if kept else first):
            kept.append(part)
            end = part[4]
    return kept


for face_index, face in enumerate(FACES):
    key = key_of(face)
    widths = result["widths"].setdefault(key, {})
    for paragraph_index, codes in enumerate(PARAGRAPHS):
        number = face_index * len(PARAGRAPHS) + paragraph_index + 1
        words = {}
        code = None
        for word in probes.get(("W", number), []):
            found = CODE.match(word[5])
            if found:
                code = found.group(1)
                words[code] = [word]
            elif code is not None:
                words[code].append(word)
        labels = {}
        for code, (label, *parts) in words.items():
            labels[code] = label[0]
            on_line = follow_on([part for part in parts if part[0] == label[0]], label[4], SPACE)
            later = sorted({part[0] for part in parts if part[0] > label[0]})
            starts = [follow_on([part for part in parts if part[0] == line], MARGIN, GAP / 2) for line in later]
            words[code] = on_line + next((start for start in starts if start), [])
        # Where the paragraph's lines break: the code point, such as u0041, or the word of ten of its character, such as
        # 0041, that starts each line after the first, where every code point and word was read
        tokens = [
            (line, token)
            for expected in codes
            for line, token in [(labels.get(f"{expected:04x}"), f"u{expected:04x}"), (min((part[0] for part in words.get(f"{expected:04x}", [])), default=None), f"{expected:04x}")]
        ]
        if all(line is not None for line, _ in tokens):
            starts = [token for (line, token), (previous, _) in zip(tokens[1:], tokens) if line != previous]
            result["lines"][f"W{number}"] = starts
        for expected in codes:
            parts = words.get(f"{expected:04x}", [])
            if not parts:
                problems.append(f"W{number} ({key}): no word for {expected:04x}")
                continue
            if any(part[0] in squeezed for part in parts):
                problems.append(f"W{number} ({key}): {expected:04x} on a line drawn squeezed")
                continue
            width = sum(
                max(part[4] for part in parts if part[0] == line) - min(part[3] for part in parts if part[0] == line)
                for line in {part[0] for part in parts}
            )
            _, page, top, left, right, _ = parts[0]
            widths[f"{expected:04x}"] = {"width": round(width / COPIES / EM * 1000, 2), "font": font_at(pieces, page, top, left, right)}

# S: eleven H's and ten spaces, less the eleven H's of the word before them
for face_index, face in enumerate(FACES):
    key = key_of(face)
    spaces = result["spaces"].setdefault(key, {})
    for space_index, code in enumerate(SPACES):
        number = face_index * len(SPACES) + space_index + 1
        words = probes.get(("S", number), [])
        if len(words) < 2:
            problems.append(f"S{number} ({key}, {code:04x}): {len(words)} words")
            continue
        h = (words[0][4] - words[0][3]) / COPIES
        span = max(word[4] for word in words[1:]) - min(word[3] for word in words[1:])
        spaces[f"{code:04x}"] = round((span - (COPIES + 1) * h) / COPIES / EM * 1000, 2)

# B: whether each line ends with a whole word, where lines break after the space
words_of = probe["breaks"]["words"]
for number, code in enumerate(probe["breaks"]["codes"], 1):
    space = chr(code)
    by_line = {}
    for line, _, _, _, _, text in probes.get(("B", number), []):
        by_line.setdefault(line, []).append(text)
    ends = []
    position = 0
    whole = True
    for line in sorted(by_line):
        tokens = [token for token in re.split(f"[ {re.escape(space)}]+", " ".join(by_line[line])) if token]
        for token in tokens:
            if position < len(words_of) and token == words_of[position]:
                position += 1
            else:
                whole = False
        ends.append(tokens[-1] if tokens else "")
    result["breaks"][f"{code:04x}"] = {"lines": len(by_line), "ends": ends, "wholeWords": whole}

# H: whether the word before the space is on the line with the probe's name, or the next
for number, hang in enumerate(probe["hangs"], 1):
    words = probes.get(("H", number), [])
    first_line = min((word[0] for word in words), default=None)
    on = [word for word in words if word[5].startswith(hang["word"])]
    result["hangs"][f"{hang['code']:04x}"] = {"stays": bool(on) and on[0][0] == first_line, "word": hang["word"]}

if "--json" in sys.argv:
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":"), sort_keys=True))
    sys.exit()

print("== W: characters drawn in another font than their own, by font and face")
for key, widths in result["widths"].items():
    others = {}
    for code, found in widths.items():
        if not is_own(found["font"], key):
            others.setdefault(found["font"], []).append(code)
    print(f"  {key}: {len(widths)} characters, {sum(len(codes) for codes in others.values())} in other fonts")
    for name, codes in sorted(others.items(), key=lambda item: -len(item[1])):
        print(f"    {name}: {len(codes)}: {' '.join(codes[:24])}{' ...' if len(codes) > 24 else ''}")

print("\n== S: the width of each space, and of the characters that take no room")
codes = [f"{code:04x}" for code in SPACES]
print("  " + " " * 28 + " ".join(f"{code:>6}" for code in codes))
for key, spaces in result["spaces"].items():
    print(f"  {key:28}" + " ".join(f"{spaces.get(code, float('nan')):6.1f}" for code in codes))

# B and H, which the italic probe leaves out
if result["breaks"]:
    print("\n== B: forty words joined by each space, in Calibri 11: the last word of each line, and whether each line ends with a whole word")
    for code, found in result["breaks"].items():
        print(f"  {code}: {found['lines']} lines, whole words: {found['wholeWords']}, ending: {' | '.join(found['ends'])}")

    print("\n== H: whether the word before the space stays on its line, half the space's width before the margin")
    for code, found in result["hangs"].items():
        print(f"  {code}: {'stays' if found['stays'] else 'goes to the next line'} ({found['word']})")

if problems:
    print("\n== Not read")
    for problem in problems:
        print(f"  {problem}")
