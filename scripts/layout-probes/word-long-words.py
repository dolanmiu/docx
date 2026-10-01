# Reads where each column of the probe tables of word-long-words.ts starts and ends, from a PDF's pages as SVG
# (pdftocairo -svg, one file a page) and its text (pdftotext -bbox-layout), and prints each column's width in twips, from
# the middle of one border to the middle of the next.
#
# Usage: python3 word-long-words.py <name>   (reads <name>.html and <name>-1.svg, <name>-2.svg, ...)
#
#     pdftotext -bbox-layout word-long-words.pdf word-long-words.html
#     pdftocairo -svg -f 1 -l 1 word-long-words.pdf word-long-words-1.svg
import glob
import html
import re
import sys
from collections import defaultdict

name = sys.argv[1]
pages = re.findall(r"<page.*?</page>", open(f"{name}.html").read(), re.S)
for number, page in enumerate(pages, 1):
    svg = f"{name}-{number}.svg"
    if not glob.glob(svg):
        continue
    body = open(svg).read().split("</defs>", 1)[-1]
    # Vertical borders: thin, tall paths, by the top of the row they are in
    rows = defaultdict(set)
    for d in re.findall(r'<path[^>]*d="([^"]*)"', body):
        nums = [float(x) for x in re.findall(r"-?[\d.]+", d)]
        xs, ys = nums[0::2], nums[1::2]
        if xs and max(xs) - min(xs) < 1.5 and max(ys) - min(ys) > 5:
            rows[round(min(ys), 1)].add(round((min(xs) + max(xs)) / 2 * 20))
    labels = []
    for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[3]))
        match = re.match(r"(L\d+): (.*)", words)
        if match:
            labels.append((float(line[1]), match.group(1), match.group(2)))
    for index, (top, label, note) in enumerate(labels):
        bottom = labels[index + 1][0] if index + 1 < len(labels) else 10_000
        found = [sorted(edges) for y, edges in sorted(rows.items()) if top < y < bottom]
        # Each distinct set of edges, in the order the rows have them
        distinct = []
        for edges in found:
            if edges not in distinct:
                distinct.append(edges)
        print(f"{label:3} {note}")
        for edges in distinct:
            print(f"    edges {edges}  widths {[b - a for a, b in zip(edges, edges[1:])]}  total {edges[-1] - edges[0]}")
