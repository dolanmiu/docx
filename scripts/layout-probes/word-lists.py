# Reads the probes of word-lists.docx from a PDF of it, and prints what each shows.
#
#   pdftotext -bbox-layout word-lists.pdf word-lists.html
#   pdftohtml -xml -i -q -zoom 1 word-lists.pdf word-lists
#   python3 word-lists.py word-lists
#
# It takes the name of the PDF without its extension and reads the two files above beside it. Lengths are in twips, across
# the page from the left margin, or for a right-to-left paragraph back from the right margin. Word's PDFs put text on a
# grid of 1/300 inch, 4.8 twips, so a position is only good to about 5 twips.
# cspell:ignore bbox fontspec pdftohtml JORF
import html
import re
import sys

LEFT = 1440
RIGHT = 11906 - 1440


def read(base):
    """Each line, as a list of its words sorted across the page: (page, left, top, right, bottom, text), in twips. Words of
    other sizes on a line, such as a number larger than its text, are on it when their boxes reach the middle of its first
    word's, or its first word's box reaches the middle of theirs"""
    text = open(base + ".html", encoding="utf8").read()
    lines = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        words = sorted(
            (
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content)
            ),
            key=lambda word: (word[2], word[1]),
        )
        found = []
        for word in words:
            middle = (word[2] + word[4]) / 2
            line = next(
                (
                    line
                    for line in found
                    if line[0][2] <= middle <= line[0][4] or word[2] <= (line[0][2] + line[0][4]) / 2 <= word[4]
                ),
                None,
            )
            if line is None:
                found.append([word])
            else:
                line.append(word)
        lines += [sorted(line, key=lambda word: word[1]) for line in found]
    return lines


def fonts_of(base):
    """The size and font of each piece of text, from pdftohtml -xml -zoom 1: (page, top in twips, text, size, font), with
    " bold" after the font when pdftohtml marks the piece bold"""
    text = open(base + ".xml", encoding="utf8").read()
    pieces = []
    for page, content in enumerate(re.findall(r"<page .*?</page>", text, re.S), 1):
        specs = {spec: (float(size), family) for spec, size, family in re.findall(r'<fontspec id="(\d+)" size="([\d.]+)" family="([^"]*)"', text)}
        for top, font, piece in re.findall(r'<text top="([\d.]+)" left="[\d.]+" width="[\d.]+" height="[\d.]+" font="(\d+)">(.*?)</text>', content):
            size, family = specs[font]
            bold = " bold" if "<b>" in piece else ""
            pieces.append((page, float(top) * 20, html.unescape(re.sub(r"<[^>]+>", "", piece)), size, family.split("+")[-1] + bold))
    return pieces


def label_of(line):
    """Where the probe's name is among a line's words, or None"""
    return next((i for i, word in enumerate(line) if re.fullmatch(r"L[JORF]\d+[a-h]?", word[5])), None)


def paragraph(lines, probe):
    """The lines of a probe's paragraph: its first, with the probe's name, and those after it up to the next probe's"""
    start = next((i for i, line in enumerate(lines) if any(word[5] == probe for word in line)), None)
    if start is None:
        return []
    found = [lines[start]]
    for line in lines[start + 1 :]:
        if label_of(line) is not None or line[0][0] != found[0][0][0] or any(word[5] in ("LJ", "beside") for word in line):
            break
        found.append(line)
    return found


def twips(value):
    return f"{value:7.1f}"


def alignment_probes(lines):
    print("== LJ: a number 1085 wide, then 40 words: where the number is and where the text after it starts")
    print("   (the first line starts at 1440 and the others at 1800 unless given; a left-aligned number would end at 2525)")
    for probe in ["LJ1", "LJ2", "LJ3", "LJ4", "LJ5", "LJ6", "LJ7", "LJ8", "LJ9"]:
        found = paragraph(lines, probe)
        if not found:
            print(f"  {probe}: not found")
            continue
        first = found[0]
        label = label_of(first)
        # In LJ9's cell the line goes on into the cell beside it
        text = [word for word in first[label:] if word[1] < first[label][1] + 9026 and word[5] != "LJ9" or word is first[label]]
        text = [word for word in text if not (probe == "LJ9" and word[5] in ("LJ9", "beside") and word is not first[label])]
        numbers = first[:label]
        number = f"the number from {twips(numbers[0][1] - LEFT)} to {twips(numbers[-1][3] - LEFT)}" if numbers else "no number"
        print(
            f"  {probe}: {number}, the text from {twips(first[label][1] - LEFT)}; first line ends '{text[-1][5]}' at"
            f" {twips(text[-1][3] - LEFT)}, {len(found)} lines, the second from {twips(found[1][0][1] - LEFT) if len(found) > 1 else '?'}"
        )
    print("   right to left, back from the right margin:")
    for probe in ["LJ10", "LJ11"]:
        found = paragraph(lines, probe)
        if not found:
            print(f"  {probe}: not found")
            continue
        first = found[0]
        # The number is the rightmost words: "Paragraph1" and its full stop, which may be drawn on either side of it
        at = next((word for word in first if "Paragraph" in word[5]), None)
        number = [word for word in first if at and (word is at or (word[5] == "." and (abs(word[1] - at[3]) < 60 or abs(word[3] - at[1]) < 60)))]
        text = [word for word in first if word not in number]
        print(
            f"  {probe}: the number '{''.join(word[5] for word in number)}' from {twips(RIGHT - number[-1][3]) if number else '?'} to"
            f" {twips(RIGHT - number[0][1]) if number else '?'}, the text from {twips(RIGHT - text[-1][3])}; first line"
            f" '{text[0][5]} ... {text[-1][5]}', {len(found)} lines"
        )


def numbers_of(lines, prefix):
    """Each probe line of a group, with the number before its name"""
    found = []
    for line in lines:
        label = label_of(line)
        if label is not None and line[label][5].startswith(prefix) and line[-1][5] != "end":
            found.append(f"{' '.join(word[5] for word in line[:label]) or '-'} {line[label][5]}")
    return found


def counting_probes(lines):
    print("\n== LO: lists that share a definition (A and B), numbered in the order of their names' letters")
    for probe in ["LO1", "LO2", "LO3", "LO4", "LO5", "LO6", "LO7", "LO8", "LO9"]:
        print(f"  {probe}: " + ", ".join(numbers_of(lines, probe)))
    print("\n== LR: levels that start again, legal numbering, and a level used before the one above it")
    for probe in ["LR1", "LR2", "LR3", "LR4"]:
        print(f"  {probe}: " + ", ".join(numbers_of(lines, probe)))


def font_probes(lines, pieces):
    print("\n== LF: the number's size and font, its width, and how far the baselines of its text and of the lines above and below it are")
    for probe in ["LF1", "LF2", "LF3", "LF4", "LF5", "LF6"]:
        at = next((i for i, line in enumerate(lines) if any(word[5] == probe for word in line)), None)
        if at is None:
            print(f"  {probe}: not found")
            continue
        found = lines[at]
        label = label_of(found)
        number = found[0]
        piece = next((piece for piece in pieces if piece[0] == number[0] and abs(piece[1] - number[2]) < 200 and piece[2].strip() == number[5]), None)
        text = next((piece for piece in pieces if piece[0] == number[0] and piece[2].startswith(probe)), None)
        # The bottoms of words of the same size are their baselines less the same descent
        above = f"{twips(found[label][4] - lines[at - 1][0][4])}" if at > 0 and lines[at - 1][0][0] == number[0] else "the top"
        below = twips(lines[at + 1][0][4] - found[label][4]) if at + 1 < len(lines) else "?"
        print(
            f"  {probe}: number '{number[5]}' {piece[3] if piece else '?'} points {piece[4] if piece else '?'}, {twips(number[3] - number[1])} wide;"
            f" text {text[3] if text else '?'} points {text[4] if text else '?'} from {twips(found[label][1] - LEFT)}; its baseline {above} below the line above's,"
            f" the next line's {below} below it"
        )


if __name__ == "__main__":
    base = sys.argv[1]
    lines = read(base)
    alignment_probes(lines)
    counting_probes(lines)
    font_probes(lines, fonts_of(base))
