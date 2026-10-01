# Reads the probes of word-page-number-formats.ts from a PDF of it, and prints what each shows: each format's page
# numbers, page references and list numbers, and the chapter numbers, from the PDF's text as pdftotext writes it.
# Usage: pdftotext -layout -enc UTF-8 word-page-number-formats.pdf word-page-number-formats.txt
#        python3 word-page-number-formats.py word-page-number-formats.txt [--json]
import json
import re
import sys

text = open(sys.argv[1], encoding="utf-8").read()
# The text of a line that wraps goes on after a line break, and pdftotext marks each new page with a form feed
# Right-to-left text comes wrapped in Unicode's embedding marks, which are taken out
flat = re.sub(r"\s+", " ", re.sub("[\u200e\u200f\u202a-\u202e]", "", text))


def clean(found):
    return re.sub(r"\s+", " ", found).strip()


pages = {(f, int(s)): clean(v) for f, s, v in re.findall(r"\bP (\w+) (\d+): ?(.*?) ?end\b", flat)}
references = {name: clean(v) for name, v in re.findall(r"\bR (\w+): ?(.*?) ?end\b", flat)}
chapters = {name: clean(v) for name, v in re.findall(r"\b(C\d+[a-e]? (?:body|before|after|no heading|next page|page 2)) ?(.*?) ?end\b", flat)}
# A heading's number is between the end of the line or header before it and its text
headings = re.findall(r"\bh?end ((?:(?!\bh?end\b).)*?) ?\b(C\d+[a-e]?) heading", flat)
headers = re.findall(r"header ?(.*?) ?hend\b", flat)

# The list numbers. Each is the text between its "= format value" and the one before, with the "=" taken out, as
# pdftotext writes right-to-left numbers before it
lists = {}
part = flat[flat.find("L decimal:") :]
names = "|".join(re.findall(r"\bL (\w+):", part))
previous = 0
for found in re.finditer(rf"(?<![A-Za-z])({names}) (-?\d+)\b", part):
    number = re.sub(rf"\bL (?:{names}):|=", "", part[previous : found.start()])
    lists.setdefault(found.group(1), {})[int(found.group(2))] = clean(number)
    previous = found.end()

result = {"pages": {f"{f} {s}": v for (f, s), v in pages.items()}, "references": references, "chapters": chapters, "lists": lists}
if "--json" in sys.argv:
    print(json.dumps(result, ensure_ascii=False, indent=1))
    sys.exit()

print("== P and R: page numbers and page references, and whether the list number of the same value is the same")
for (format, start), value in pages.items():
    listed = lists.get(format, {}).get(start)
    reference = references.get(f"P_{format}_{start}")
    print(
        f"  {format:28} {start:5}: page {value!r:30} reference {reference!r:22}"
        f" {'' if listed == value else f'list {listed!r}'}"
    )

print("\n== L: list numbers")
for format, values in lists.items():
    print(f"  {format}: " + " ".join(f"{v}={values[v]}" for v in sorted(values)))

print("\n== C: chapter numbers (text, header, reference)")
for heading in headings:
    print(f"  heading {heading[1]}: numbered {heading[0]!r}")
for name, value in chapters.items():
    bookmark = "C_" + name.replace(" ", "_")
    print(f"  {name:20}: page {value!r:14} reference {references.get(bookmark)!r}")
print("  headers: " + " ".join(headers))
