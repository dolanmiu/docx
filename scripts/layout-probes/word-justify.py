# Reads the probes of word-justify.docx and word-justify2.docx (word-justify.ts) from a PDF of each, and prints, for each
# probe's first line, how far past the margin its last word was, and whether it went on the line, with the spaces
# squeezed, or on the next.
#
#   pdftotext -bbox-layout word-justify.pdf word-justify.html
#   python3 word-justify.py word-justify
#
# It takes the name of the PDF without its extension, and reads the file above beside it. Lengths are in twips.
#
# A justified line that isn't a paragraph's last is drawn as wide as the room for it, so where its last word ends gives
# the room, unless it is a single word, which isn't stretched: then the paragraph's next line gives it. How wide the
# line is unsqueezed is how wide it is drawn, with each gap between its words made as wide as an unsqueezed space, and,
# when the last word went on to the next line, a space and that word added. How wide an unsqueezed space is comes from
# J00's left-aligned lines, measured as the gaps are, so the boxes pdftotext gives words don't change it.
#
# For each line it prints how far past the margin the word was (`over`), as a share of the word (`of word`), the share of
# their width the line's spaces would be squeezed by for it to fit, their widths being the fonts' own (`squeeze`), and
# the share the spaces before the word would stretch by if it went on the next line, against that (`stretch/squeeze`).
# Distributed lines spread their letters too, so J12 and J13 take the width of J04's line, whose words they share, and
# their labels are as wide.
# cspell:ignore bbox Kashida
import html
import re
import statistics
import sys

LEFT = 1440
# The width of a space in each font, its own: Calibri's is 463/2048 of an em, Times New Roman's a quarter, and Courier
# New's 1229/2048. Word squeezes spaces in proportion to these, so the shares are of them
OWN_SPACES = {"Calibri": 463 / 2048 * 220, "Times New Roman": 240 / 4, "Courier New": 1229 / 2048 * 220}
CALIBRI = lambda gap: "Calibri"


def read(base):
    """Each line, as a list of its words: (page, left, top, right, bottom, text), in twips, from the top of the page down.
    A line is the words beside a word, those whose box reaches the middle of its box, as pdftotext puts words of other
    sizes, such as the ideographs after a label in Calibri, on lines of their own"""
    text = open(base + ".html", encoding="utf8").read()
    found = []
    pattern = r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>'
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        words = [(page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word)) for x0, y0, x1, y1, word in re.findall(pattern, content)]
        taken = set()
        for word in sorted(words, key=lambda word: (word[2], word[1])):
            if word in taken:
                continue
            middle = (word[2] + word[4]) / 2
            line = sorted((other for other in words if other not in taken and other[2] <= middle <= other[4]), key=lambda other: other[1])
            taken.update(line)
            found.append(line)
    return sorted(found, key=lambda line: (line[0][0], line[0][2]))


def find(lines, label):
    """The index of the line that starts with a label"""
    return next((index for index, line in enumerate(lines) if line[0][5].startswith(label)), None)


def width(word):
    return word[3] - word[1]


def gaps(line):
    return [line[index + 1][1] - line[index][3] for index in range(len(line) - 1)]


def label(series, number, document="J"):
    return f"{document}{series:02}_{number:02}"


def measure(lines, name, measured, font_of=CALIBRI, word="coast", word_width=None):
    """A probe's first line: whether its last word, `word`, is on it, the room for it, how wide it is unsqueezed with that
    word, how wide the word is, how many spaces it has with the space before the word, and how wide they are, as the
    fonts have them. `font_of` gives the font of the space at each gap of the line, and `measured` how wide an unsqueezed
    space in each font is measured to be. `word_width` is the word's width, for a word that went on to a distributed
    paragraph's last line, which spreads out its letters"""
    space_of = lambda gap: measured[font_of(gap)]
    index = find(lines, name)
    if index is None:
        return None
    line = lines[index]
    following = lines[index + 1] if index + 1 < len(lines) else None
    fitted = line[-1][5] == word
    drawn = line[-1][3] - line[0][1]
    # A line of one word isn't stretched, so the room is that of the paragraph's next line, which isn't its last
    room = drawn if len(line) > 1 else following[-1][3] - following[0][1]
    unsqueezed = drawn + sum(space_of(gap) - actual for gap, actual in enumerate(gaps(line)))
    count = len(line) - 1
    if fitted:
        word = width(line[-1])
    else:
        word = word_width or width(following[0])
        unsqueezed += space_of(count) + word
        count += 1
    spaces = [OWN_SPACES[font_of(gap)] for gap in range(count)]
    return {"fitted": fitted, "room": room, "unsqueezed": unsqueezed, "word": word, "count": count, "spaces": spaces, "line": line, "gaps": gaps(line)}


def describe(probe, unsqueezed=None):
    """How far past the margin a probe's word was, as a length and in shares: of the word, of the line's spaces, which Word
    squeezes in proportion to their widths, and the share the spaces before the word would stretch by without it, against
    that"""
    unsqueezed = unsqueezed or probe["unsqueezed"]
    over = unsqueezed - probe["room"]
    spaces = probe["spaces"]
    squeeze = over / sum(spaces)
    before = sum(spaces[:-1])
    # The word and the space before it, less how far past the margin they go, is how far the spaces before would stretch
    stretch = (probe["word"] + spaces[-1] - over) / before if before > 0 else float("inf")
    return {"over": over, "of word": over / probe["word"], "squeeze": squeeze, "ratio": stretch / squeeze if squeeze > 0 else float("inf")}


def report(lines, series, count, measured, font_of=CALIBRI, unsqueezed=None, note="", word="coast", word_width=None, document="J"):
    """Each probe of a series, and the bounds the series sets on each share"""
    print(f"\n== {document}{series:02}: {note}")
    rows = []
    for number in range(1, count + 1):
        name = label(series, number, document)
        probe = measure(lines, name, measured, font_of, word, word_width)
        if probe is None:
            print(f"  {name}: not found")
            continue
        shares = describe(probe, unsqueezed)
        rows.append((probe["fitted"], shares))
        print(
            f"  {name}: {'squeezed in' if probe['fitted'] else 'wrapped    '}  over {shares['over']:6.1f}, of word {shares['of word'] * 100:5.1f}%,"
            f" squeeze {shares['squeeze'] * 100:5.1f}% of the spaces, stretch/squeeze {shares['ratio']:5.2f}, gaps {min(probe['gaps'], default=0):.1f} to {max(probe['gaps'], default=0):.1f}"
        )
    for key, name in [("of word", "of the word"), ("squeeze", "of the spaces"), ("ratio", "stretch/squeeze")]:
        fitted = [shares[key] for fitted, shares in rows if fitted]
        wrapped = [shares[key] for fitted, shares in rows if not fitted]
        scale = 1 if key == "ratio" else 100
        low = f"{(min(fitted) if key == 'ratio' else max(fitted)) * scale:.2f}" if fitted else "-"
        high = f"{(max(wrapped) if key == 'ratio' else min(wrapped)) * scale:.2f}" if wrapped else "-"
        print(f"  {name}: squeezed in {'down to' if key == 'ratio' else 'up to'} {low}, wrapped {'up from' if key == 'ratio' else 'from'} {high}")
    return rows


def main(base):
    lines = read(base)

    # The width of an unsqueezed space, measured as the gaps are, from J00's left-aligned lines
    spaces = {}
    for number, font in [(1, "Calibri"), (2, "Times New Roman"), (3, "Courier New")]:
        index = find(lines, label(0, number))
        spaces[font] = statistics.median(gaps(lines[index]))
        print(f"An unsqueezed space in {font} measures {spaces[font]:.2f}, and is {OWN_SPACES[font]:.2f}")

    for series, count, word, note in [
        (1, 18, "a", "19 spaces, 'a'"),
        (2, 18, "a", "6 spaces, 'a'"),
        (3, 18, "a", "2 spaces, 'a'"),
        (4, 18, "coast", "19 spaces, 'coast'"),
        (5, 18, "coast", "6 spaces, 'coast'"),
        (6, 18, "coast", "2 spaces, 'coast'"),
        (7, 19, "lighthouse", "19 spaces, 'lighthouse'"),
    ]:
        report(lines, series, count, spaces, note=note, word=word)
    report(lines, 8, 18, spaces, lambda gap: "Times New Roman", note="Times New Roman 12, 19 spaces, 'coast'")
    # J09's spaces in Courier New are before, between and after its 7th to 9th words, counting the label
    courier = lambda gap: "Courier New" if 6 <= gap <= 9 else "Calibri"
    report(lines, 9, 18, spaces, courier, note="19 spaces, 4 of them in Courier New, 'coast'")
    for number in range(1, 19):
        probe = measure(lines, label(9, number), spaces, courier)
        if probe and probe["fitted"]:
            print(f"  {label(9, number)} gaps: {[round(gap, 1) for gap in probe['gaps']]}")
            break

    j04 = [measure(lines, label(4, number), spaces) for number in range(1, 19)]
    j04_unsqueezed = statistics.median(probe["unsqueezed"] for probe in j04 if probe)
    coast = statistics.median(probe["word"] for probe in j04 if probe)
    print(f"\nJ04's line unsqueezed, from each: {', '.join(f'{probe['unsqueezed']:.1f}' for probe in j04 if probe)}")
    for series, count, note in [
        (10, 2, "the last line of a paragraph, 'coast' past the margin by 10% and 25% of it"),
        (11, 2, "a line ending with a line break, by 10% and 25%"),
        (12, 2, "the last line of a distributed paragraph, by 10% and 25%"),
        (13, 9, "distributed, as J04"),
        (14, 8, "thaiDistribute, lowKashida, mediumKashida and highKashida, each by 10% and 70%"),
    ]:
        report(lines, series, count, spaces, unsqueezed=j04_unsqueezed, note=f"{note}, with J04's line", word_width=coast)

    print("\n== J15: a tab after the 13th space, then 3 spaces, 'coast' by 5%, 10% and 25%")
    for number in range(1, 4):
        index = find(lines, label(15, number))
        if index is not None:
            line = lines[index]
            print(f"  {label(15, number)}: {'squeezed in' if line[-1][5] == 'coast' else 'wrapped'}, gaps {[round(gap, 1) for gap in gaps(line)]}")

    print("\n== J16: 8 no-break spaces and 11 others, 'coast' by 10%")
    index = find(lines, label(16, 1))
    if index is not None:
        line = lines[index]
        print(f"  {label(16, 1)}: {'squeezed in' if line[-1][5] == 'coast' else 'wrapped'}, words {[word[5] for word in line]}, gaps {[round(gap, 1) for gap in gaps(line)]}")

    print("\n== J17: ideographs past the margin by 10%, 30% and 50% (01 to 03), and a full stop by 10% and 50% (04, 05)")
    for number in range(1, 6):
        name = label(17, number)
        index = find(lines, name)
        if index is None:
            print(f"  {name}: not found")
            continue
        line = lines[index]
        text = "".join(word[5] for word in line)[len(name) :]
        print(f"  {name}: {len(text)} characters on the line, ending with {text[-1]} at {line[-1][3] - LEFT:.1f}")

    print("\n== J18: 8 spaces at the start, then 11 between words, 'coast' by 10%")
    index = find(lines, label(18, 1))
    if index is not None:
        line = lines[index]
        print(f"  {label(18, 1)}: {'squeezed in' if line[-1][5] == 'coast' else 'wrapped'}, starts at {line[0][1] - LEFT:.1f}, gaps {[round(gap, 1) for gap in gaps(line)]}")


def main2(base):
    lines = read(base)
    spaces = {"Calibri": statistics.median(gaps(lines[find(lines, label(0, 1, "K"))]))}
    print(f"An unsqueezed space in Calibri measures {spaces['Calibri']:.2f}, and is {OWN_SPACES['Calibri']:.2f}")
    for series, count, word, note in [
        (1, 18, "a", "distributed, 19 spaces, 'a'"),
        (2, 18, "a", "distributed, 6 spaces, 'a'"),
        (3, 18, "a", "distributed, 2 spaces, 'a'"),
        (4, 18, "coast", "distributed, 19 spaces, 'coast'"),
        (5, 18, "coast", "distributed, 6 spaces, 'coast'"),
        (6, 18, "coast", "distributed, 2 spaces, 'coast'"),
        (7, 19, "lighthouse", "distributed, 19 spaces, 'lighthouse'"),
        (8, 18, "coast", "thaiDistribute, 19 spaces, 'coast'"),
        (9, 18, "coast", "lowKashida, 19 spaces, 'coast'"),
        (10, 15, "a", "justified, a word and 1 space, 'a'"),
        (11, 15, "coast", "justified, a word and 1 space, 'coast'"),
        (12, 15, "a", "distributed, a word and 1 space, 'a'"),
    ]:
        report(lines, series, count, spaces, note=note, word=word, document="K")


if __name__ == "__main__":
    (main2 if sys.argv[1].endswith("word-justify2") else main)(sys.argv[1])
