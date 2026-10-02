# Reads the probes of word-continued-endnotes.ts from pdftotext -bbox-layout's HTML of a PDF of each, saved from Word or
# LibreOffice, and prints where each page's endnote lines are: how many, and the first and last, with the top of their
# text in twips below the top margin. A line exactly 288 tall starting at the margin has its text 20.7 down in Word, so
# the first line below a continuation separator 268.55 tall has its text 289.0 down, as in word-watertight-endnotes1.
# Each line's text names its probe and its line; an endnote's number, which is raised, is a line of its own to pdftotext,
# and isn't counted.
# Usage: python3 scripts/layout-probes/word-continued-endnotes.py build/word-probes/word-continued-endnotes{1,2,3,4,5}.html
import html
import re
import sys

MARGIN = 72  # points


def tw(points):
    return round((points - MARGIN) * 20, 1)


for path in sys.argv[1:]:
    text = open(path, encoding="utf8").read()
    pages = []  # [(top, bottom, text)] of the endnote lines on each page
    for page in re.findall(r"<page.*?</page>", text, re.S):
        entries = []
        for top, bottom, line in re.findall(r'<line xMin="[\d.]+" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>', page, re.S):
            words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line))
            if " note " in f" {words} ":
                entries.append((float(top), float(bottom), words))
        pages.append(entries)
    probe = next((match.group(0) for entries in pages for _, _, words in entries if (match := re.search(r"CE\d", words))), path)
    print(f"== {probe}")
    for number, entries in enumerate(pages, 1):
        if not entries:
            continue
        entries.sort()
        first, last = entries[0], entries[-1]
        print(
            f"  page {number}: {len(entries):3} lines, {first[2]!r} at {tw(first[0])}, .. {last[2]!r} at {tw(last[0])},"
            f" its text ending {tw(last[1])}"
        )
        tall = next((entry for entry in entries if "tall" in entry[2]), None)
        if tall:
            print(f"    {tall[2]!r} at {tw(tall[0])}")
    print()
