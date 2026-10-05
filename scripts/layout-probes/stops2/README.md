# The stops batch (lay-stops2)

<!-- cspell:ignore pdftocairo Poppler poppler hhea GPOS -->

Probe documents for the stops of docx/layout that no Word PDF saved before 2026-10-04 settled, made in one batch from
docx at `master` a871df8a25 and saved from Word 16 for Mac on 2026-10-04 and 2026-10-05 (Save As, PDF, Best for
printing, No to updating fields). Each script's header says what each of its probes is and which stop it settles. Those
committed here are the ones a change to docx/layout has followed, with Word's PDF of each beside its `.docx`:

| Script                         | Probes                               | What Word showed, followed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `word-stops-long-words.ts`     | LW1 to LW5                           | LW1 to LW5: columns share the room in proportion to their longest words; long words beside space between cells widen their columns. For the next batch: `word-stops-long-words2.ts`                                                                                                                                                                                                                                                                                                                                                                                                              |
| `word-stops-drawings.ts`       | DR1 to DR16, DH1                     | DH1a to DH1e: a header's or footer's picture that text wraps around, placed against the page, is one the body's text goes round, on both sides, one side, or above and below it, in the first page's header too                                                                                                                                                                                                                                                                                                                                                                                  |
| `word-stops-tables.ts`         | RW1 to RW12, TS1 to TS9              | RW1 to RW12: merged text, nested tables, rows taller than a page; NT11 of `word-stops-notes`: rows cut for footnotes; TS1 to TS9: table styles' rows and cells. Next batch: `word-stops-rows2.ts`, `word-stops-tables2.ts`                                                                                                                                                                                                                                                                                                                                                                       |
| `word-stops-text.ts`           | RF20 to RF32, PB1 to PB8             | PB6a to PB6e: contextual spacing at a table cell's top compares its first paragraph with the paragraph before the table, and at its bottom with the end of the row, which is in the default paragraph style. RF20 to RF23, RF25, RF26, RF28, RF30, PB1 to PB3, PB5b, PB5c, PB5e, PB7b and PB8: the room of emphasis marks, run borders' widths, lengths' minus signs, two lines in one, boxes of paragraph borders with between borders and across page breaks, a section's empty last paragraph, indents in characters, multiple spacing below evened-out columns, and a line of only a picture |
| `word-stops-table-borders.ts`  | TB1 to TB7                           | TB1 to TB7: borders that meet take the heavier's room, by Word's weights, and cells' own borders take room beside space between cells; PB4 of `word-stops-text`: paragraph borders' widths. Next batch: `word-stops-table-borders2.ts`                                                                                                                                                                                                                                                                                                                                                           |
| `word-stops-floats.ts`         | FT1 to FT8, FR1 to FR6, HR1          | HR1a to HR1h: a table's header rows go on to the next page with the row after them when none of it goes below them, and stay with as many of its lines as fit                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `word-stops-tabs.ts`           | TA1 to TA8, SH10 to SH15, JU1 to JU3 | TA8a to TA8h: a left tab stop past the end of the line takes a line of its own, and the text after it goes on the next, with a first line or hanging indent too (TA1a, TA1b). TA3, TA4, TA6, TA7, SH10 to SH13 and JU1 to JU3: right, centred and decimal stops past the end of the line and the right indent, decimal stops after a number, tabs in a border, soft hyphens in justified and bordered lines, and how far Word squeezes a line                                                                                                                                                    |
| `word-stops-vertical-cells.ts` | TV1 to TV6                           | TV1 to TV6: a column of text running up or down is about a line of each paragraph wide, in Calibri; TV5d: a table in it stops the layout, and a layout that guesses lays it out. For the next batch: `word-stops-vertical-cells2.ts`                                                                                                                                                                                                                                                                                                                                                             |
| `word-stops-equations.ts`      | EQ10 to EQ28, EQS1, EQS2             | EQ10 to EQ28: equations Word builds up by Cambria Math's maths table, in a line of text and displayed, each character as wide as the font has it, an integral with its italic correction (EQ27k); EQS1 and EQS2: the maths settings                                                                                                                                                                                                                                                                                                                                                              |
| `word-stops-font-widths.ts`    | W, S, B, H                           | W, S: each of Office's 16 other fonts as wide as Word's own file of it; an italic Word slants as wide as upright. `STOPS_ITALIC=1` writes the italics. Read with `../word-character-widths.py`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `word-stops-font-kerning.ts`   | I, K, L, P, R, SP                    | K, L, P: kerned as each font's file kerns it; with ligatures, only where its GPOS table kerns Latin. `STOPS_SET=2` writes the second half. Read with `../word-kerning.py`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `word-stops-kerning.ts`        | KE1 to KE8, FH1 to FH16              | FH1 to FH16 (`word-stops-font-heights`): each of the 16 fonts' lines as tall as its file's hhea table makes it. Read with `word-font-heights.py`. KE3, KE6a, KE7b, KE7d, KE7f: ligatures beside a Latin letter outside Windows-1252, a kerned word longer than its line broken where its kerned letters fit, and tabular figures as wide as the font's own                                                                                                                                                                                                                                       |
| `word-stops-notes.ts`          | NT2 to NT16, NE1 to NE3              | NT13a to NT13c: a footnote's paragraph borders and automatic spacing take room as in the text, its last paragraph's space after at the foot of the page; NT14a to NT15: footnotes numbered on each page and from a later section's number, put below the text, and with a mark of their own; NT7, NT10b, NT2b, NE1, NE2, NE3                                                                                                                                                                                                                                                                     |
| `word-stops-numbers.ts`        | NF2 to NF4                           | NF2, NF3: page references in CardText, DollarText, OrdText and Hex, and pictures with a space for each `#` or `x` with no digit, decimals and text in quotes                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `word-stops-compat-mode.ts`    | CM1 to CM22, in modes 15 to 11       | Word 2010 and before laid out all but a few alike: justified lines not squeezed (CM1), a table's text at its indent, one sized to its text with its cells' margins beside the room (CM4)                                                                                                                                                                                                                                                                                                                                                                                                         |
| `word-stops-pages.ts`          | CO1, CO2, GT1, DV1, TB10, BK1, TO1   | CO1, CO2: kept paragraphs in 3 columns as in 2; GT1: a gutter at the top below a negative margin; DV1b: a row in a division as tall; TO1: two pages to a sheet as the section's                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `word-stops-east-asian.ts`     | GR1 to GR13, VD1 to VD13, EA1 to EA3 | GR1 to GR12: notes, spaced and kerned text, marks, tabs, pictures, long words and columns on grids; VD1 to VD13: text down the page with tabs, borders, notes, gutters, grids; EA1 to EA3: no change in text of no language                                                                                                                                                                                                                                                                                                                                                                      |
| `word-stops-imported.ts`       | IM1 to IM3                           | IM2a to IM2d: kept formatting keeps its own paragraph and character styles but takes the document's table styles and theme, its last paragraph without space after; IM3: no font or size in its defaults is Times New Roman 10                                                                                                                                                                                                                                                                                                                                                                   |
| `word-stops-more-widths.ts`    | W                                    | W: Hebrew, Thai, Arabic-Indic and Devanagari digits, box drawing, shapes, symbols and dingbats as wide as the font, or another Word draws them in, whose ascent and descent the line takes, in the five fonts, plain, bold and italic (`word-stops-more-italic-widths`), and Office's other fonts, plain and bold (`word-stops-more-widths-office`). Read by `word-stops-more-widths.py`                                                                                                                                                                                                         |
| `word-stops-office-fonts.ts`   | MB1 to MB4, FB1, FB2, KL1, KL2, DS   | MB1 to MB3: the bold Word makes itself 20 thousandths of an em wider a glyph at any size, kerned as the regular, as tall; FB1, FB2: a letter a font lacks drawn in the same font whatever the language, the line as tall as that font; KL1: text with ligatures not kerned in a font kerned by its kern table alone; DS: hhea descents. Read by `word-stops-office-fonts.py`                                                                                                                                                                                                                     |

`word-stops-thai-and-compat.ts` writes `word-stops-top-spacing` (ST1 to ST5), whose PDF showed `suppressTopSpacing`
leaving all but 9.6 points above the text of the first line of a page or column at exact and at-least spacing, and
`word-stops-fe-layout` (FE1), whose PDF showed `useFELayout` leaving Latin paragraphs as they are, both followed, and
`word-stops-thai` (TH1 to TH3), whose PDF showed Thai justified for it breaking as justified Thai (TH1d, TH1e), and lines
of Thai in Calibri as tall as Tahoma's, which Word draws them in, also followed.

`word-stops-edges.ts` has the cases around those, where docx/layout still stops (DH2, PB9, HR2 and TA9), for the next
batch Word saves, and `word-stops-text2.ts` those around what `word-stops-text`, `-tabs` and `-kerning` settled (RF24,
RF27, RF29, RF31, RF32, PB3, PB5, PB7, SH16, SH17, JU4, TA10, TA11 and KE9): they have no PDF from Word yet. Nor has
`word-stops-compat2.ts`, for what the compatibility modes, `suppressTopSpacing`, `useFELayout`, booklets and HTML
divisions left open (CN1 to CN11, ST6 to ST15, BK2, BK3, DV2 and FE2). `word-stops-equations.py` reads the equations'
widths and heights from Word's PDFs, and `word-equation-characters.py` EQ27's width of each character, which Cambria
Math's own widths in `src/layout/cambria-math.ts`, generated by `scripts/generate-cambria-math.ts`, are.
`word-stops-notes2.ts`, the cases around `word-stops-notes.ts`'s (NT2c to NT21, NE4 to NE7), waits for the next batch
too, and `word-stops-numbers.ts` and `word-stops-marks.ts` now write their list, number format, hidden mark and tracked
change probes in smaller documents, as Word couldn't open the batch's: those have no PDF yet either.

`word-stops-equations2.ts` has the equations' cases Word's PDFs left open (EQ30 to EQ45), in
`word-stops-equations2`, `word-stops-equation-limits`, `word-stops-equation-small` and `word-stops-equation-spacing`,
for the next batch too.

`word-stops-east-asian2.ts` has what `word-stops-east-asian.ts` left stopping, for the next batch too: indents of part of a
character on a grid that snaps to characters (GR14), the cases around GR3, GR5, GR7, GR8 and GR10 on grids (GR16), which
change of grid or direction sends endnotes to the end of their own section (GR15), and the strict rules and compression in
text in Japanese (EA4). So has `word-stops-arabic.ts`, for the widths of Arabic's letters in each form Word joins them in
(AR1), which `word-stops-more-widths` and `word-stops-thai` TH3b, ten of each letter in a row, showed joined, and lines of
Arabic prose to check them by (AR2). Read Word's PDF of it with `word-stops-arabic.py`. `word-stops-more-widths.ts` writes
the same characters as its W in Office's other fonts with `STOPS_FONTS=office` (`word-stops-more-widths-office`), and in
the five fonts' italics with `STOPS_ITALIC=1` (`word-stops-more-italic-widths`), read with `word-stops-more-widths.py` as
its own, whose PDFs, saved in the final batch, are followed.

`word-stops-office-fonts.ts` has what the font probes left stopping (MB, FB, KL and DS): the bold Word makes itself at
other sizes, the font Word draws a character a font lacks in, kerning with other ligature settings in fonts kerned by their
kern table alone, and descents. Read Word's PDF of it with `word-stops-office-fonts.py`. Its MB4 showed Word drawing
Pacifico, which the document embeds, in the copy of it Office downloads, not in the embedded file.

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
