# Reads the probes of word-nested-tables.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows:
# the lines of each probe after its fill lines, by page, with how far each one's top is below the top margin, in twips,
# and then which lines of the table in the cell are on the probe's first page.
#
#   python3 word-nested-tables.py word-nested-tables.html
#
# Word's PDFs put text on a grid of 1/300 inch, 4.8 twips, so a line's place is only good to about 5 twips. A line's top
# here is the top of its text, a little below the top of the line, the same for each line of Calibri 11.
import html
import re
import sys

TOP = 1440


def read(path):
    """Each line of each page, as (page, top in twips, text)"""
    text = open(path).read()
    found = []
    for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
        for y, words in re.findall(r'<line xMin="[\d.]+" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">(.*?)</line>', content, re.S):
            words = " ".join(html.unescape(word) for word in re.findall(r">([^<]*)</word>", words))
            found.append((page, float(y) * 20, words))
    return found


lines = read(sys.argv[1])
# The top of a line of text at the top of the body, from the first line of the first probe
first = next(top for page, top, text in lines if text == "N1a top")

PROBES = ["N1a", "N1b", "N1c", "N2", "N3", "N4a", "N4b", "N5a", "N5b", "N6", "N7", "N8"]
for probe in PROBES:
    own = [line for line in lines if line[2].startswith(probe + " ")]
    start = own[0][0]
    print(f"== {probe}")
    for page, top, text in own:
        if " fill " in text or text.endswith(" top"):
            continue
        print(f"  page {page - start + 1}  {top - first:8.1f}  {text}")
    on_first = [text for page, top, text in own if page == start and re.search(r" (row|line) \d+$", text) and " fill " not in text]
    print(f"  on the first page: {', '.join(text[len(probe) + 1:] for text in on_first) or 'none of it'}")
