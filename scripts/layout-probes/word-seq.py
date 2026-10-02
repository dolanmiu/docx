# Checks the numbers docx writes into word-seq-clean.docx against the ones Word worked out in its PDF of word-seq.docx,
# the same probes written dirty with updateFields on: each SEQ field's number (right, blank where Word has a number, or
# wrong), and the titles and page numbers of the table of contents and the page reference, against Word's table of
# contents and the pages of Word's headings.
#
# Word's PDF of word-seq-clean.docx can't be used for this: Word updates the SEQ fields and page references when it
# saves a PDF, though not the table of contents' titles, so the PDF has Word's numbers rather than the ones written.
#
# Usage: python3 scripts/layout-probes/word-seq.py build/word-probes/word-seq.txt build/word-probes/word-seq-clean.docx
# where word-seq.txt is pdftotext -layout's text of Word's PDF of word-seq.docx.
import html
import re
import sys
import zipfile
from collections import defaultdict

# A probe line: its name, the identifier, its number, which can be blank or several words, and "end", which a footnote's
# number can follow
PROBE = re.compile(r"^(Q\w+(?: note| header| footer)?) (\S+) (?:(.*?) )?end\d*$")
# A heading of the table of contents: its title, and its page number after a tab or a run of dots
HEADING = re.compile(r"^(Q\d+ (?:to Q\d+|and Q\d+|chapter|section|text boxes).*?)(?:\t| ?\.{3,} ?)(\S*)$")


def collapse(line):
    return re.sub(r"[ \t]+", " ", line).strip()


def pdf_pages(path):
    """The lines of each page of a PDF's text"""
    return [[collapse(line) for line in page.split("\n")] for page in open(path).read().split("\f")]


def docx_lines(path):
    """The text of each paragraph of the body, headers, footers and footnotes of a .docx, with tabs as tabs"""
    with zipfile.ZipFile(path) as package:
        parts = [name for name in package.namelist() if re.match(r"word/(document|header\d*|footer\d*|footnotes)\.xml$", name)]
        for part in sorted(parts, key=lambda name: name != "word/document.xml"):
            xml = package.read(part).decode()
            for paragraph in re.findall(r"<w:p[ >].*?</w:p>", xml, re.S):
                text = "".join(
                    "\t" if piece.startswith("<w:tab") else html.unescape(re.sub(r"<[^>]+>", "", piece))
                    for piece in re.findall(r"<w:t(?:\s[^>]*)?>[^<]*</w:t>|<w:tab/>", paragraph)
                )
                yield text.strip()


def probe_numbers(lines):
    """The number of each probe line, by its name: a list, as Word's PDF has the header and footer on every page"""
    found = defaultdict(list)
    for line in lines:
        if m := PROBE.match(collapse(line)):
            found[m.group(1)].append(m.group(3) or "")
    return found


pages = pdf_pages(sys.argv[1])
written = list(docx_lines(sys.argv[2]))
words, docx = probe_numbers(line for page in pages for line in page), probe_numbers(written)

counts = defaultdict(int)
print("== Each SEQ field: the number Word worked out, and the one docx wrote")
for probe, values in words.items():
    for index, value in enumerate(values):
        # The header, footer and footnote are written once, and Word's PDF has them on every page
        ours = docx.get(probe, [])
        mine = ours[min(index, len(ours) - 1)] if ours else None
        error = value.startswith("Error!")
        verdict = "right" if mine == value else "missing" if mine is None else "blank" if mine == "" else "WRONG"
        counts["error" if error and mine == "" else verdict] += 1
        where = f" (page {index + 1})" if len(values) > 1 else ""
        note = "" if verdict == "right" else "  (Word writes an error)" if error and mine == "" else f"  <-- {verdict}"
        print(f"  {probe}{where}: Word '{value}', docx '{mine}'{note}")
print(
    f"\n{counts['right']} right, {counts['error']} blank where Word writes an error, {counts['blank']} blank, "
    f"{counts['WRONG']} wrong, {counts['missing']} missing"
)

print("\n== The table of contents docx wrote, against Word's table of contents and the pages of Word's headings")
lines = [(number, line) for number, page in enumerate(pages, 1) for line in page]
word_entries = [(title.strip(), page) for _, line in lines if (m := HEADING.match(line)) for title, page in [m.groups()]]
docx_entries = [(title.strip(), page) for line in written if (m := HEADING.match(line)) for title, page in [m.groups()]]
# The page each heading is on in Word's PDF, by its title. A heading's SEQ number, such as the 1 of "Q11 chapter 1", is
# in the heading but not in Word's entry
headings = defaultdict(list)
titles = {title for title, _ in word_entries}
for number, line in lines:
    title = re.sub(r" \d+$", "", line) if line.startswith("Q11 chapter") else line
    if title in titles and not HEADING.match(line):
        headings[title].append(number)
wrong = 0
for index, (title, page) in enumerate(docx_entries):
    word_title, word_page = word_entries[index] if index < len(word_entries) else (None, None)
    # Two headings can have the same title, such as the two of Q11
    occurrence = sum(1 for earlier, _ in docx_entries[:index] if earlier == title)
    pages_of = headings.get(word_title or title, [])
    on = pages_of[occurrence] if occurrence < len(pages_of) else None
    right = title == word_title and page == str(on) and page == word_page
    wrong += not right
    print(f"  '{title}' page {page or 'nothing'}: Word's entry '{word_title}' page {word_page}, heading on page {on}{'' if right else '  <-- WRONG'}")

reference = next((m.group(1) for line in written if (m := re.match(r"QP the probes of text boxes are on page (\S*) end", collapse(line)))), None)
target = (headings.get("Q14 text boxes") or [None])[0]
right = reference is not None and reference == str(target)
wrong += not right
print(f"  QP: written {reference or 'nothing'}, on page {target}{'' if right else '  <-- WRONG'}")
print(f"\n{len(docx_entries) + 1 - wrong} of {len(docx_entries) + 1} right")
