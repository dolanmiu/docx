# Checks docx/layout's layout of a whole probe document (whole-layout.ts) against Word's PDF of it, line by line: each of
# docx/layout's lines of text in the body is matched with the next of Word's lines of the same text, in order, and said
# where it is on another page than Word's, or more than 40 twips (2 points) up or down from it. Its lines Word's PDF hasn't
# the text of are said too, and Word's lines above and below the probes, "<name> above" and "<name> below", that none of
# docx/layout's matched: the lines of the cells of tables, which it doesn't write, aren't.
#
#   pdftotext -bbox-layout <name>.pdf <name>.html
#   npm run run-ts -- scripts/layout-probes/stops2/whole-layout.ts <name>.docx > <name>.whole.json
#   python3 scripts/layout-probes/stops2/whole-lines.py <name> [prefix]
#
# With a prefix, such as "TB7", only lines whose text starts with it are said.
import importlib.util
import json
import os
import re
import sys

spec = importlib.util.spec_from_file_location("stops", os.path.join(os.path.dirname(os.path.abspath(__file__)), "word-stops.py"))
source = open(spec.origin, encoding="utf8").read().replace("\nmain()\n", "\n")
stops = {}
exec(compile(source, spec.origin, "exec"), stops)


def bare(text):
    return re.sub(r"\s+", "", text)


def main():
    base = sys.argv[1]
    prefix = sys.argv[2] if len(sys.argv) > 2 else ""
    word = stops["read_lines"](base)
    ours = json.load(open(base + ".whole.json", encoding="utf8"))
    print(f"docx/layout stops at {ours['stoppedAt']!r}, guessing at {ours['guesses']}; {ours['pages']} pages, Word's {max(w['page'] for w in word)}")
    after = 0
    matched = set()
    differences = 0
    for one in [line for line in ours["lines"] if "text" in line and bare(line["text"]) and line["where"] == "body"]:
        match = next((index for index in range(after, len(word)) if index not in matched and bare(word[index]["text"]) == bare(one["text"])), None)
        if not one["text"].startswith(prefix):
            if match is not None:
                matched.add(match)
                after = match + 1
            continue
        if match is None:
            differences += 1
            print(f"    {one['text'][:50]!r}: docx/layout's page {one['page']}, {one['top']} down; not a line of Word's after the one before")
            continue
        matched.add(match)
        after = match + 1
        w = word[match]
        if w["page"] == one["page"] and abs(w["top"] - one["top"]) <= 40:
            continue
        differences += 1
        print(f"    {one['text'][:50]!r}: docx/layout's page {one['page']}, {one['top']} down; Word's page {w['page']}, {w['top']} down")
    for index, w in enumerate(word):
        if index not in matched and w["text"].startswith(prefix) and re.search(r"^\S+ (above|below)$", w["text"]):
            differences += 1
            print(f"    {w['text'][:50]!r}: Word's page {w['page']}, {w['top']} down; not a line of docx/layout's")
    print(f"{differences} lines elsewhere than Word's")

main()
