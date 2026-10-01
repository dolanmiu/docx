# Reads word-balance.ts's probes from pdftotext -bbox-layout's HTML of a PDF of it, and prints, for each probe, how many
# lines each column has, from which to which, and where the line after the columns is. W9 prints the page of each line.
# Usage: python3 scripts/layout-probes/word-balance.py build/word-probes/word-balance.html
import re, html, sys
from collections import defaultdict
text = open(sys.argv[1]).read()
LINES=[]
for p, page in enumerate(re.findall(r'<page.*?</page>', text, re.S), 1):
    for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>', page, re.S):
        words = " ".join(html.unescape(w) for w in re.findall(r'>([^<]*)</word>', line[3]))
        LINES.append((p, float(line[1]), float(line[2]), float(line[0]), words))
names = []
for l in LINES:
    n = l[4].split(" ")[0]
    if n not in names: names.append(n)
for name in names:
    mine=[l for l in LINES if l[4].split(" ")[0]==name]
    cols=defaultdict(list)
    for l in mine:
        if l[4].endswith("top") or l[4].endswith("after"): continue
        cols[(l[0],round(l[3]))].append(l)
    after=[l for l in mine if l[4].endswith("after")]
    top=[l for l in mine if l[4].endswith("top")]
    desc="; ".join(f"p{k[0]} x{k[1]}: {len(v)} [{v[0][4].replace(name+' ','')} .. {v[-1][4].replace(name+' ','')}] {v[0][1]:.2f}-{v[-1][2]:.2f}" for k,v in sorted(cols.items()))
    print(f"{name}: top p{top[0][0]} {top[0][1]:.2f}; {desc}; after p{after[0][0]} {after[0][1]:.2f}" if top and after else f"{name}: {desc}")

for l in LINES:
    if l[4].startswith("W9 top") or l[4].startswith("W9 fill 50") or l[4].startswith("W9 next"):
        print(f"W9: {l[4]} on page {l[0]} at {l[1]:.2f}")
