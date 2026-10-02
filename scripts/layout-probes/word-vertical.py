# Reads the probes of word-vertical.ts from a PDF of it, and prints each page's lines: for text down the page, each line
# across it from the right, or from the left for V10 and V11, with where it is across the page, where its text starts and ends down it, how many ideographs
# it has, and the words it starts with; for text across the page, each line down it.
#
#   pdftotext -bbox-layout word-vertical.pdf word-vertical.html
#   python3 word-vertical.py word-vertical.html
#
# pdftotext reads Latin words turned on their side as words, and ideographs standing upright down the page as words of one
# character each, so the words are put back into lines by where they are across the page. Lengths are in twips.
# cspell:ignore bbox
import html
import re
import sys

IDEOGRAPH = "永"
# Where the text starts down the page, below the top margin
TOP = 1440
# How far apart across the page the words of one line down it can be
SAME_LINE = 60


def read(path):
    """Each page's words, as (left, top, right, bottom, text), in twips"""
    text = open(path, encoding="utf8").read()
    return [
        [
            (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
            for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content)
        ]
        for content in re.findall(r"<page.*?</page>", text, re.S)
    ]


# The probes whose lines go across the page from the left, rather than the right: tbRlV and tbLrV
FROM_LEFT = {"V10", "V11"}


def down(words, from_left=False):
    """Words put into lines down the page, from the right, or the left: each (middle across, top, bottom, ideographs,
    text)"""
    lines = []
    for word in sorted(words, key=lambda w: (1 if from_left else -1) * (w[0] + w[2]) / 2):
        middle = (word[0] + word[2]) / 2
        if lines and abs(lines[-1][0] - middle) <= SAME_LINE:
            lines[-1][1].append(word)
        else:
            lines.append((middle, [word]))
    found = []
    for middle, members in lines:
        members.sort(key=lambda w: w[1])
        text = " ".join(w[4] for w in members)
        found.append((middle, members[0][1], members[-1][3], text.count(IDEOGRAPH), text))
    return found


def across(words):
    """Words put into lines across the page, from the top: each (middle down, left, right, ideographs, text)"""
    lines = []
    for word in sorted(words, key=lambda w: (w[1] + w[3]) / 2):
        middle = (word[1] + word[3]) / 2
        if lines and abs(lines[-1][0] - middle) <= SAME_LINE:
            lines[-1][1].append(word)
        else:
            lines.append((middle, [word]))
    found = []
    for middle, members in lines:
        members.sort(key=lambda w: w[0])
        text = " ".join(w[4] for w in members)
        found.append((middle, members[0][0], members[-1][2], text.count(IDEOGRAPH), text))
    return found


# The probes whose text runs down the page, as word-vertical.ts writes them: all but V9 (lrTbV), V12 (lrTb) and the text
# across the page before V13b
ACROSS = {"V9", "V12", "V13a"}


def is_down(words):
    """Whether a page's text runs down it, by the probe the most of its names, such as "V1" or "V4a", are of, leaving out
    those of the header and footer of V5, which the sections after it have too"""
    names = [
        w[4]
        for i, w in enumerate(words)
        if re.fullmatch(r"V\d+[a-z]?", w[4]) and (i + 1 == len(words) or words[i + 1][4] not in ("head", "foot"))
    ]
    if not names:
        return False
    name = max(set(names), key=names.count)
    return name not in ACROSS and re.sub(r"[a-z]$", "", name) not in ACROSS


def main(path):
    for number, words in enumerate(read(path), 1):
        if not words:
            print(f"page {number}: empty")
            continue
        vertical = is_down(words)
        from_left = any(w[4] in FROM_LEFT for w in words)
        # Down the page, the header and footer are across it, above the top margin and below the text
        bottom = max((w[3] for w in words if IDEOGRAPH in w[4]), default=0) + 20
        text = [w for w in words if TOP - 20 <= w[1] and w[3] <= bottom] if vertical else words
        lines = down(text, from_left) if vertical else across(words)
        print(f"page {number}: {len(lines)} lines {'down' if vertical else 'across'} the page{' from the left' if vertical and from_left else ''}")
        previous = None
        for middle, start, end, count, text in lines:
            gap = "" if previous is None else f" gap {abs(previous - middle):5.0f}"
            print(f"  at {middle:6.0f}{gap}  {start:6.0f} to {end:6.0f}  {count:3d} ideographs  {text.replace(IDEOGRAPH, '')[:50]}")
            previous = middle


if __name__ == "__main__":
    main(sys.argv[1])
