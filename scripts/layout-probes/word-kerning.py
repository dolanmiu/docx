# Reads the probes of word-kerning.ts from a PDF of it: where Word draws each glyph of each line, from pdftocairo's SVG
# of the PDF, and the width of the small probes' words (R and SP), from pdftotext's boxes.
#
#   pdftocairo -svg word-kerning.pdf word-kerning.svg
#   pdftotext -bbox-layout word-kerning.pdf word-kerning.html
#   python3 word-kerning.py word-kerning [--json]
#
# It takes the name of the PDF without its extension, and reads the two files above beside it, and word-kerning.json
# beside this reader, which the probe's script writes with the document: the text of each line, its face, and whether it
# is kerned and joins ligatures. Each line is one paragraph, and the SVG draws each glyph of it at its own place, the
# spaces too, and the paragraph's mark as a space at its end. A glyph is known by its outline, which is the same for the
# same glyph of a face wherever it is, and the glyph of each character by the I lines, where the characters are apart.
# A glyph that isn't a character's is one a ligature, or a contextual form, put in place of the characters: each is read
# as the characters it covers, which the words of L, after spaces, show.
#
# Widths and kerning are in thousandths of an em. It prints, for each face, the width of each character (from I), the
# kerning of each pair (K: how much nearer the second character is drawn than the first's width), the glyphs ligatures
# put in place of characters and their widths (L), the kerning beside them (LK), and the width of each word of A and of
# the small probes. With --json, it prints them as JSON, which scripts/generate-font-kerning.ts takes.
# cspell:ignore bbox pdftocairo
import html
import json
import os
import re
import sys
import unicodedata

sys.setrecursionlimit(20000)

base = sys.argv[1]
probe = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.path.basename(base) + ".json"), encoding="utf8"))
SIZE = probe["size"]
SPACES = {" ", " "}
# The outline of a space, which has none
EMPTY = ""


def thousandths(points):
    return round(points / SIZE * 1000, 2)


def read_glyph_lines():
    """Each line of the PDF, in order: its glyphs, each as (outline, x in points, run), from left to right. A run is the
    glyphs one text operator of the PDF draws, which the SVG groups"""
    svg = open(base + ".svg", encoding="utf8").read()
    outlines = {}
    for glyph, body in re.findall(r'<g id="glyph-(\d+-\d+)">(.*?)</g>', svg, re.S):
        path = re.search(r' d="([^"]*)"', body)
        outlines[glyph] = path.group(1) if path else EMPTY
    lines = []
    run = 0
    for page in svg.split("<page>")[1:]:
        rows = {}
        for group in re.findall(r"<g fill[^>]*>(.*?)</g>", page, re.S):
            run += 1
            for glyph, x, y in re.findall(r'<use xlink:href="#glyph-(\d+-\d+)" x="([-\d.]+)" y="([-\d.]+)"', group):
                rows.setdefault(round(float(y), 1), []).append((outlines[glyph], float(x), run))
        lines.extend(sorted(row, key=lambda glyph: glyph[1]) for _, row in sorted(rows.items()))
    return lines


glyph_lines = read_glyph_lines()
LINES = probe["lines"]
if len(glyph_lines) < len(LINES):
    sys.exit(f"The PDF has {len(glyph_lines)} lines of glyphs, fewer than the probe's {len(LINES)}")
glyph_lines.append([])

# The glyph of each character in each face, from I, and the characters each other glyph covers, from L, LK and A
glyph_of = {}
covers = {}
# Each face's characters' widths, from I, and the widths of the other glyphs, from L and A, which aren't kerned
advance_of = {}
problems = []


def align(face, text, glyphs, joins):
    """The glyphs of a line, each with the characters it covers: [(start, end, index of the glyph, kind)], or None when
    they can't be. A glyph that isn't a character's covers the characters it covered before, or, in a line whose letters
    may be joined (`joins`), as many as let the rest be aligned, the most first, but never a space; otherwise one. A letter
    made from another and marks on it may be drawn as that letter's glyph, or another, and a glyph for each mark, as Word
    draws Cambria's letters with accents kerned"""
    chars = glyph_of.setdefault(face, {})
    known = covers.setdefault(face, {})
    singles = set(chars.values())
    memo = {}

    def match(i, j):
        if (i, j) in memo:
            return memo[(i, j)]
        result = None
        if i == len(text):
            # The paragraph's mark is drawn as a space after the text
            if j == len(glyphs) or (j == len(glyphs) - 1 and glyphs[j][0] == EMPTY):
                result = []
        elif j < len(glyphs) or text[i] in SPACES:
            glyph = glyphs[j][0] if j < len(glyphs) else None
            character = text[i]
            parts = unicodedata.normalize("NFD", character)
            if character in SPACES:
                if glyph == EMPTY:
                    rest = match(i + 1, j + 1)
                    result = None if rest is None else [(i, i + 1, j, "space")] + rest
            elif chars.get(character) == glyph:
                rest = match(i + 1, j + 1)
                result = None if rest is None else [(i, i + 1, j, "character")] + rest
            if result is None and character not in SPACES and len(parts) > 1 and glyph not in (None, EMPTY):
                # The letter it is made from, or another glyph, then a glyph for each mark
                if chars.get(parts[0]) == glyph or glyph not in singles:
                    # As many glyphs as it has marks, or one more, as Word draws Cambria's ï with two
                    for marks in (len(parts) - 1, len(parts)):
                        if result is None and all(j + mark < len(glyphs) and glyphs[j + mark][0] != EMPTY for mark in range(1, marks + 1)):
                            rest = match(i + 1, j + 1 + marks)
                            result = None if rest is None else [(i, i + 1, j, "marked")] + rest
            if result is None and character not in SPACES and glyph not in (None, EMPTY) and glyph not in singles:
                spans = [len(known[glyph])] if glyph in known else ([4, 3, 2, 1] if joins else [1])
                for span in spans:
                    letters = text[i : i + span]
                    if len(letters) < span or any(letter in SPACES for letter in letters):
                        continue
                    if glyph in known and known[glyph] != letters:
                        continue
                    rest = match(i + span, j + 1)
                    if rest is not None:
                        result = [(i, i + span, j, "glyph")] + rest
                        break
            if result is None and character in SPACES:
                # A space that isn't drawn, as Word leaves out some, such as the one a paragraph starts with, which parts
                # the glyphs either side of it
                rest = match(i + 1, j)
                result = None if rest is None else [(i, i + 1, None, "space")] + rest
        memo[(i, j)] = result
        return result

    return match(0, 0)


def unit_name(face, letters, glyph):
    """A glyph's name: its character, or the characters it covers in angle brackets, such as ⟨fi⟩, with a number after
    them when other glyphs cover the same characters elsewhere, such as an f drawn one way before some letters and
    another way before others: ⟨f⟩2"""
    if letters in SPACES or (len(letters) == 1 and glyph_of[face].get(letters) == glyph):
        return letters
    others = glyphs_for.setdefault(face, {}).setdefault(letters, [])
    if glyph not in others:
        others.append(glyph)
    number = others.index(glyph)
    return f"⟨{letters}⟩" if number == 0 else f"⟨{letters}⟩{number + 1}"


def letters_of(name):
    """The characters a glyph's name says it covers"""
    return name[1 : name.index("⟩")] if name.startswith("⟨") else name


def units_of(face, text, glyphs, kind):
    """A line's glyphs as (name, x), learning what the glyphs that aren't characters' cover in L and A. A letter drawn
    with its marks as glyphs of their own is the letter, and so is a glyph of one character in K, which joins none. Two
    glyphs next to each other that aren't characters' and weren't known before could cover the characters between them in
    more than one way, so the line is left out"""
    joins = kind not in ("K", "I")
    learn = kind in ("L", "A", "LK")
    aligned = align(face, text, glyphs, joins)
    if aligned is None:
        return None
    new = [how == "glyph" and glyphs[index][0] not in covers[face] for _, _, index, how in aligned]
    if any(one and other for one, other in zip(new, new[1:])):
        return None
    units = []
    for start, end, index, how in aligned:
        letters = text[start:end]
        if index is None:
            units.append((letters, None, None))
            continue
        glyph, x, run = glyphs[index]
        if how in ("character", "space", "marked") or (how == "glyph" and not joins):
            units.append((letters, x, run))
            continue
        if learn:
            covers[face].setdefault(glyph, letters)
        units.append((unit_name(face, letters, glyph) if learn or glyph in covers[face] else f"⟨{letters}⟩?", x, run))
    return units


glyphs_for = {}
gaps = {}
# The K lines' glyphs, with the run each is in, for taking out the drift of each run
kerned_lines = []
# The gaps after each glyph that isn't a character's in L, and the pairs of LK, for their widths and kerning, below
ligature_gaps = {}
beside_lines = []
# The words of L and A read, by face and setting
read_words = {}
joined = {}
beside = {}
aptos = []
prose = []
cursor = 0
for index, (name, face, kerned, ligatures, text) in enumerate(LINES):
    kind = "label" if name == "label" else re.match(r"[A-Z]+", name).group(0)
    glyphs = glyph_lines[cursor]
    cursor += 1
    if kind == "label":
        continue
    if kind == "I":
        # The characters, each after a space, not kerned: one glyph each, in order. Word leaves out some of the spaces,
        # such as the one a paragraph starts with, so a character is as wide as from it to the space after it, where that
        # is drawn, and the space as wide as from it to the next character
        chars = glyph_of.setdefault(face, {})
        advances = advance_of.setdefault(face, {})
        drawn = [(at, glyph, x) for at, (glyph, x, _) in enumerate(glyphs) if glyph != EMPTY]
        letters = [character for character in text if character not in SPACES]
        if len(drawn) != len(letters):
            problems.append(f"line {index + 1} ({name}): {len(drawn)} glyphs for {len(letters)} characters")
            continue
        for letter, (at, glyph, x) in zip(letters, drawn):
            chars[letter] = glyph
            if at + 2 < len(glyphs) and glyphs[at + 1][0] == EMPTY and glyphs[at + 2][0] != EMPTY:
                advances.setdefault(letter, thousandths(glyphs[at + 1][1] - x))
                advances.setdefault(" ", thousandths(glyphs[at + 2][1] - glyphs[at + 1][1]))
        continue
    units = units_of(face, text, glyphs, kind)
    if units is None and cursor < len(glyph_lines):
        # A line that broke in two is drawn on two lines, whose glyphs' places can't be measured across the break, so it
        # is left out, and its second half passed over, so the lines after it are read as theirs. A line after a line of
        # glyphs that isn't one of the probe's is read from the next
        if units_of(face, text, glyphs + glyph_lines[cursor], kind) is not None:
            problems.append(f"line {index + 1} ({name}, {face}): broke in two, so left out")
            cursor += 1
            continue
        units = units_of(face, text, glyph_lines[cursor], kind)
        if units is not None:
            problems.append(f"line {index + 1} ({name}, {face}): after a line of glyphs not of the probe")
            cursor += 1
    if units is None:
        problems.append(f"line {index + 1} ({name}, {face}): its {len(glyphs)} glyphs can't be read as its {len(text)} characters")
        continue
    advances = advance_of[face]
    pairs = [(left, right) for left, right in zip(units, units[1:]) if left[1] is not None and right[1] is not None]
    if kind == "K":
        # Kerned: how far from each character the next is drawn, for its kerning, below
        table = gaps.setdefault(face, {})
        for (left, x, _), (right, after, _) in pairs:
            if not left.startswith("⟨") and not right.startswith("⟨"):
                table[left + right] = thousandths(after - x)
        kerned_lines.append((face, units))
    elif kind == "L" or kind == "A":
        # L isn't kerned: the width of each glyph that isn't a character's, from it to the next. Both: the glyphs of each
        # word with any such glyph, and A's words' widths, to the space after them, in points
        for (left, x, _), (_, after, _) in pairs:
            if left.startswith("⟨") and kind == "L":
                ligature_gaps.setdefault(face, {}).setdefault(left, []).append(thousandths(after - x))
        words = joined.setdefault(f"{face}|{ligatures}", {})
        word = []
        # Words are parted by spaces, U+0020; a no-break space is in its word. The last ends with the line
        for unit, x, end in [*units, (" ", None, "end")]:
            if unit != " ":
                word.append((unit, x))
                continue
            # A space ends a word, drawn or not: where it is drawn, A's word is as wide as from its start to the space
            if word and all(at is not None for _, at in word):
                key = "".join(letters_of(unit) for unit, _ in word)
                read_words.setdefault(f"{face}|{ligatures}", set()).add(key)
                if any(unit.startswith("⟨") for unit, _ in word):
                    words[key] = [unit for unit, _ in word]
                if kind == "A" and x is not None:
                    aptos.append([face, ligatures, key, [unit for unit, _ in word], round(x - word[0][1], 4)])
            word = []
    elif kind == "P":
        # Where each word starts, from the start of the line, in points
        starts = []
        for at, (unit, x, _) in enumerate(units):
            if x is not None and unit not in SPACES and (at == 0 or units[at - 1][0] in SPACES):
                starts.append(round(x - units[0][1], 4))
        prose.append([face, text, starts])
    elif kind == "LK":
        # Kerned: the kerning between each glyph that isn't a character's and the glyph beside it, below. The gaps after
        # them count for their widths too, as most of the glyphs beside them aren't kerned with them
        beside_lines.append((index, name, face, ligatures, pairs))
        for (left, x, _), (_, after, _) in pairs:
            if left.startswith("⟨"):
                ligature_gaps.setdefault(face, {}).setdefault(left, []).append(thousandths(after - x))


# The kerning of each pair: how much nearer the second character is drawn than the first's width. A character's width
# is the gap most of the pairs it starts have, as most aren't kerned, the gaps within a thousandth of an em of the most
# common averaged: Word draws a few characters of I a little off, where it draws them on their own
kerning = {}
for face, table in gaps.items():
    advances = advance_of[face]
    after = {}
    for pair, gap in table.items():
        after.setdefault(pair[0], []).append(gap)
    for character, values in after.items():
        rounded = [round(value) for value in values]
        common = max(set(rounded), key=rounded.count)
        near = [value for value in values if abs(value - common) <= 1]
        advances[character] = round(sum(near) / len(near), 2)

# The PDF draws a run of glyphs from where Word puts its first, and the rest from the widths of the glyphs at a size
# rounded to its grid of 1/300 inch, with a spacing between characters, written to 4 places, that makes up for it: so
# each glyph after the first is a little further off, by the same amount each time, up to about 0.05 points over a long
# run, and the first of the next run is where Word put it. That is taken out, from how much the unkerned pairs of each run
# are off on average, before the gaps are read
corrected = {}
for face, units in kerned_lines:
    advances = advance_of[face]
    table = corrected.setdefault(face, {})
    xs = [x for _, x, _ in units]
    at = 0
    while at < len(units):
        run = units[at][2]
        end = at
        while end + 1 < len(units) and units[end + 1][2] == run and units[end + 1][1] is not None:
            end += 1
        offs = [
            units[step + 1][1] - units[step][1] - advances.get(units[step][0], 0) * SIZE / 1000
            for step in range(at, end)
            if units[step][0] in advances
        ]
        # The pairs that aren't kerned, which are off by the run's drift alone
        plain = sorted(off for off in offs if abs(off) < 0.03)
        drift = plain[len(plain) // 2] if len(plain) >= 3 else 0
        for step in range(at, end + 1):
            if xs[step] is not None:
                xs[step] -= (step - at) * drift
        at = end + 1
    for step in range(len(units) - 1):
        left, right = units[step][0], units[step + 1][0]
        if xs[step] is None or xs[step + 1] is None or left.startswith("⟨") or right.startswith("⟨"):
            continue
        table[left + right] = thousandths(xs[step + 1] - xs[step])
for face, table in corrected.items():
    kerning[face] = {pair: round(gap - advance_of[face][pair[0]], 2) for pair, gap in table.items()}

# The width of each glyph that isn't a character's: the gap it most often has after it in L and LK, as for characters
def most_common(values):
    rounded = [round(value) for value in values]
    common = max(set(rounded), key=rounded.count)
    near = [value for value in values if abs(value - common) <= 1]
    return round(sum(near) / len(near), 2)


for face, table in ligature_gaps.items():
    for name, values in table.items():
        advance_of[face][name] = most_common(values)

# The kerning beside each glyph that isn't a character's, from LK, with the widths of characters from K and of the
# others from L
for index, name, face, ligatures, pairs in beside_lines:
    table = beside.setdefault(f"{face}|{ligatures}", {})
    advances = advance_of[face]
    for (left, x, _), (right, after, _) in pairs:
        if not left.startswith("⟨") and not right.startswith("⟨"):
            continue
        width = advances.get(left)
        if width is None:
            problems.append(f"line {index + 1} ({name}): no width for {left}")
            continue
        table[f"{left}|{right}"] = round(thousandths(after - x) - width, 2)

# The small probes: the width of what is after each one's name, in points
small = {}
boxes = open(base + ".html", encoding="utf8").read()
# On the pages of letter size after the large ones
words = [
    (page, float(y0), float(x0), float(x1), html.unescape(word))
    for page, (width, content) in enumerate(re.findall(r'<page width="([\d.]+)".*?>(.*?)</page>', boxes, re.S))
    if float(width) < 1000
    for x0, y0, x1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', content)
]
for name, text, kerned, ligatures in probe["small"]:
    # From the start of the first word after the name to the end of the last on its line, as small capitals of two sizes
    # are boxed as words of their own
    label = next((word for word in words if word[4] == name), None)
    after = [word for word in words if label and word[0] == label[0] and abs(word[1] - label[1]) < 3 and word[2] > label[3]]
    small[name] = round(max(word[3] for word in after) - min(word[2] for word in after), 3) if after else None

result = {
    "advances": advance_of,
    "kerning": kerning,
    "joined": joined,
    "words": {key: sorted(words) for key, words in read_words.items()},
    "beside": beside,
    "aptos": aptos,
    "prose": prose,
    "small": small,
    "problems": problems,
}

if "--json" in sys.argv:
    print(json.dumps(result, ensure_ascii=False))
    sys.exit()

for problem in problems[:20]:
    print("!", problem)
print(f"== K: kerning of each pair of the {len(probe['characters'])} characters, in thousandths of an em, of the pairs read")
for face, table in kerning.items():
    kerned = {pair: value for pair, value in table.items() if abs(value) >= 0.5}
    examples = " ".join(f"{pair}:{kerned[pair]:g}" for pair in ["To", "AV", "Te", "Yo", "L'", "A ", " A", "ff", "f."] if pair in kerned)
    print(f"  {face:28} {len(kerned):5} of {len(table):5} kerned  {examples}")
print("\n== L: what ligatures put in place of characters, not kerned: the glyph, and its width less the characters'")
for key, words in joined.items():
    face, setting = key.split("|")
    advances = advance_of[face]
    glyphs = sorted({name for units in words.values() for name in units if name.startswith("⟨")})
    changes = " ".join(
        f"{name}:{advances.get(name, 0) - sum(advances.get(letter, 0) for letter in letters_of(name)):+.1f}" for name in glyphs
    )
    print(f"  {key:44} {len(words):4} words  {changes}")
print("\n== LK: kerning beside ligatures, in thousandths of an em")
for key, table in beside.items():
    kerned = {pair: value for pair, value in table.items() if abs(value) >= 0.5}
    print(f"  {key:44} {len(kerned):5} of {len(table):5} pairs kerned  " + " ".join(f"{pair}:{value:g}" for pair, value in list(kerned.items())[:8]))
print("\n== A: Aptos's words, kerned, with ligatures: the first few, with their glyphs and width in points")
for face, setting, word, units, width in aptos[:12]:
    print(f"  {face} {setting}: {word!r} {' '.join(units)} {width}")
print("\n== P: where the first words of each font's first line of prose start, in points")
for face in dict.fromkeys(face for face, _, _ in prose):
    starts = next(starts for other, _, starts in prose if other == face)
    print(f"  {face:28} " + " ".join(f"{start:.2f}" for start in starts[:10]))
print("\n== R and SP: the width of what is after each probe's name, in points")
for name, width in small.items():
    print(f"  {name}: {width}")
