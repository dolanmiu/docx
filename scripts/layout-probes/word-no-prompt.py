# Reads a PDF of word-no-prompt.ts from pdftotext -bbox-layout's HTML of it, and checks each number docx/layout wrote
# against the page the PDF has: each entry of the table of contents and each page reference against the page its
# heading is on, and each footer's numbers of pages against the pages of the document and of its section.
# Usage: python3 scripts/layout-probes/word-no-prompt.py build/word-probes/word-no-prompt.html
import html
import re
import sys

text = open(sys.argv[1]).read()
LINES = []  # (page, text)
PAGES = re.findall(r"<page.*?</page>", text, re.S)
for p, page in enumerate(PAGES, 1):
    for line in re.findall(r"<line [^>]*>(.*?)</line>", page, re.S):
        LINES.append((p, " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line))))

ENTRY = re.compile(r"^(NP (?:chapter \d+|section \d+\.\d+|costs|appendix))[ .]*?\.{2,}\s*(\S+)$")
entries = [(page, m.group(1), m.group(2)) for page, line in LINES if (m := ENTRY.match(line))]
headings = {}
for page, line in LINES:
    if ENTRY.match(line) is None and re.fullmatch(r"NP (?:chapter \d+|section \d+\.\d+|costs|appendix)", line):
        headings.setdefault(line, page)

results = []


def check(what, written, actual):
    """Whether a number docx/layout wrote is the one the PDF has: a heading's page, or a number of pages"""
    right = actual is not None and written == str(actual)
    results.append(right)
    print(f"  {what}: written {written}, the PDF has {actual}{'' if right else '  <-- WRONG'}")


print("== NP1: the table of contents' entries, against the page each heading is on")
for _, title, number in entries:
    check(title, number, headings.get(title))

print("== NP2: page references to 'NP costs'")
for page, line in LINES:
    if m := re.match(r"(NP2\w) the costs (?:are|were) on page (\S*) end", line):
        check(f"{m.group(1)} (page {page})", m.group(2), headings.get("NP costs"))

print("== NP3: the page reference to 'NP appendix' in the header of each page")
for page, line in LINES:
    if m := re.match(r"NP3 the appendix is on page (\S*)$", line):
        check(f"page {page}", m.group(1), headings.get("NP appendix"))

print("== NP4: the footer of each page: the page, the number of pages, and the number of pages of its section")
second = headings.get("NP chapter 4")
for page, line in LINES:
    if m := re.match(r"NP4 page (\S*) of (\S*), section of (\S*)$", line):
        section_pages = second - 1 if page < second else len(PAGES) - second + 1
        print(f"  page {page}: '{line}'")
        check("  its page", m.group(1), page)
        check("  pages", m.group(2), len(PAGES))
        check("  pages of its section", m.group(3), section_pages)

print(f"\n{sum(results)} of {len(results)} numbers right, in {len(PAGES)} pages")
