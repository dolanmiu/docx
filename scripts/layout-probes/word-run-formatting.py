# cspell:ignore rffour
# Reads the probes of word-run-formatting.ts and word-run-formatting2.ts from a PDF of each, and prints what each shows.
#
#   pdftotext -bbox-layout word-run-formatting.pdf word-run-formatting.html
#   python3 word-run-formatting.py word-run-formatting
#
# It takes the name of the PDF without its extension and reads the HTML beside it. Lengths are in twips. Word's PDFs put
# text on a grid of 1/300 inch, 4.8 twips, so one position is only good to about 5 twips; the pitch of a group's lines is
# the range of line heights that puts all of them where they are on the grid, as word-watertight.py finds it.
import html
import re
import sys

GRID = 4.8
# Calibri 11's lines in Word
LINE = 2500 / 2048 * 220


def read(base):
    """Each line pdftotext found, as a list of its words: (page, left, top, right, bottom, text), in twips"""
    text = open(base + ".html", encoding="utf8").read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line)
            ]
            if words:
                found.append(words)
    return found


def pitch(tops):
    """The range of line heights that puts lines at these tops on the grid, or the mean gap where none does, as LibreOffice's
    PDFs aren't on the grid"""
    if len(tops) < 2:
        return "-"
    mean = f"about {round((tops[-1] - tops[0]) / (len(tops) - 1), 2)}"
    if any(abs((top - tops[0]) / GRID - round((top - tops[0]) / GRID)) > 0.01 for top in tops):
        return mean
    places = [round((top - tops[0]) / GRID) for top in tops]
    heights = []
    height = 50.0
    while height < 2000:
        low, high = -0.5, 0.5
        for index, place in enumerate(places):
            low = max(low, place - 0.5 - index * height / GRID)
            high = min(high, place + 0.5 - index * height / GRID)
            if low >= high:
                break
        if low < high:
            heights.append(height)
        height += 0.005
    return f"{round(min(heights), 2)} to {round(max(heights), 2)}" if heights else mean


def labelled(lines, probe, name):
    """The first word of the line whose first two words are the probe and this name, in any case, as small capitals are
    capitals in the PDF"""
    for line in lines:
        if len(line) >= 2 and line[0][5].lower() == probe.lower() and line[1][5].lower() == name.lower():
            return line
    return None


def group(lines, probe, names=None):
    """A group's pitch, from the tops of its labels on the page most of them are on, and the gaps from the line above to
    its first line and from its last line to the line below, on that page"""
    names = names or [str(index) for index in range(1, 11)]
    found = [labelled(lines, probe, name) for name in names]
    found = [line[0] for line in found if line is not None]
    if not found:
        return f"{probe}: not found"
    pages = [word[0] for word in found]
    page = max(set(pages), key=pages.count)
    tops = [word[2] for word in found if word[0] == page]
    above = labelled(lines, probe, "above")
    below = labelled(lines, probe, "below")
    gap_above = round(tops[0] - above[0][2], 1) if above and above[0][0] == page and pages[0] == page else "-"
    gap_below = round(below[0][2] - tops[-1], 1) if below and below[0][0] == page and pages[-1] == page else "-"
    return f"{probe}: {len(tops)} lines on page {page}, pitch {pitch(tops)}, from the line above {gap_above}, to the line below {gap_below}"


def word_after(lines, probe, key, text):
    """The word of this text after the label of the probe and key, on its line: pdftotext puts words of other sizes, such as
    superscript, on lines of their own, so it is the nearest word of the text to the label's middle, within its height"""
    line = labelled(lines, probe, key)
    if not line:
        return None
    label = line[1]
    middle = (label[2] + label[4]) / 2
    words = [word for other in lines for word in other if word[0] == label[0] and word[5] == text and word[1] > label[3]]
    words = [word for word in words if abs((word[2] + word[4]) / 2 - middle) < label[4] - label[2]]
    return min(words, key=lambda word: abs((word[2] + word[4]) / 2 - middle), default=None)


def width(word):
    return word[3] - word[1] if word else None


DIGITS = "0123456789" * 4
ALPHABET = "abcdefghijklmnopqrstuvwxyz"


def main(base):
    lines = read(base)
    if base.endswith("2"):
        second(lines)
        return

    print("== RF1: superscript and subscript digits, against the same digits plain at 10 points: the size they are drawn at")
    references = {font: width(word_after(lines, "RF1", f"{font}20plain", DIGITS)) for font in ["tnr", "arial", "cambria", "courier", "calibri"]}
    for line in lines:
        if len(line) >= 2 and line[0][5] == "RF1" and not line[1][5].endswith("plain"):
            key = line[1][5]
            font, size, kind = re.match(r"([a-z]+)(\d+)(sup|sub)", key).groups()
            digits = width(word_after(lines, "RF1", key, DIGITS))
            if digits and references.get(font):
                drawn = 10 * digits / references[font]
                print(f"  {key:16}: {int(size) / 2:5} points, 65% {int(size) * 0.65 / 2:6.3f}; digits {digits:7.1f} wide, drawn at {drawn:.2f} points")

    print("\n== RF2: lines with a superscript or subscript digit, all of a line in one font (its own line, alone: Times New Roman")
    print("   10 230, 12 276; Arial 11 252.98; Cambria 11 257.89; Courier New 10 226.5; Calibri 20 488.28)")
    for probe in "abcdefghijkl":
        print("  " + group(lines, f"RF2{probe}"))

    print("\n== RF3: which size counts: lines of only superscript, only subscript, and a 20-point digit in superscript and")
    print("   subscript in a line of Calibri 11")
    for probe in "abcd":
        print("  " + group(lines, f"RF3{probe}"))

    print("\n== RF4: small capitals against typed capitals: the size the small letters are drawn at")
    for line in lines:
        if len(line) >= 2 and line[0][5] == "RF4" and line[1][5].endswith("small") and line[1][5] != "supsmall":
            key = line[1][5][: -len("small")]
            size = int(re.search(r"\d+", key).group()) / 2
            small = width(word_after(lines, "RF4", f"{key}small", ALPHABET.upper()))
            caps = width(word_after(lines, "RF4", f"{key}caps", ALPHABET.upper()))
            if small and caps:
                print(f"  {key:10}: {size:5} points, 80% {size * 0.8:5.2f}; small {small:7.1f}, capitals {caps:7.1f}: drawn at {size * small / caps:.2f} points")
    small = width(word_after(lines, "RF4", "supsmall", ALPHABET.upper()))
    caps = width(word_after(lines, "RF4", "supcaps", ALPHABET.upper()))
    if small and caps:
        print(f"  superscript small capitals at 12 points: small {small:.1f}, capitals {caps:.1f} (drawn at 8): small drawn at {8 * small / caps:.2f} points")
    print("  " + group(lines, "rffour", list("abcdefghij")))

    print("\n== RF5: raised and lowered text (Calibri 11 alone: 268.55)")
    for probe in "abcdefghijklm":
        print("  " + group(lines, f"RF5{probe}"))

    print("\n== RF6: emphasis marks (Calibri 10 alone: 244.14; 12 292.97; 20 488.28; Times New Roman 10 230; Arial 11 252.98;")
    print("   Cambria 11 257.89; Calibri 11 268.55, with dots 335.69 in TX15)")
    for probe in "abcdefghijklmn":
        print("  " + group(lines, f"RF6{probe}"))
        dotted = width(word_after(lines, f"RF6{probe}", "1", "dotted"))
        if dotted:
            print(f"      'dotted' {dotted:.1f} wide")

    print("\n== RF7: run borders: the pitch of lines with a bordered word, and where the words are")
    for probe in "abcdefgh":
        print("  " + group(lines, f"RF7{probe}"))
        line = labelled(lines, f"RF7{probe}", "1")
        if line:
            print("      " + ", ".join(f"{word[5]} {word[1]:.1f}-{word[3]:.1f}" for word in line))
    for probe in ["RF7i", "RF7j", "RF7k", "RF7l", "RF7m", "RF7m2"]:
        line = next((line for line in lines if line[0][5] == probe), None)
        if line:
            print(f"  {probe}: " + ", ".join(f"{word[5]} {word[1]:.1f}-{word[3]:.1f}" for word in line))
    for probe in ["RF7n", "RF7o"]:
        start = next((index for index, line in enumerate(lines) if line[0][5] == probe), None)
        if start is None:
            continue
        print(f"  {probe}:")
        for line in lines[start : start + 4]:
            if line[0][5].startswith("RF") and line[0][5] != probe:
                break
            print(f"      top {line[0][2]:.1f}: " + " ".join(f"{word[5]}[{word[1]:.0f}-{word[3]:.0f}]" for word in line))

    print("\n== RF8: 10 empty paragraphs whose marks are raised 6 points, in superscript, with emphasis marks, and with a border:")
    print("   the height of each, from the gap between the lines above and below them (Calibri 11 alone: 268.55)")
    for probe in "abcd":
        above = labelled(lines, f"RF8{probe}", "above")
        below = labelled(lines, f"RF8{probe}", "below")
        if above and below and above[0][0] == below[0][0]:
            gap = below[0][2] - above[0][2]
            print(f"  RF8{probe}: gap {gap:.1f}, each {(gap - LINE) / 10:.2f}")
        else:
            print(f"  RF8{probe}: not on one page")


def second(lines):
    print("== RF9: emphasis marks at other spacings (Calibri 11 alone: 268.55; at 1.08 lines 290.03, 1.15 308.83, 2 537.1,")
    print("   0.8 214.84; with marks single spaced 335.69, and at 1.5 lines 402.83)")
    for probe in "abcdefghi":
        print("  " + group(lines, f"RF9{probe}"))

    print("\n== RF10: emphasis marks on lines taller than their fonts' own (Times New Roman 20 with Courier New 20: 493.56;")
    print("   Calibri 11 with a word raised 6 points: 388.55)")
    for probe in "abcde":
        print("  " + group(lines, f"RF10{probe}"))

    print("\n== RF11: lines whose last word is this many twips short of the end of the line, by docx/layout's widths: the last")
    print("   word of the line and the first of the next")
    for line_index, line in enumerate(lines):
        if line[0][5] in ("RF11a", "RF11d", "RF11e") and len(line) > 1:
            following = lines[line_index + 1] if line_index + 1 < len(lines) else None
            print(
                f"  {line[0][5]} {line[1][5]:>4}: ends with '{line[-1][5]}' at {line[-1][3]:.1f}, the margin at 10466; "
                f"the next line starts with '{following[0][5] if following else '-'}' at {following[0][1] if following else 0:.1f}"
            )

    print("\n== RF12: the room borders take beside a word: the gap before 'boxed' and after it, less the gap of a space")
    for line in lines:
        if line[0][5] == "RF12" and len(line) >= 4:
            words = {word[5]: word for word in line}
            x = words.get("x")
            boxed = next((word for word in line if word[5].startswith("boxed")), None)
            after = words.get("after")
            if x and boxed and after:
                space = 49.4
                print(
                    f"  {line[1][5]:26}: before {boxed[1] - x[3] - space:6.1f}, after {after[1] - boxed[3] - space:6.1f}, "
                    f"'{boxed[5]}' {boxed[3] - boxed[1]:.1f} wide"
                )

    print("\n== RF13: a bordered word raised and lowered 6 points (a bordered word alone: 448.55; raised alone: 388.55)")
    for probe in "ab":
        print("  " + group(lines, f"RF13{probe}"))

    print("\n== RF14: a bordered word in superscript, and in small capitals of small letters (a bordered word: 448.55)")
    for probe in "ab":
        print("  " + group(lines, f"RF14{probe}"))


if __name__ == "__main__":
    main(sys.argv[1])
