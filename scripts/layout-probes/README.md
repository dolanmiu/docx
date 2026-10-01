# Layout probes

<!-- cspell:ignore fsplit soffice Poppler pdftocairo -->

Documents made to find out how Word lays out pages, where its rules aren't written down. docx/layout follows what they
showed. Each line of text names its probe, such as `Q3a fill 12`, so it can be found in a PDF of the document, and each
probe starts on a page of its own or is marked off by lines above and below it.

Each probe has the `.docx` Word opened and the PDF Word saved from it, beside the script that makes it. They were saved
from Word 16 for Mac on 2026-09-30 and 2026-10-01 (Save As, PDF, Best for printing). docx writes some of them differently
now, so the committed `.docx` is the one each PDF is of: `word-rules` and `word-tables` were made before docx wrote a
table style and each cell's width.

| Probe                | What it settles                                                                                                                                                                                                                                                                                                                                                                 | Reader                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `word-rules`         | P0 to P10: the space before the first paragraph and at the top of a page, the space between paragraphs and contextual spacing, widow and orphan control, the height of headers and footers and of table rows, the line pitch of each font and size, footnotes that don't fit on the page, table rows broken across pages, columns, and paragraphs of only spaces                | `word-rules.py`       |
| `word-rules2`        | Q1 to Q7: contextual spacing with each paragraph's share, the space before a section's first paragraph on a new page, keepLines and widow control inside table rows, header rows in columns, sections that start in the next column, footnotes in columns, and columns of different widths                                                                                      | `word-rules2.py`      |
| `word-balance`       | W1 to W9: how the columns before a continuous section break are evened out, with column breaks, space after, paragraphs kept together or with the next, tables, lines of two sizes, columns that go on to the next page or start low on it, and a page of exactly 51 lines before a new section                                                                                 | `word-balance.py`     |
| `word-balance2`      | S1 to S7 and C1 to C2: the space after columns and before the next section, which the empty paragraph that ends a section keeps, and column breaks in columns that are evened out                                                                                                                                                                                               | `word-balance.py`     |
| `word-keep-together` | K1 to K5: a paragraph kept together that is taller than a column, which Word lays out down only the first column of each page, from a new page unless it is at the top of one, and what follows it                                                                                                                                                                              | `word-balance.py`     |
| `word-next-column`   | N1 to N6: where a section that starts in the next column starts after columns of other numbers and widths, the space before its first paragraph there, three in a row, and in columns below text, followed by a continuous section break                                                                                                                                        | `word-next-column.py` |
| `word-contextual`    | X1 and Y1: contextual spacing next to the empty paragraph that ends a section, whose space after is never on the page itself, and with `doNotUseHTMLParagraphAutoSpacing`. `word-contextual-adding` is the second document it writes, with that setting                                                                                                                         | `word-contextual.py`  |
| `word-tables`        | T1 to T13: the widths Word gives table columns from `columnWidths`, cell widths and table widths, and a word longer than its column (T7)                                                                                                                                                                                                                                        | `pagelines.py`        |
| `word-autofit`       | A1 to D1: the widths Word gives the columns of tables whose cells have no widths, which it sizes to their text                                                                                                                                                                                                                                                                  | `word-autofit.py`     |
| `word-long-words`    | L1 to L8: how Word widens a column for a word longer than its cells give it, in tables whose cells all have widths, and what it takes from the other columns. `word-long-words-layout.ts` prints docx/layout's widths for them                                                                                                                                                  | `word-autofit.py`     |
| `word-probes`        | U1 to U8: the widths of tables given no widths with merged cells or tables in cells, footnotes continued, footnotes in table rows and in columns, rows with merged cells, a table in a cell or a set height across pages, rows taller than a page, the space before a continuous section's first paragraph with a page break before it, and lines of only spaces before a break | `word-probes.py`      |
| `fsplit`             | How a footnote that doesn't fit below its reference goes on to the next page. Laid out in LibreOffice only, so it has no PDF from Word: Word's split of an 8-line footnote is `word-rules` P7b                                                                                                                                                                                  | `pagelines.py`        |

## Make a probe's `.docx`

From the root of the repository:

```bash
npm run run-ts -- scripts/layout-probes/word-rules2.ts
```

It writes `build/word-probes/word-rules2.docx`. `fsplit` imports `docx/layout`, so build the package first
(`npm run build`). The others import only `docx`, as the demos do.

## Lay it out in LibreOffice

To compare with Word, convert the `.docx` to a PDF in the Docker image CI lays out the layout demos in, which has a
pinned LibreOffice and its fonts. Build it from `scripts/shape-demos/Dockerfile`, then:

```bash
docker run --rm --platform linux/amd64 --user "$(id -u):$(id -g)" -v "$PWD/build/word-probes:/work" -w /work \
    <image> soffice -env:UserInstallation=file:///tmp/profile --headless --convert-to pdf word-rules2.docx
```

LibreOffice keeps its settings in a profile, which has to be somewhere the user running it can write, hence
`-env:UserInstallation`.

LibreOffice's PDF takes the `.docx`'s name, so it replaces a PDF from Word of the same name in that folder. Keep
Word's PDFs somewhere else, or rename LibreOffice's.

## Read a PDF

Each reader reads where each line is from `pdftotext -bbox-layout`, from Poppler, which is in the image above and
in Homebrew (`brew install poppler`). For Word's PDF of `word-rules2`:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-rules2.pdf build/word-probes/word-rules2.html
python3 scripts/layout-probes/word-rules2.py build/word-probes/word-rules2.html
```

`word-balance.py` reads `word-balance`, `word-balance2` and `word-keep-together`, and `word-contextual.py` reads both
documents `word-contextual.ts` writes, `word-contextual` and `word-contextual-adding`. `word-autofit.py` reads the borders
of the tables of `word-autofit` and `word-long-words` too, from each page as SVG:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-autofit.pdf build/word-probes/word-autofit.html
pdftocairo -svg -f 1 -l 1 scripts/layout-probes/word-autofit.pdf build/word-probes/word-autofit-1.svg
pdftocairo -svg -f 2 -l 2 scripts/layout-probes/word-autofit.pdf build/word-probes/word-autofit-2.svg
python3 scripts/layout-probes/word-autofit.py build/word-probes/word-autofit
```

`word-probes.py` takes the name of the PDF without its extension, and reads its HTML and, for U1's tables, its first
five pages as SVG:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-probes.pdf build/word-probes/word-probes.html
for n in 1 2 3 4 5; do pdftocairo -svg -f $n -l $n scripts/layout-probes/word-probes.pdf build/word-probes/word-probes-$n.svg; done
python3 scripts/layout-probes/word-probes.py build/word-probes/word-probes
```

`pagelines.py` prints the lines of one page with their top, height, the gap from the line above in twips, and left
edge, which shows where each column of a table starts:

```bash
python3 scripts/layout-probes/pagelines.py build/word-probes/word-tables.html 1
```

Word puts text on a grid of 1/300 inch (4.8 twips), so a gap between two lines is only good to about 5 twips. Measure
heights over many lines.

## A new probe

When Word's rule for something isn't known, write a probe in the shape of `word-rules2.ts`, with a reader for its PDF, and have
it saved from Word as a PDF with the same name as its `.docx`. Commit the `.docx`, the PDF and the reader beside the
script, and leave out LibreOffice's PDFs, `pdftotext`'s HTML, SVG pages and Word's `~$` lock files.
