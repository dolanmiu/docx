# Layout probes

<!-- cspell:ignore fsplit soffice Poppler pdftocairo autoSpace pdftohtml Aptos GPOS DFonts -->

Documents made to find out how Word lays out pages, where its rules aren't written down. docx/layout follows what they
showed. Each line of text names its probe, such as `Q3a fill 12`, so it can be found in a PDF of the document, and each
probe starts on a page of its own or is marked off by lines above and below it.

Each probe has the `.docx` Word opened and the PDF Word saved from it, beside the script that makes it. They were saved
from Word 16 for Mac from 2026-09-30 to 2026-10-02 (Save As, PDF, Best for printing). docx writes some of them differently
now, so the committed `.docx` is the one each PDF is of: `word-rules` and `word-tables` were made before docx wrote a
table style and each cell's width.

| Probe                       | What it settles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Reader                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `word-rules`                | P0 to P10: the space before the first paragraph and at the top of a page, the space between paragraphs and contextual spacing, widow and orphan control, the height of headers and footers and of table rows, the line pitch of each font and size, footnotes that don't fit on the page, table rows broken across pages, columns, and paragraphs of only spaces                                                                                                                                                                                                 | `word-rules.py`                |
| `word-rules2`               | Q1 to Q7: contextual spacing with each paragraph's share, the space before a section's first paragraph on a new page, keepLines and widow control inside table rows, header rows in columns, sections that start in the next column, footnotes in columns, and columns of different widths                                                                                                                                                                                                                                                                       | `word-rules2.py`               |
| `word-balance`              | W1 to W9: how the columns before a continuous section break are evened out, with column breaks, space after, paragraphs kept together or with the next, tables, lines of two sizes, columns that go on to the next page or start low on it, and a page of exactly 51 lines before a new section                                                                                                                                                                                                                                                                  | `word-balance.py`              |
| `word-balance2`             | S1 to S7 and C1 to C2: the space after columns and before the next section, which the empty paragraph that ends a section keeps, and column breaks in columns that are evened out                                                                                                                                                                                                                                                                                                                                                                                | `word-balance.py`              |
| `word-keep-together`        | K1 to K5: a paragraph kept together that is taller than a column, which Word lays out down only the first column of each page, from a new page unless it is at the top of one, and what follows it                                                                                                                                                                                                                                                                                                                                                               | `word-balance.py`              |
| `word-next-column`          | N1 to N6: where a section that starts in the next column starts after columns of other numbers and widths, the space before its first paragraph there, three in a row, and in columns below text, followed by a continuous section break                                                                                                                                                                                                                                                                                                                         | `word-next-column.py`          |
| `word-column-widths`        | R1 to R6: widow control in a paragraph that goes on into a column of another width, where its lines are broken again, and the widths of a table sized to its text that goes on into a wider column                                                                                                                                                                                                                                                                                                                                                               | `word-column-widths.py`        |
| `word-contextual`           | X1 and Y1: contextual spacing next to the empty paragraph that ends a section, whose space after is never on the page itself, and with `doNotUseHTMLParagraphAutoSpacing`. `word-contextual-adding` is the second document it writes, with that setting                                                                                                                                                                                                                                                                                                          | `word-contextual.py`           |
| `word-tables`               | T1 to T13: the widths Word gives table columns from `columnWidths`, cell widths and table widths, and a word longer than its column (T7)                                                                                                                                                                                                                                                                                                                                                                                                                         | `pagelines.py`                 |
| `word-autofit`              | A1 to D1: the widths Word gives the columns of tables whose cells have no widths, which it sizes to their text                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `word-autofit.py`              |
| `word-long-words`           | L1 to L8: how Word widens a column for a word longer than its cells give it, in tables whose cells all have widths, and what it takes from the other columns. `word-long-words-layout.ts` prints docx/layout's widths for them                                                                                                                                                                                                                                                                                                                                   | `word-autofit.py`              |
| `word-probes`               | U1 to U8: the widths of tables given no widths with merged cells or tables in cells, footnotes continued, footnotes in table rows and in columns, rows with merged cells, a table in a cell or a set height across pages, rows taller than a page, the space before a continuous section's first paragraph with a page break before it, and lines of only spaces before a break                                                                                                                                                                                  | `word-probes.py`               |
| `word-header-columns`       | H1 to H8: a table's header rows repeated at the top of each column, in columns evened out before a continuous section break and on a second page, the columns of a table that goes on from the page before evened out, and the line of the empty paragraph that ends a section after a table                                                                                                                                                                                                                                                                     | `word-header-columns.py`       |
| `word-footnotes-in-columns` | N1 to N12: footnotes in columns, which Word lays out in the columns too, one after the other from the first and evened out, whichever column they are referred to from, with every column ending above them. Below columns that start below text across the page, or are evened out above it, a footnote that wraps in a column, one too long for the room below its reference, and footnotes referred to from text across the page and from columns below it                                                                                                    | `word-footnotes-in-columns.py` |
| `word-line-heights`         | H and T1 to T4: the height of lines in each font, size and line spacing, measured over a page, and how a table row breaks across pages: with room for the table's bottom border below it and for the space after a cell's paragraph, rows of an at-least height with less room than their height, and a page that ends between rows                                                                                                                                                                                                                              | `word-line-heights.py`         |
| `word-page-number-formats`  | P: page numbers and page references in each number format at 4, 1234 and 0, L: lists in each format from 1 to 60 and at larger numbers, and C1 to C11: chapter numbers, with each separator, from headings of each level and numbering, before and after a heading on the same page                                                                                                                                                                                                                                                                              | `word-page-number-formats.py`  |
| `word-page-number-formats2` | P: page numbers in each format where its letters run out and at 0, and C12 to C15: chapter numbers after a heading that isn't numbered, from one numbered on its own too, from a level with no number in its text, and from a style based on heading 1                                                                                                                                                                                                                                                                                                           | `word-page-number-formats.py`  |
| `word-unicode`              | K, E, L, H, N, W, A, P, KR, T, R and G: which characters Word keeps from starting or ending a line of Chinese and Japanese, with no language and in each language, hanging punctuation, kinsoku and wordWrap off, Latin words and numbers after ideographs, breaks after dashes, slashes and zero-width spaces, the space between ideographs and Latin text, punctuation compression, Korean and Thai, right-to-left paragraphs and runs, and the height of lines of East Asian, Thai and Hebrew fonts                                                           | `word-unicode.read.ts`         |
| `word-unicode2`             | S, E, H, A, W, T, F and G: every character of Word's lists in Japanese, Chinese, Korean and English, hanging punctuation and the space around Latin text in Japanese, wordWrap off, zero-width spaces, Thai without marks above or below its letters, the font and size of Hebrew and Latin in runs that are right to left and runs that aren't, and the height of lines of 21 East Asian fonts. `word-unicode2-layout.ts` compares where docx/layout breaks the lines of S and E with where Word does                                                           | `word-unicode2.read.ts`        |
| `word-no-prompt`            | NP1 to NP4: a document whose page numbers docx/layout writes, without `updateFields`: whether Word opens it without asking to update the fields, and whether the numbers of its table of contents, its page references in the text and the header, and its numbers of pages in the footers are the pages Word has. Word opened it without asking, and all 43 numbers were Word's                                                                                                                                                                                 | `word-no-prompt.py`            |
| `word-seq`                  | Q1 to Q14: how Word numbers SEQ fields: `\r`, `\c`, `\h` and `\s`, the formats of `\*`, identifiers in other capitals or quotes, bookmarks, hidden text, simple fields, headings and their entries in the table of contents, and SEQ fields in a footnote, the header and footer, and a text box. `word-seq-clean` is the same document written clean with page numbers, which Word opened without asking to update the fields                                                                                                                                   | `word-seq.py`                  |
| `word-watertight-text`      | TX1 to TX21: how Word measures text and lines where docx/layout read nothing or guessed: superscript, raised text, italics, small capitals, paragraph borders, automatic spacing, lengths in characters and lines, pictures in the line, two fonts on a line, soft hyphens, tabs past the margin, ligatures, emphasis marks, run borders, letters the width tables didn't have (TX17), fonts that aren't installed, the spaces other than U+0020 (TX19), justified lines and list numbers aligned right. One of the round of probes for the watertight inventory | `word-watertight.py`           |
| `word-watertight-tables`    | TB1 to TB11: how Word lays out table formatting docx/layout read nothing of: a table style's spacing and size against Normal's, borders only a table style has, cell borders, space between cells, rows kept with the next, vertical text in a cell, `hideMark`, a table style's first row, a table sized to its text and indented, hidden rows, and a floating table, the text after which Word puts beside it (TB11), where docx/layout stops. One of the round of probes for the watertight inventory                                                         | `word-watertight.py`           |
| `word-character-widths`     | W, S, B and H: how wide Word draws each of the 1,995 characters of the width tables' ranges in Calibri, Cambria, Arial, Times New Roman and Courier New, plain and bold, and which font it draws those its fonts lack in; how wide each space is; whether lines break after each space; and whether a word before one at the end of a line stays on the line. Its `.json` has each paragraph's characters, for the reader. `scripts/generate-font-widths.ts` checks the width tables against what the reader reads                                               | `word-character-widths.py`     |
| `word-italic-widths`        | W and S in italic and bold italic: how wide Word draws each character of the width tables' ranges in the italics of the five fonts, and which font it draws those their italics lack in, and how wide each space is. `word-character-widths.ts` writes it with `italic`, and `word-character-widths.json`'s italic twin, `word-italic-widths.json`, is beside it. `scripts/generate-font-widths.ts` checks the italic width tables against what the reader reads                                                                                                 | `word-character-widths.py`     |
| `word-fonts`                | F1 to F7: when Word kerns text in Aptos, from what size and across runs, whether with the pairs only its GPOS table has, and how far apart its lines are, for measuring fonts from their files                                                                                                                                                                                                                                                                                                                                                                   | `word-fonts.py`                |
| `word-units`                | U1 to U8: lengths written with units, as docx writes a length given as a string, such as `"1in"` or `"12pt"`: whether Word reads them in a page's size and margins, a run's size, indents, character spacing, a table's widths and row height and the space between columns, and how it rounds a margin of a fraction of a twip and a size of a fraction of a half-point                                                                                                                                                                                         | `word-units.py`                |
| `word-units2`               | V1 to V6: how Word reads a length with a unit that isn't a whole number of twips or half-points, measured across the page: indents and a margin in each unit, negative ones, sizes, character spacing, a table's column and a row's height                                                                                                                                                                                                                                                                                                                       | `word-units.py`                |
| `word-positions`            | H1 to H3, X1 to X9 and Y1: the header and footer of the blank page Word adds before a section on an odd or even page, which page it adds it before a section numbered from its own first number, and where each line is across and down the page with indents, alignment, a list, a right tab, a table, columns and a footnote, against `layoutDocument`                                                                                                                                                                                                         | `word-positions.py`            |
| `word-watertight-stops`     | SP1 to SP19: what Word does where docx/layout stops. SP18, justified lines whose last word fits only with their spaces 3% to 33% narrower, showed how far Word squeezed them                                                                                                                                                                                                                                                                                                                                                                                     | `word-watertight.py`           |
| `word-justify`              | J00 to J18: when Word squeezes a justified line to fit one more word on it: lines of 19, 6 and 2 spaces ending with short, medium and long words, in other fonts, last lines, lines before a line break, distributed and the other justifications, tabs, no-break spaces, spaces at the start of a line, and ideographs                                                                                                                                                                                                                                          | `word-justify.py`              |
| `word-justify2`             | K00 to K12: when Word squeezes a distributed line, and Latin text justified for Thai or with a low kashida, as J01 to J07 and J04 for justified ones, and justified and distributed lines with one space                                                                                                                                                                                                                                                                                                                                                         | `word-justify.py`              |
| `fsplit`                    | How a footnote that doesn't fit below its reference goes on to the next page. Laid out in LibreOffice only, so it has no PDF from Word: Word's split of an 8-line footnote is `word-rules` P7b                                                                                                                                                                                                                                                                                                                                                                   | `pagelines.py`                 |

## Make a probe's `.docx`

From the root of the repository:

```bash
npm run run-ts -- scripts/layout-probes/word-rules2.ts
```

It writes `build/word-probes/word-rules2.docx`. `fsplit`, `word-no-prompt` and `word-seq` import `docx/layout`, so build the
package first (`npm run build`). `word-watertight-stops` and `word-justify` measure their lines with docx/layout's
width tables, which they import from `src`. The others import only `docx`, as the demos do. `word-watertight-text`
and `word-watertight-stops` replace markers in the XML with what docx can't write, as their `INJECTIONS` and
`FIRST_ROW_STYLE` say. `word-fonts` also imports the measuring of text from
`src/text-layout`, to print the widths docx/layout measures its probes at when it is given a folder with Aptos's and
Calibri's files, such as Word's own:

```bash
npm run run-ts -- scripts/layout-probes/word-fonts.ts build/word-probes/word-fonts.docx "/Applications/Microsoft Word.app/Contents/Resources/DFonts"
```

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

`word-positions.py` compares the PDF with the layout `word-positions.ts` writes beside its `.docx`, from
`layoutDocument`:

```bash
npm run run-ts -- scripts/layout-probes/word-positions.ts
pdftotext -bbox-layout scripts/layout-probes/word-positions.pdf build/word-probes/word-positions.html
python3 scripts/layout-probes/word-positions.py build/word-probes/word-positions.html build/word-probes/word-positions.layout.json
```

`word-unicode.read.ts` and `word-unicode2.read.ts` are TypeScript, for `Intl.Segmenter`, which they check Thai's line breaks with:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-unicode2.pdf build/word-probes/word-unicode2.html
npm run run-ts -- scripts/layout-probes/word-unicode2.read.ts build/word-probes/word-unicode2.html
```

`word-seq.py` reads Word's PDF of `word-seq`, and the `.docx` of `word-seq-clean` docx writes, to check the numbers
written in it against Word's. Word updates the fields of `word-seq-clean` when it saves it as a PDF, so its PDF has
Word's numbers, not the ones written. The committed `word-seq-clean.docx` is the one Word opened; make it again to check
docx as it is now:

```bash
pdftotext -layout -enc UTF-8 scripts/layout-probes/word-seq.pdf build/word-probes/word-seq.txt
python3 scripts/layout-probes/word-seq.py build/word-probes/word-seq.txt build/word-probes/word-seq-clean.docx
```

`word-page-number-formats.py` reads both page number probes, from the text of `pdftotext -layout` rather than where each
line is:

```bash
pdftotext -layout -enc UTF-8 scripts/layout-probes/word-page-number-formats.pdf build/word-probes/word-page-number-formats.txt
python3 scripts/layout-probes/word-page-number-formats.py build/word-probes/word-page-number-formats.txt
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

`word-watertight.py` and `word-character-widths.py` take the name of the PDF without its extension, and read its HTML and
the text and fonts of `pdftohtml -xml`:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-character-widths.pdf build/word-probes/word-character-widths.html
pdftohtml -xml -i -q -zoom 1 scripts/layout-probes/word-character-widths.pdf build/word-probes/word-character-widths
python3 scripts/layout-probes/word-character-widths.py build/word-probes/word-character-widths
```

It reads `word-italic-widths` the same way. With `--json`, `word-character-widths.py` prints the widths it read, which
`scripts/generate-font-widths.ts` takes, and where the lines of W break, which `word-character-widths-layout.ts` compares
with where docx/layout breaks them:

```bash
python3 scripts/layout-probes/word-character-widths.py build/word-probes/word-italic-widths --json > build/word-probes/word-italic-widths.word.json
npm run run-ts -- scripts/layout-probes/word-character-widths-layout.ts word-italic-widths build/word-probes/word-italic-widths.word.json
```

`word-probes.py` takes the name of the PDF without its extension, and reads its HTML and, for U1's tables, its first
five pages as SVG:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-probes.pdf build/word-probes/word-probes.html
for n in 1 2 3 4 5; do pdftocairo -svg -f $n -l $n scripts/layout-probes/word-probes.pdf build/word-probes/word-probes-$n.svg; done
python3 scripts/layout-probes/word-probes.py build/word-probes/word-probes
```

For `word-watertight-text` and `word-watertight-stops`, `word-watertight.py` reads the pictures on each page from
`pdfimages -list` too, which some of their probes need:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-watertight-text.pdf build/word-probes/word-watertight-text.html
pdfimages -list scripts/layout-probes/word-watertight-text.pdf > build/word-probes/word-watertight-text.images.txt
pdftohtml -xml -i -q -zoom 1 scripts/layout-probes/word-watertight-text.pdf build/word-probes/word-watertight-text
python3 scripts/layout-probes/word-watertight.py build/word-probes/word-watertight-text
```

`word-justify.py` takes the name of the PDF without its extension too, and reads only its HTML:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-justify.pdf build/word-probes/word-justify.html
python3 scripts/layout-probes/word-justify.py build/word-probes/word-justify
```

`word-justify.ts` also writes `word-justify2.docx`, the K probes of distributed lines, and the reader reads its PDF the
same way, by its name:

```bash
pdftotext -bbox-layout scripts/layout-probes/word-justify2.pdf build/word-probes/word-justify2.html
python3 scripts/layout-probes/word-justify.py build/word-probes/word-justify2
```

`word-line-heights.py` also measures the height of lines in other PDFs, such as `word-rules`' P3 and Word's PDFs of the
layout demos, and the lines of the rows of `tables-across-pages` that break across pages: see the top of it.

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

## Documents saved from Word

Each `<demo>.word.docx` is a layout demo, as `scripts/compare-layout.sh` writes it, opened in Word 16 for Mac in Print
Layout, with No to updating the fields, and saved as a Word Document once Word had laid out all its pages (2026-10-01).
Word writes a `w:lastRenderedPageBreak` where each page began, and the number of pages in `docProps/app.xml`.

`scripts/compare-layout.sh` copies them into its output directory, and `scripts/compare-layout.ts` lays each out through
the `.docx` adapter, as `patchDocument` lays out a template, and compares the page of each heading in its table of
contents with the page Word marked it on. Word's PDFs of the same documents showed where Word writes the marks, and where
it doesn't (see `wordPagesOf` in `scripts/compare-layout.ts`).

`columns` and `long-table-of-contents` aren't here: Word writes no mark where a column break starts a page, nor in a
table of contents, so their marks don't have all of Word's pages. Word's PDFs of them put all their headings on the
pages docx/layout puts them on.
