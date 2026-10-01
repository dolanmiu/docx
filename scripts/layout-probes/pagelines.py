# Prints the lines of one page of pdftotext -bbox-layout HTML, with their top, bottom and height in points, the gap from
# the line above in twips, and their left edge.
# Usage: python3 scripts/layout-probes/pagelines.py build/word-probes/word-tables.html 1
import html, re, sys
text = open(sys.argv[1]).read()
page = re.findall(r"<page.*?</page>", text, re.S)[int(sys.argv[2]) - 1]
prev = None
for line in re.findall(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">(.*?)</line>', page, re.S):
    words = " ".join(html.unescape(w) for w in re.findall(r">([^<]*)</word>", line[3]))
    y = float(line[1])
    print(f"{y:7.2f} {float(line[2]):7.2f} h{float(line[2]) - y:5.2f} d{(y - prev) * 20 if prev else 0:6.1f} x{float(line[0]):6.1f}  {words[:60]}")
    prev = y
