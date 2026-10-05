# The stops batch (lay-stops2)

<!-- cspell:ignore pdftocairo Poppler poppler hhea GPOS -->

Probe documents for the stops of docx/layout that no Word PDF saved before 2026-10-04 settled, made in one batch from
docx at `master` a871df8a25 and saved from Word 16 for Mac on 2026-10-04 and 2026-10-05 (Save As, PDF, Best for
printing, No to updating fields). Each script's header says what each of its probes is and which stop it settles. Those
committed here are the ones a change to docx/layout has followed, with Word's PDF of each beside its `.docx`:

| Script                         | Probes                               | What Word showed, followed                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `word-stops-drawings.ts`       | DR1 to DR16, DH1                     | DH1a to DH1e: a header's or footer's picture that text wraps around, placed against the page, is one the body's text goes round, on both sides, one side, or above and below it, in the first page's header too                     |
| `word-stops-tables.ts`         | RW1 to RW12                          | RW1 to RW12: merged text, nested tables and rows set taller than a page break as Word does; NT11 of `word-stops-notes`: a row cut where its footnote fits whole. Next batch: `word-stops-rows2.ts`                                  |
| `word-stops-text.ts`           | RF20 to RF32, PB1 to PB8             | PB6a to PB6e: contextual spacing at a table cell's top compares its first paragraph with the paragraph before the table, and at its bottom with the end of the row, which is in the default paragraph style                         |
| `word-stops-floats.ts`         | FT1 to FT8, FR1 to FR6, HR1          | HR1a to HR1h: a table's header rows go on to the next page with the row after them when none of it goes below them, and stay with as many of its lines as fit                                                                       |
| `word-stops-tabs.ts`           | TA1 to TA8, SH10 to SH15, JU1 to JU3 | TA8a to TA8h: a left tab stop past the end of the line takes a line of its own, and the text after it goes on the next                                                                                                              |
| `word-stops-vertical-cells.ts` | TV1 to TV6                           | TV5d: a table in a cell whose text runs up, which stops the layout, and which a layout that guesses lays out                                                                                                                        |
| `word-stops-equations.ts`      | EQ10 to EQ28                         | EQ27a to EQ27k: Word draws each character of an equation that Cambria Math has as wide as the font has it, the Greek variants as italic letters, but for the integrals, which it draws wider, and ◇, which it draws in another font |
| `word-stops-font-widths.ts`    | W, S, B, H                           | W, S: each of Office's 16 other fonts as wide as Word's own file of it; an italic Word slants as wide as upright. `STOPS_ITALIC=1` writes the italics. Read with `../word-character-widths.py`                                      |
| `word-stops-font-kerning.ts`   | I, K, L, P, R, SP                    | K, L, P: kerned as each font's file kerns it; with ligatures, only where its GPOS table kerns Latin. `STOPS_SET=2` writes the second half. Read with `../word-kerning.py`                                                           |
| `word-stops-kerning.ts`        | KE1 to KE8, FH1 to FH16              | FH1 to FH16 (`word-stops-font-heights`): each of the 16 fonts' lines as tall as its file's hhea table makes it. Read with `word-font-heights.py`                                                                                    |
| `word-stops-compat-mode.ts`    | CM1 to CM22, in modes 15 to 11       | Word 2010 and before laid out all but a few alike: justified lines not squeezed (CM1), a table's text at its indent, one sized to its text with its cells' margins beside the room (CM4)                                            |
| `word-stops-pages.ts`          | CO1, CO2, GT1, DV1, TB10, BK1, TO1   | CO1, CO2: kept paragraphs in 3 columns as in 2; GT1: a gutter at the top below a negative margin; DV1b: a row in a division as tall; TO1: two pages to a sheet as the section's                                                     |

`word-stops-thai-and-compat.ts` writes `word-stops-top-spacing` (ST1 to ST5), whose PDF showed `suppressTopSpacing`
leaving all but 9.6 points above the text of the first line of a page or column at exact and at-least spacing, and
`word-stops-fe-layout` (FE1), whose PDF showed `useFELayout` leaving Latin paragraphs as they are, both followed, and
`word-stops-thai` (TH1 to TH3).

`word-stops-edges.ts` has the cases around those, where docx/layout still stops (DH2, PB9, HR2 and TA9), for the next
batch Word saves: it has no PDF from Word yet. So has `word-stops-compat2.ts`, for what the compatibility modes,
`suppressTopSpacing`, `useFELayout`, booklets and HTML divisions left open (CN1 to CN11, ST6 to ST15, BK2, BK3, DV2 and
FE2). `word-equation-characters.py` reads EQ27's widths from Word's PDF, for
`scripts/generate-equation-widths.ts`.

`word-stops-office-fonts.ts` has what the font probes left stopping (MB, FB, KL and DS), for the next batch too: the bold
Word makes itself at other sizes, the font Word draws a character a font lacks in, kerning with other ligature settings in
fonts kerned by their kern table alone, and descents. Read Word's PDF of it with `word-stops-office-fonts.py`.

`kit.ts` is what the scripts share: the page (A4, inch margins, Calibri 11 single spaced, 51 lines a page), labelled
lines, and the injections that write what docx can't, such as hidden or deleted paragraph marks, in the schema's order.

## Make them

From the root of the repository:

```bash
npm run run-ts -- scripts/layout-probes/stops2/word-stops-drawings.ts build/word-probes
npm run run-ts -- scripts/layout-probes/stops2/word-stops-equations.ts build/word-probes
```

## Read Word's PDFs

With Poppler (in the pinned `docx-shape-renderer` image, or `brew install poppler`), for a document `<name>`:

```bash
pdftotext -bbox-layout scripts/layout-probes/stops2/<name>.pdf build/word-probes/<name>.html
pdftocairo -svg scripts/layout-probes/stops2/<name>.pdf build/word-probes/<name>.svg
npm run run-ts -- scripts/layout-probes/stops2/layout-stops.ts scripts/layout-probes/stops2/<name>.docx > build/word-probes/<name>.layout.json
cd build/word-probes && python3 ../../scripts/layout-probes/stops2/word-stops.py <name> [--probe TV1]
```

`word-stops.py` prints each probe's lines with where each is (twips from the margins), the gap from the line before, and
the borders and rules drawn near it (from the SVG). With `<name>.layout.json` beside it, which `layout-stops.ts` writes
by laying out each probe alone with a guess, it also says where docx/layout's lines of the probe aren't Word's. It lines
the two up by each probe's first line, so for a probe with a header line above it, such as DH1, read the lines it prints
rather than the differences.

`whole-layout.ts` lays out a whole document the same way, with a guess past its stops, and `whole-lines.py` checks every
line of it against Word's PDF, in order. It says those on another page than Word's or more than 2 points from where Word
puts them, those Word doesn't have, and the probes' lines above and below that docx/layout doesn't have. It doesn't list
Word's other lines that docx/layout doesn't have, such as those past where it stops, so a quiet check doesn't mean it has
all of Word's:

```bash
npm run run-ts -- scripts/layout-probes/stops2/whole-layout.ts scripts/layout-probes/stops2/<name>.docx > build/word-probes/<name>.whole.json
cd build/word-probes && python3 ../../scripts/layout-probes/stops2/whole-lines.py <name> [prefix]
```
