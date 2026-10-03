# Reads the probes of word-frames.ts and word-vml.ts from a PDF of word-frames.docx or word-vml.docx: for each probe, where
# each grey shape, picture and outline is, and where each line is, with the parts of a line either side of a shape apart.
#
#   pdftotext -bbox-layout word-frames.pdf word-frames.html
#   pdftocairo -svg word-frames.pdf word-frames.svg
#   python3 word-frames.py word-frames
#
# It takes the name of the PDF without its extension and reads the two files beside it, as word-floats.py does, and reads
# words, lines and grey shapes as it does. Lengths are in twips: a line's top, and where its text starts and ends, from the top
# of the page and the left margin, and a shape's left, right, top and bottom the same. A frame's paragraph is shaded grey,
# so its shading is a grey shape; docx's text boxes have Word's default black outline, which is read as an outline.
import html
import re
import sys

LEFT = 1440
# The gap between two words, in twips, past which they are in parts of a line either side of a shape
GAP = 600


def words_by_page(base):
    """Each page's words, from pdftotext's HTML: (left, top, right, bottom, text), in twips from the page's top left"""
    text = open(base + ".html", encoding="utf8").read()
    pages = []
    for content in re.findall(r"<page.*?</page>", text, re.S):
        pages.append(
            [
                (float(x0) * 20, float(y0) * 20, float(x1) * 20, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content)
            ]
        )
    return pages


def pictures_by_page(base):
    """Each page's pictures and grey shapes, (left, right, top, bottom). A picture is of one pixel, drawn at its size,
    turned when the picture is, by the matrix it is drawn with. A shape is a path filled in grey, A0A0A0"""
    text = open(base + ".svg", encoding="utf8").read()
    pages = []
    for content in re.findall(r"<page>.*?</page>", text, re.S):
        found = []
        for matrix in re.findall(r'<use xlink:href="#source-\d+" transform="matrix\(([^)]*)\)"', content):
            a, b, c, d, e, f = (float(value) * 20 for value in matrix.split(","))
            # The corners of the pixel, a square of 1, where the matrix puts them
            corners = [(e + a * u / 20 + c * v / 20, f + b * u / 20 + d * v / 20) for u in (0, 20) for v in (0, 20)]
            found.append(corners)
        for path in re.findall(r'<path[^>]*fill="rgb\(62\.7\d*%, 62\.7\d*%, 62\.7\d*%\)"[^>]*d="([^"]*)"', content):
            numbers = [float(value) * 20 for value in re.findall(r"-?[\d.]+", path)]
            found.append(list(zip(numbers[0::2], numbers[1::2])))
        pages.append(
            [
                (
                    round(min(x for x, _ in corners) - LEFT, 1),
                    round(max(x for x, _ in corners) - LEFT, 1),
                    round(min(y for _, y in corners), 1),
                    round(max(y for _, y in corners), 1),
                )
                for corners in found
            ]
        )
    return pages


def lines_of(words):
    """The page's lines, from the top: each its top and its parts, each part (start, end, text)"""
    lines = []
    for word in sorted(words, key=lambda word: (word[1], word[0])):
        if lines and abs(lines[-1][0] - word[1]) < 3:
            lines[-1][1].append(word)
        else:
            lines.append((word[1], [word]))
    found = []
    for top, line in lines:
        line.sort(key=lambda word: word[0])
        parts = [[line[0]]]
        for word in line[1:]:
            if word[0] - parts[-1][-1][2] > GAP:
                parts.append([word])
            else:
                parts[-1].append(word)
        found.append((top, [(part[0][0] - LEFT, part[-1][2] - LEFT, " ".join(word[4] for word in part)) for part in parts]))
    return found


def outlines_by_page(base):
    """Each page's black outlines, (left, right, top, bottom): the paths stroked in black, such as a text box's outline or
    a paragraph's border, each its points' extent, through the matrix it is drawn with. Word draws a text box's outline
    in EMUs, scaled to the page by its matrix"""
    text = open(base + ".svg", encoding="utf8").read()
    pages = []
    for content in re.findall(r"<page>.*?</page>", text, re.S):
        found = []
        for path in re.findall(r"<path[^>]*stroke=\"rgb\(0%, 0%, 0%\)\"[^>]*>", content):
            match = re.search(r' d="([^"]*)"', path)
            matrix = re.search(r'transform="matrix\(([^)]*)\)"', path)
            a, b, c, d, e, f = (float(value) for value in matrix.group(1).split(",")) if matrix else (1, 0, 0, 1, 0, 0)
            numbers = [float(value) for value in re.findall(r"-?[\d.]+", match.group(1))] if match else []
            points = [((a * x + c * y + e) * 20, (b * x + d * y + f) * 20) for x, y in zip(numbers[0::2], numbers[1::2])]
            if points:
                found.append(
                    (
                        round(min(x for x, _ in points) - LEFT, 1),
                        round(max(x for x, _ in points) - LEFT, 1),
                        round(min(y for _, y in points), 1),
                        round(max(y for _, y in points), 1),
                    )
                )
        pages.append(found)
    return pages


def main(base):
    """Prints each probe's pages: where each grey shape, picture and outline is, and each line, with its parts either
    side of a shape"""
    pages = words_by_page(base)
    shapes = pictures_by_page(base)
    outlines = outlines_by_page(base)
    probe = None
    for index, words in enumerate(pages):
        lines = lines_of(words)
        found = [text for _, parts in lines for _, _, text in parts]
        match = next((re.match(r"((?:FM|VM)\d+[a-z]?) above", text) for text in found if re.match(r"(?:FM|VM)\d+[a-z]? above", text)), None)
        if match:
            probe = match.group(1)
            print(f"\n== {probe}, page {index + 1}")
        else:
            print(f"   {probe} goes on, page {index + 1}")
        for left, right, top, bottom in shapes[index] if index < len(shapes) else []:
            print(f"   grey: {left} to {right} across, {top} to {bottom} down ({round(right - left, 1)} by {round(bottom - top, 1)})")
        for left, right, top, bottom in outlines[index] if index < len(outlines) else []:
            print(f"   outline: {left} to {right} across, {top} to {bottom} down ({round(right - left, 1)} by {round(bottom - top, 1)})")
        for top, parts in lines:
            shown = "  |  ".join(f"{round(start, 1)} to {round(end, 1)}: {text[:28]}" for start, end, text in parts)
            print(f"   {round(top, 1):7}  {shown}")


main(sys.argv[1])
