# Reads a PDF of a lay-stops2 probe document, saved from Word (or LibreOffice, to test it), and prints what each probe
# shows: its lines of text, with where each is, and the borders and other rules drawn beside them. With docx/layout's
# layout of the same document (layout-stops.ts), it says for each probe where docx/layout's lines are not where Word's
# are, which is the answer to whether docx/layout's guess at that stop is Word's.
#
#   pdftotext -bbox-layout <name>.pdf <name>.html
#   pdftocairo -svg <name>.pdf <name>.svg
#   npm run run-ts -- scripts/layout-probes/stops2/layout-stops.ts <name>.docx > <name>.layout.json
#   python3 word-stops.py <name> [--probe TV1] [--no-rules]
#
# It takes the PDF's name without its extension and reads the files above beside it (the SVG and the layout are optional).
# Lengths are in twips, from the top and left margins (1440). A line is a row of words pdftotext puts at the same height
# on a page; its top is the top of its tallest word's box, which Word puts on a grid of 1/300 inch (4.8 twips). Each line
# belongs to the probe its text names, such as "TV3a", or to the probe named last above it on its page, as a table's
# cells and a footnote's lines do. Rules are the straight lines the PDF draws, borders and outlines: horizontal ones with
# where they run across and how thick they are, and vertical ones with where they run down.
import html
import json
import os
import re
import sys
from collections import defaultdict

MARGIN = 1440
LABEL = re.compile(r"^([A-Z]{2,3}\d+[a-z]?\d*)\b")
# How far apart two lines' tops may be and still be the same line, in points
SAME = 1.0


def read_lines(base):
    """Each line: page, top, left, right (twips), and its text, with the words pdftotext puts level with each other joined"""
    pages = re.findall(r"<page.*?</page>", open(base + ".html", encoding="utf8").read(), re.S)
    found = []
    for number, page in enumerate(pages, 1):
        words = [
            (float(y0), float(x0), float(x1), html.unescape(text))
            for x0, y0, x1, y1, text in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', page)
        ]
        words.sort()
        rows = []
        for word in words:
            for row in rows:
                if abs(row[0][0] - word[0]) <= SAME:
                    row.append(word)
                    break
            else:
                rows.append([word])
        for row in rows:
            row.sort(key=lambda word: word[1])
            # Words far apart across the page are kept apart: the columns of a page, or the cells of a row
            groups = [[row[0]]]
            for word in row[1:]:
                if word[1] - groups[-1][-1][2] > 18:
                    groups.append([word])
                else:
                    groups[-1].append(word)
            for group in groups:
                found.append(
                    {
                        "page": number,
                        "top": round(min(w[0] for w in group) * 20 - MARGIN),
                        "left": round(group[0][1] * 20 - MARGIN),
                        "right": round(group[-1][2] * 20 - MARGIN),
                        "text": " ".join(w[3] for w in group),
                    }
                )
    found.sort(key=lambda line: (line["page"], line["top"], line["left"]))
    return found


def read_rules(base):
    """Each page's straight lines: (page, 'h' or 'v', position, start, end, thickness), in twips from the margins"""
    path = base + ".svg"
    if not os.path.exists(path):
        return []
    text = open(path, encoding="utf8").read()
    pages = re.findall(r"<page>(.*?)</page>", text, re.S) or [text]
    rules = []
    for number, page in enumerate(pages, 1):
        for attributes in re.findall(r"<path ([^>]*)/?>", page):
            d = re.search(r'\bd="([^"]*)"', attributes)
            if not d:
                continue
            numbers = [float(n) for n in re.findall(r"-?[\d.]+(?:e-?\d+)?", d.group(1))]
            if len(numbers) < 4 or len(numbers) % 2:
                continue
            transform = re.search(r'transform="matrix\(([^)]*)\)"', attributes)
            a, b, c, dd, e, f = [float(n) for n in re.split(r"[ ,]+", transform.group(1).strip())] if transform else (1, 0, 0, 1, 0, 0)
            points = [(a * x + c * y + e, b * x + dd * y + f) for x, y in zip(numbers[0::2], numbers[1::2])]
            xs = [p[0] for p in points]
            ys = [p[1] for p in points]
            width = max(xs) - min(xs)
            height = max(ys) - min(ys)
            stroke = re.search(r'stroke-width="([\d.]+)"', attributes)
            stroked = 'stroke="' in attributes and 'stroke="none"' not in attributes
            thickness = float(stroke.group(1)) * (abs(a) or 1) if stroke and stroked else None
            if height < 1.5 and width > 3:
                rules.append((number, "h", round((min(ys) + max(ys)) / 2 * 20 - MARGIN), round(min(xs) * 20 - MARGIN), round(max(xs) * 20 - MARGIN), round((thickness or height) * 20, 1)))
            elif width < 1.5 and height > 3:
                rules.append((number, "v", round((min(xs) + max(xs)) / 2 * 20 - MARGIN), round(min(ys) * 20 - MARGIN), round(max(ys) * 20 - MARGIN), round((thickness or width) * 20, 1)))
    return rules


def bare(text):
    return re.sub(r"\s+", "", text)


def probes_of(lines):
    """The lines of each probe, in order. A probe starts at its line "<name> above"; each line goes to the probe whose name
    its text starts with, or to the probe that started last above it"""
    names = {match.group(1) for line in lines if (match := re.match(r"^(\S+) above$", line["text"]))}
    probes = defaultdict(list)
    order = []
    current = None
    for line in lines:
        first = line["text"].split(" ")[0]
        name = first if first in names else None
        if line["text"].endswith(" above") and name:
            current = name
        target = name or current
        if target is None:
            continue
        if target not in probes:
            order.append(target)
        probes[target].append(line)
    return order, probes


def main():
    base = sys.argv[1]
    only = sys.argv[sys.argv.index("--probe") + 1] if "--probe" in sys.argv else None
    lines = read_lines(base)
    rules = [] if "--no-rules" in sys.argv else read_rules(base)
    layout = json.load(open(base + ".layout.json")) if os.path.exists(base + ".layout.json") else None
    order, probes = probes_of(lines)
    if layout:
        print(f"docx/layout, the whole document: stops at {layout['stoppedAt']!r}")
        about = {probe["name"]: probe for probe in layout["probes"]}
    for name in order:
        if only and not name.startswith(only):
            continue
        rows = probes[name]
        pages = sorted({row["page"] for row in rows})
        print(f"\n{name}  (page{'s' if len(pages) > 1 else ''} {', '.join(map(str, pages))})")
        previous = None
        for row in rows:
            pitch = "" if previous is None or previous["page"] != row["page"] else f"  +{row['top'] - previous['top']}"
            print(f"    p{row['page']:<3} top {row['top']:>6} left {row['left']:>6} right {row['right']:>6}{pitch:>8}  {row['text'][:90]}")
            previous = row
        if rules:
            for page in pages:
                tops = [row["top"] for row in rows if row["page"] == page]
                low, high = min(tops) - 300, max(tops) + 600
                near = [r for r in rules if r[0] == page and ((r[1] == "h" and low <= r[2] <= high) or (r[1] == "v" and r[4] >= low and r[3] <= high))]
                horizontal = sorted({(r[2], r[3], r[4], r[5]) for r in near if r[1] == "h"})
                vertical = sorted({(r[2], r[3], r[4], r[5]) for r in near if r[1] == "v"})
                if horizontal:
                    print(f"    p{page} across: " + "; ".join(f"{y} ({x0} to {x1}, {t})" for y, x0, x1, t in horizontal[:24]))
                if vertical:
                    print(f"    p{page} down:   " + "; ".join(f"{x} ({y0} to {y1}, {t})" for x, y0, y1, t in vertical[:24]))
        if layout:
            compare(about.get(name, {}), rows, [line for line in layout["lines"] if line.get("probe") == name and "text" in line and bare(line["text"])])


def compare(about, word, ours):
    """Where docx/layout's lines of a probe, laid out alone with a guess, aren't Word's: on another of the probe's pages,
    or more than 40 twips (2 points) down from Word's, past the first line's own offset, or with other text"""
    stop = about.get("stoppedAt")
    guesses = about.get("guesses") or []
    print(f"    docx/layout alone: {'stops at ' + repr(stop) if stop else 'lays it out'}" + (f"; guessing at {', '.join(guesses)}" if guesses else "") + (f"; guessing throws {about['guessError']}" if about.get("guessError") else ""))
    if not ours or not word:
        return
    first_page = word[0]["page"]
    offset = ours[0]["top"] - word[0]["top"]
    differences = []
    used = set()
    for one in ours:
        match = next((i for i, w in enumerate(word) if i not in used and bare(w["text"]) == bare(one["text"])), None)
        if match is None:
            differences.append(f"{one['text'][:50]!r}: not a line of Word's")
            continue
        used.add(match)
        w = word[match]
        if w["page"] - first_page + 1 != one["page"]:
            differences.append(f"{one['text'][:50]!r}: its page {one['page']}, Word's {w['page'] - first_page + 1}")
        elif abs((one["top"] - offset) - w["top"]) > 40:
            differences.append(f"{one['text'][:50]!r}: {one['top'] - offset - w['top']:+} twips down from Word's")
    if differences:
        print(f"    its guess differs from Word's in {len(differences)} of {len(ours)} lines:")
        for difference in differences[:8]:
            print(f"        {difference}")
    else:
        print(f"    its guess puts all {len(ours)} lines where Word does")


main()
