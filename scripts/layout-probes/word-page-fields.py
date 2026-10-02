# Reads the probes of word-page-fields.ts from a PDF of it, and prints what each field shows and the page of the PDF it
# is on, and the page of each bookmark's text.
#
#   pdftotext -bbox-layout word-page-fields.pdf word-page-fields.html
#   python3 word-page-fields.py word-page-fields.html
#
# Each line is read as pdftotext finds it, which keeps the columns of a page apart.
import html
import re
import sys

text = open(sys.argv[1], encoding="utf8").read()
lines = []
for page, content in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for line in re.findall(r"<line .*?</line>", content, re.S):
        words = [html.unescape(word) for word in re.findall(r"<word [^>]*>([^<]*)</word>", line)]
        lines.append((page, " ".join(words)))

PROBES = {
    "PF1": "\\p in two columns: a in the second column to a bookmark lower down the first, b in the first to one higher up the second",
    "PF2": "\\p in a table: a to the cell before it in its row, b to the row above, in the cell to the right",
    "PF3": "\\p to a bookmark on another page: page iv (a), \\* Upper (b), \\* Arabic (c), \\* Upper on the same page (d), page 1-2 (e)",
    "PF4": "formats of their own: to page iv, Arabic (a), ALPHABETIC (b), roman (c); to page 1-2, roman (d), Arabic (e)",
    "PF5": 'to page 5: roman Upper (a), ALPHABETIC Lower (b), Ordinal Upper (c), Ordinal FirstCap (d), "00" (e), "000" (f), '
    '"0" (g), "#" (h); to page 1234, "#,##0" (i), "00" (j); to page 5, Arabic MERGEFORMAT (k)',
    "PF6": 'NUMPAGES Arabic MERGEFORMAT (a), ALPHABETIC (b), "000" (c); SECTIONPAGES Ordinal (d)',
    "PF7": 'PAGE roman (a), "00" (b) on page 1; PAGE Arabic (c), w:pgNum (d) on page iv; w:pgNum on page 1-2 (e); SECTION roman in '
    "section 4 (f); PAGE and SECTION in a footnote (g), in the two parts of a continued footnote (h), in an endnote referred to "
    "from section 6 (i)",
    "PF8": "page references to a bookmark in a continued footnote's rest (a), in an endnote (b), in a footnote on page 1-2 (c); \\p to a "
    "bookmark in a footnote on the same page, above its reference (d), below it (e); \\p in a footnote to the body on the same "
    "page (f), on another (g)",
}

for probe, what in PROBES.items():
    print(f"== {probe}: {what}")
    for page, line in lines:
        if re.match(rf"^{probe}[a-k] ", line):
            print(f"  page {page:2}: {line}")
print("== Where the bookmarks are")
for page, line in lines:
    if re.match(r"^PF\d (target|chapter target|bookmark)|^PF8 bookmark", line):
        print(f"  page {page:2}: {line}")
for page, line in lines:
    if line.startswith("PF chapter heading") or line.startswith("Chapter 1"):
        print(f"  page {page:2}: {line}")
