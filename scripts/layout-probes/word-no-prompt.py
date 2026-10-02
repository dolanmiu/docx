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

# The headings, in order, each of which has an entry in the table of contents
TITLES = [
    title
    for chapter in range(1, 6)
    for title in [f"NP chapter {chapter}", f"NP section {chapter}.1", f"NP section {chapter}.2"]
    + (["NP costs"] if chapter == 3 else [])
] + ["NP appendix"]

# The table of contents comes before NP2a, and the headings after it. An entry's number can be missing
TOC_END = next((index for index, (_, line) in enumerate(LINES) if line.startswith("NP2a")), len(LINES))
ENTRY = re.compile(r"^(NP (?:chapter \d+|section \d+\.\d+|costs|appendix))(?:[ .]*?\.{2,}\s*(\d\S*)|[ .]*)$")
entries = {}
for _, line in LINES[:TOC_END]:
    if m := ENTRY.match(line):
        entries.setdefault(m.group(1), m.group(2))
headings = {}
for page, line in LINES[TOC_END:]:
    if line in TITLES:
        headings.setdefault(line, page)

results = []


def check(what, written, actual):
    """Whether a number docx/layout wrote is the one the PDF has: a heading's page, or a number of pages. A number
    that is missing, or whose heading is, is wrong"""
    right = written is not None and actual is not None and written == str(actual)
    results.append(right)
    print(f"  {what}: written {written or 'nothing'}, the PDF has {actual}{'' if right else '  <-- WRONG'}")


def one_per_page(pattern):
    """The match of the pattern on each page, or None for a page without one"""
    found = {}
    for page, line in LINES:
        if m := re.match(pattern, line):
            found.setdefault(page, m)
    return [(page, found.get(page)) for page in range(1, len(PAGES) + 1)]


print("== NP1: the table of contents' entries, against the page each heading is on")
for title in TITLES:
    check(title, entries.get(title), headings.get(title))

print("== NP2: page references to 'NP costs'")
for probe in ["NP2a", "NP2b"]:
    found = next(((page, m) for page, line in LINES if (m := re.match(rf"{probe} the costs (?:are|were) on page (\S*) end", line))), None)
    check(f"{probe} (page {found[0] if found else None})", found[1].group(1) if found else None, headings.get("NP costs"))

print("== NP3: the page reference to 'NP appendix' in the header of each page")
for page, m in one_per_page(r"NP3 the appendix is on page (\S*)$"):
    check(f"page {page}", m.group(1) if m else None, headings.get("NP appendix"))

print("== NP4: the footer of each page: the page, the number of pages, and the number of pages of its section")
second = headings.get("NP chapter 4")
for page, m in one_per_page(r"NP4 page (\S*) of (\S*), section of (\S*)$"):
    section_pages = None if second is None else second - 1 if page < second else len(PAGES) - second + 1
    print(f"  page {page}: '{m.group(0) if m else 'no footer'}'")
    check("  its page", m.group(1) if m else None, page)
    check("  pages", m.group(2) if m else None, len(PAGES))
    check("  pages of its section", m.group(3) if m else None, section_pages)

print(f"\n{sum(results)} of {len(results)} numbers right, in {len(PAGES)} pages")
