# Reads the probes of word-hyphenation.ts from a PDF of each of its four documents, and prints how each paragraph's lines
# end in each, side by side: word-hyphenation, -zone, -limit and -manual.
#
#   for name in word-hyphenation word-hyphenation-zone word-hyphenation-limit word-hyphenation-manual; do
#       pdftotext -bbox-layout $name.pdf $name.html
#   done
#   python3 word-hyphenation.py word-hyphenation word-hyphenation-zone word-hyphenation-limit word-hyphenation-manual
#
# It takes the names of the PDFs without their extensions, and reads the .html beside each. For each probe, it prints
# each line's last word and where its right edge is, in twips from the left margin, with a + where the line ends with a
# hyphen that isn't in the text, so a word Word broke. Word's PDFs put text on a grid of 1/300 inch, 4.8 twips.
import html
import re
import sys

LEFT = 1440
WIDTH = 9026
# The text's hyphens, which a line can end with without a word being broken there
HYPHENATED_IN_TEXT = ("well-",)
LABEL = re.compile(r"^HY\d+[a-z]?$")


def read(base):
    """Each line, as a list of its words: (page, left, right, text), in twips"""
    text = open(base + ".html", encoding="utf8").read()
    lines = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (page, float(x0) * 20, float(x1) * 20, html.unescape(word))
                for x0, x1, word in re.findall(r'<word xMin="([\d.]+)" yMin="[\d.]+" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', line)
            ]
            if words:
                lines.append(words)
    return lines


def paragraphs(lines):
    """Each probe's lines, by its name: from the line that starts with it to the next that starts with another"""
    found = {}
    current = None
    for line in lines:
        first = line[0][3]
        if LABEL.match(first):
            current = first
            found[current] = []
        elif first.startswith("HY") and first[2:].isdigit():
            # The first line of a group, which isn't a probe's
            current = None
            continue
        if current is not None:
            found[current].append(line)
    return found


def ending(line):
    """A line's last word, with a + when Word broke the word there, and its right edge"""
    page, _, right, word = line[-1]
    broken = word.endswith("-") and word not in HYPHENATED_IN_TEXT and len(word) > 1
    return f"{word}{' +' if broken else ''} {round(right - LEFT)}"


def report(names):
    documents = [paragraphs(read(name)) for name in names]
    labels = sorted({label for document in documents for label in document}, key=lambda label: (int(re.sub(r"\D", "", label)), label))
    for label in labels:
        print(f"== {label}")
        for name, document in zip(names, documents):
            lines = document.get(label)
            if lines is None:
                print(f"  {name}: not found")
                continue
            broken = sum(1 for line in lines if ending(line).split(" ")[1:2] == ["+"])
            print(f"  {name}: {len(lines)} lines, {broken} broken with a hyphen, on page {lines[0][0][0]}")
            for line in lines:
                print(f"    {ending(line)}  | {' '.join(word[3] for word in line[-4:])}")


if __name__ == "__main__":
    report(sys.argv[1:])
