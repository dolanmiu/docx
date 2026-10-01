# Reads the probes of word-fonts.ts from pdftotext -bbox-layout's HTML of a PDF of it, and prints what each shows.
# Usage: python3 word-fonts.py word-fonts.html
# cspell:ignore Aptos
import html
import re
import sys

text = open(sys.argv[1]).read()
WORDS = []  # (page, yMin, xMin, xMax, text)
for p, page in enumerate(re.findall(r"<page.*?</page>", text, re.S), 1):
    for word in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', page):
        WORDS.append((p, float(word[1]), float(word[0]), float(word[2]), html.unescape(word[3])))


def word_after(name):
    """The width of the word after the probe's name, on its line, in points"""
    label = next(entry for entry in WORDS if entry[4] == name)
    after = next(entry for entry in WORDS if entry[0] == label[0] and abs(entry[1] - label[1]) < 1 and entry[2] > label[3])
    return after[3] - after[2]


def show(name, description):
    print(f"  {name}: {word_after(name):8.3f}  {description}")


print("== F1: Aptos 12, ToToTo..., which its kern and GPOS tables both kern")
show("F1a", "not kerned")
show("F1b", "kerned from 1 point")

print("\n== F2: Aptos 12, with pairs only its GPOS table kerns")
show("F2a", "PcPc... not kerned")
show("F2b", "PcPc... kerned from 1 point")
show("F2c", "YyYy... not kerned")
show("F2d", "YyYy... kerned from 1 point")

print("\n== F3: ToToTo... kerned from 14 points")
show("F3a", "12 points, kerned from 14")
show("F3b", "14 points, kerned from 14")
show("F3c", "16 points, kerned from 14")
show("F3d", "14 points, not kerned")
show("F3e", "16 points, not kerned")

print("\n== F4: ToToTo..., each letter in its own run, kerned from 1 point")
show("F4a", "")

print("\n== F5: Calibri 12, ToToTo...")
show("F5a", "not kerned")
show("F5b", "kerned from 1 point")

print("\n== F6: the distance between Aptos's lines, in twips, from the lines on the same page")
for name, size in [("F6a", 12), ("F6b", 11)]:
    # Each line starts with its probe's name
    lines = sorted((entry for entry in WORDS if entry[4] == name), key=lambda entry: (entry[0], entry[1]))
    gaps = [b[1] - a[1] for a, b in zip(lines, lines[1:]) if a[0] == b[0]]
    print(f"  {name}, {size} points: {sum(gaps) / len(gaps) * 20:.2f} twips, over {len(gaps)} gaps")

print("\n== F7: ToToTo... in bold and italic Aptos")
show("F7a", "bold, not kerned")
show("F7b", "bold, kerned from 1 point")
show("F7c", "italic, not kerned")
show("F7d", "italic, kerned from 1 point")
