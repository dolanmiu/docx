# Reads the probes of word-equations.ts from a PDF of word-equations.docx: each line's top and bottom, its words, and for
# a line with an equation between "before" and "after", how far apart they are, which is the equation's width and the two
# spaces around it.
#
#   pdftotext -bbox-layout word-equations.pdf word-equations.html
#   python3 word-equations.py word-equations.html
#
# Lengths are in twips: a line's top and bottom, the top of its highest word and the bottom of its lowest, from the top
# of the page, and a word's start and end from the left margin. pdftotext gives each word to a hundredth of a point, and
# Word's PDFs put text on a grid of 1/300 inch, 4.8 twips.
import html
import re
import sys

LEFT = 1440


def main(path):
    text = open(path, encoding="utf8").read()
    for number, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), start=1):
        print(f"\n== page {number}")
        for line in re.findall(r"<line.*?</line>", content, re.S):
            words = [
                (float(x0) * 20 - LEFT, float(y0) * 20, float(x1) * 20 - LEFT, float(y1) * 20, html.unescape(word))
                for x0, y0, x1, y1, word in re.findall(
                    r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', line
                )
            ]
            if not words:
                continue
            top = min(word[1] for word in words)
            bottom = max(word[3] for word in words)
            shown = " ".join(f"{word[4]}[{round(word[0], 1)}-{round(word[2], 1)}]" for word in words)
            before = next((word for word in words if word[4] == "before"), None)
            after = next((word for word in words if word[4] == "after"), None)
            gap = f"  gap {round(after[0] - before[2], 1)}" if before and after else ""
            print(f"   {round(top, 1):7} {round(bottom, 1):7}{gap}  {shown}")


main(sys.argv[1])
