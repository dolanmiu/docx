# Reads the probes of word-column-stops.ts from pdftotext -bbox-layout's HTML of a PDF of it, saved from Word or
# LibreOffice, and prints where each probe's lines went: on each page, the lines in each column, by their left edge, with
# how many there are, where the first and last are, in twips below the top margin, and the widest, which shows the width
# they were broken at. Lengths are in twips from the margins.
# Usage: python3 scripts/layout-probes/word-column-stops.py build/word-probes/word-column-stops.html
import html
import re
import sys
from collections import defaultdict

MARGIN = 72  # points

text = open(sys.argv[1]).read()
PAGES = []  # [(yMin, xMin, xMax, text)] for each page
for page in re.findall(r"<page.*?</page>", text, re.S):
    entries = []
    for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[3]))
        entries.append((float(line[1]), float(line[0]), float(line[2]), words))
    PAGES.append(entries)


def tw(points):
    return round((points - MARGIN) * 20)


# Each page belongs to the probe its first line names, or to the one of the page before, when a probe goes on to a page of
# its own
probe = None
for number, entries in enumerate(PAGES, 1):
    named = next((match.group(0) for _, _, _, words in entries if (match := re.match(r"CS\d", words))), None)
    if named != probe and named is not None:
        probe = named
        print(f"\n== {probe}")
    columns = defaultdict(list)
    for entry in entries:
        columns[round(entry[1] / 6)].append(entry)
    for _, column in sorted(columns.items()):
        column.sort()
        widest = max(right - left for _, left, right, _ in column)
        print(
            f"  page {number} x {tw(column[0][1]):5}: {len(column):3} lines, y {tw(column[0][0]):5} to {tw(column[-1][0]):5},"
            f" widest {round(widest * 20):4}: {column[0][3][:40]!r} .. {column[-1][3][:40]!r}"
        )
