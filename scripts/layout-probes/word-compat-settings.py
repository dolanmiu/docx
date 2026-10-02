# Reads the probes of word-compat-settings.ts from a PDF of each of its documents, and prints where each group's document
# lays out lines unlike the document without the settings.
#
#   for name in word-compat-settings word-compat-settings-heights word-compat-settings-pages ...; do
#       pdftotext -bbox-layout $name.pdf $name.html
#   done
#   python3 word-compat-settings.py word-compat-settings word-compat-settings-heights word-compat-settings-pages ...
#   python3 word-compat-settings.py word-compat-settings2 word-compat-settings2-suppressTopSpacing ...
#
# It takes the name of the document without the settings first, then those of the others, without their extensions, and
# reads the .html beside each. The lines of each probe are matched with those of the first in order, and each probe whose
# lines are on another page, or more than a grid step of Word's PDFs (1/300 inch, 4.8 twips) from where they are in the
# first, or break elsewhere, is printed with its first such line. Positions are in twips from the top and left of the page.
import html
import re
import sys

GRID = 4.8
PROBE = re.compile(r"^CP\d+[a-z]?$")


def read(base):
    """Each line, as (page, left, top, right, text, probe): the probe being the name the line's paragraph starts with"""
    text = open(base + ".html", encoding="utf8").read()
    lines = []
    probe = None
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for line in re.findall(r"<line .*?</line>", content, re.S):
            words = [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, html.unescape(word))
                for x0, y0, x1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', line)
            ]
            if not words:
                continue
            if PROBE.match(words[0][3]):
                probe = words[0][3]
            lines.append((page, words[0][0], words[0][1], words[-1][2], " ".join(word[3] for word in words), probe))
    return lines


def by_probe(lines):
    """Each probe's lines, in order, by its name"""
    found = {}
    for line in lines:
        found.setdefault(line[5], []).append(line)
    return found


def compare(base, other):
    """The probes whose lines differ, each with how its first line that differs does. A probe that starts on another page
    is compared from there, so a probe that moves a page doesn't make those after it differ"""
    found = {}
    others = by_probe(other)
    for probe, lines in by_probe(base).items():
        theirs = others.get(probe, [])
        shift = theirs[0][0] - lines[0][0] if theirs else 0
        moved = f"starts on page {theirs[0][0]}, not {lines[0][0]}; " if shift else ""
        for index, line in enumerate(lines):
            if index >= len(theirs):
                found[probe] = f"{moved}{len(lines) - len(theirs)} lines fewer, from {line[4][:40]!r}"
                break
            page, left, top, right, text, _ = theirs[index]
            if text != line[4]:
                found[probe] = f"{moved}line {line[4][:40]!r} is {text[:40]!r}"
            elif page - shift != line[0]:
                found[probe] = f"{moved}{text[:40]!r} on page {page}, not {line[0] + shift}"
            elif max(abs(left - line[1]), abs(top - line[2]), abs(right - line[3])) > GRID + 0.1:
                found[probe] = (
                    f"{moved}{text[:40]!r} at ({left:.0f}, {top:.0f}) to {right:.0f}, not ({line[1]:.0f}, {line[2]:.0f}) to {line[3]:.0f}"
                )
            else:
                continue
            break
        else:
            if len(theirs) > len(lines):
                found[probe] = f"{moved}{len(theirs) - len(lines)} lines more"
            elif moved:
                found[probe] = moved.rstrip("; ")
    return found


def report(names):
    base = read(names[0])
    print(f"{names[0]}: {len(base)} lines, on {base[-1][0]} pages")
    for name in names[1:]:
        found = compare(base, read(name))
        print(f"\n== {name}: {'as without the settings' if not found else f'{len(found)} probes differ'}")
        for probe, how in found.items():
            print(f"  {probe}: {how}")


if __name__ == "__main__":
    report(sys.argv[1:])
