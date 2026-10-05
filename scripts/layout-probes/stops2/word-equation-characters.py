# Reads EQ27 of word-stops-equations.ts from a PDF of it saved from Word: for each character, an equation of ten of it in
# a line of Calibri 11, how wide Word made one, in thousandths of an em, and the character it drew for it, such as the
# italic letter it draws for a Greek variant. A character's width is how far the text after the equation is from its
# first character, less the space before that text, over ten: so it has in it a tenth of anything Word puts after the
# last, such as an italic letter's italic correction, or between them.
#
#   pdftotext -bbox-layout word-stops-equations.pdf word-stops-equations.html
#   python3 word-equation-characters.py word-stops-equations.html > word-equation-characters.json
import html
import json
import re
import sys

# The size of the text, and the width of Calibri's space at it, in points
SIZE = 11
SPACE = 0.226 * SIZE
COUNT = 10

found = {}
for content in re.findall(r"<line [^>]*>(.*?)</line>", open(sys.argv[1], encoding="utf8").read(), re.S):
    words = [
        (float(x0), float(x1), html.unescape(text))
        for x0, _y0, x1, _y1, text in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', content)
    ]
    # "EQ27a u2190", the equation, and "after"
    if len(words) < 4 or not words[0][2].startswith("EQ27") or not re.fullmatch(r"u[0-9a-f]+", words[1][2]) or words[-1][2] != "after":
        continue
    character = chr(int(words[1][2][1:], 16))
    width = (words[-1][0] - SPACE - words[2][0]) / COUNT / SIZE * 1000
    found[character] = {"width": round(width, 2), "drawn": words[2][2][0]}

print(json.dumps(found, ensure_ascii=False, indent=1, sort_keys=True))
