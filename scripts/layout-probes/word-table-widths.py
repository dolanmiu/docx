# Reads the column widths of each probe table of word-table-widths.ts from a PDF's pages as SVG and its text, and prints
# each row's edges, and the lines of text in the table with where each starts and ends.
#
#   pdftotext -bbox-layout word-table-widths.pdf word-table-widths.html
#   for page in 1 2 3 4 5 6; do pdftocairo -svg -f $page -l $page word-table-widths.pdf word-table-widths-$page.svg; done
#   python3 word-table-widths.py word-table-widths
#
# Lengths are in twips from the left margin (1440). Edges are the middles of the vertical borders, which Word draws a
# little in from where its columns are: across `word-watertight-stops.pdf`'s tables, a border is 2.9 + 0.99877 times the
# column's edge, as its SP15b and SP15c show, whose edges are known.
# cspell:ignore pdftocairo
import glob
import html
import re
import sys

LEFT = 1440
name = sys.argv[1]
pages = re.findall(r"<page.*?</page>", open(f"{name}.html", encoding="utf8").read(), re.S)


def edge(x):
    """Where a column's edge is, from the middle of its border"""
    return round((x - 2.9) / 0.99877)


for number, page in enumerate(pages, 1):
    svg = f"{name}-{number}.svg"
    if not glob.glob(svg):
        continue
    body = open(svg).read().split("</defs>", 1)[1]
    # Vertical borders: thin, tall paths, from their top to their bottom
    borders = []
    for d in re.findall(r'<path[^>]*d="([^"]*)"', body):
        nums = [float(x) for x in re.findall(r"-?[\d.]+", d)]
        xs, ys = nums[0::2], nums[1::2]
        if xs and max(xs) - min(xs) < 1.5 and max(ys) - min(ys) > 5:
            borders.append(((min(xs) + max(xs)) / 2 * 20 - LEFT, min(ys), max(ys)))
    lines = []
    for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[3]))
        lines.append((float(line[1]), float(line[0]) * 20 - LEFT, float(line[2]) * 20 - LEFT, words))
    labels = [(top, match.group(1), match.group(2)) for top, _, _, words in lines if (match := re.match(r"(TW\d+): (.*)", words))]
    ends = [top for top, _, _, words in lines if words == "TW end"]
    for index, (top, label, note) in enumerate(labels):
        bottom = labels[index + 1][0] if index + 1 < len(labels) else (ends[0] if ends else 10_000)
        print(f"{label:4} {note}")
        # Each row's edges: the borders across the band just below where one starts, as a border can be drawn down
        # several rows. Borders drawn in pieces put an edge a twip or two apart
        shown = []
        for y in sorted({round(y0, 1) for _, y0, _ in borders if top < y0 < bottom}):
            found = sorted({round(x, 1) for x, y0, y1 in borders if y0 <= y + 0.5 and y1 >= y + 2})
            edges = [edge(x) for i, x in enumerate(found) if i == 0 or x - found[i - 1] > 4]
            if len(edges) > 1 and edges not in shown:
                shown.append(edges)
                print(f"    row at {round(y * 20)}: edges {edges}  widths {[b - a for a, b in zip(edges, edges[1:])]}  total {edges[-1] - edges[0]}")
        for line_top, start, end, words in sorted(lines):
            if top < line_top < bottom:
                print(f"    text from {round(start)} to {round(end)}: {words[:60]}")
