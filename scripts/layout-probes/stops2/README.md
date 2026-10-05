# The stops batch (lay-stops2)

<!-- cspell:ignore pdftocairo Poppler poppler hhea GPOS -->

Probe documents for the stops of docx/layout that no Word PDF saved before 2026-10-04 settled, made in one batch from
docx at `master` a871df8a25 and saved from Word 16 for Mac on 2026-10-04 and 2026-10-05 (Save As, PDF, Best for
printing, No to updating fields). Each script's header says what each of its probes is and which stop it settles. Those
committed here are the ones a change to docx/layout has followed, with Word's PDF of each beside its `.docx`:

| Script                         | Probes                               | What Word showed, followed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `word-stops-long-words.ts`     | LW1 to LW5                           | LW1 to LW5: columns share the room in proportion to their longest words; long words beside space between cells widen their columns. And `word-stops-long-words2.ts`, below                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `word-stops-long-words2.ts`    | LW6 to LW8                           | LW6, LW7: a table of a share of the width that its words don't fit grows to them, up to the page, and shares the page past it as one of all of it; rows that give a column different widths in a table of a share of it, or that start past its first column, are evened out; a table sized to its text or of a share fills it less half of each of its outer borders. LW8: a long word across cells merged across columns of a table narrowed to the page still stops                                                                                                                           |
| `word-stops-drawings.ts`       | DR1 to DR16, DH1                     | DH1a to DH1e: a header's or footer's picture that text wraps around, placed against the page, is one the body's text goes round, on both sides, one side, or above and below it, in the first page's header too                                                                                                                                                                                                                                                                                                                                                                                  |
| `word-stops-tables.ts`         | RW1 to RW12, TS1 to TS9              | RW1 to RW12: merged text, nested tables, rows taller than a page; NT11 of `word-stops-notes`: rows cut for footnotes; TS1 to TS9: table styles' rows and cells. And `word-stops-rows2.ts`, `word-stops-tables2.ts`, below                                                                                                                                                                                                                                                                                                                                                                        |
| `word-stops-rows2.ts`          | RW13 to RW20                         | RW13 to RW16, RW18 to RW20: merged text goes on page by page, across a page break between its rows, and in and out of rows taller than a page; a cut row's footnotes go to the next page; a header row taller than a page isn't repeated, and what follows its table goes a page on; rows taller than a column go down first columns. RW17, a footnote in a row at least as tall as a page with text taller too, still stops                                                                                                                                                                     |
| `word-stops-tables2.ts`        | TS10 to TS15                         | TS10 to TS15: a table style's rows kept whole, its own or a part's; an indent as a share of the width is none; in a table sized to its text, a cell that doesn't wrap as wide as its lines, and one fitted to its text as its grid column; the bands of a header of four rows with the first row off start at its first row; an exact row height holds the border above it                                                                                                                                                                                                                       |
| `word-stops-text.ts`           | RF20 to RF32, PB1 to PB8             | PB6a to PB6e: contextual spacing at a table cell's top compares its first paragraph with the paragraph before the table, and at its bottom with the end of the row, which is in the default paragraph style. RF20 to RF23, RF25, RF26, RF28, RF30, PB1 to PB3, PB5b, PB5c, PB5e, PB7b and PB8: the room of emphasis marks, run borders' widths, lengths' minus signs, two lines in one, boxes of paragraph borders with between borders and across page breaks, a section's empty last paragraph, indents in characters, multiple spacing below evened-out columns, and a line of only a picture |
| `word-stops-table-borders.ts`  | TB1 to TB7                           | TB1 to TB7: borders that meet take the heavier's room, by Word's weights, and cells' own borders take room beside space between cells; PB4 of `word-stops-text`: paragraph borders' widths. And `word-stops-table-borders2.ts`, below                                                                                                                                                                                                                                                                                                                                                            |
| `word-stops-table-borders2.ts` | BT1 to BT6                           | BT1 to BT6: a cell's text kept from its own border where two meet, whichever Word draws; art borders as many points as their size above and below; paragraph borders of no width and space in five bits; rows' own space and borders; space of the type auto is none; the last row and header rows of a table with space between its cells across pages. BT1g, an art border beside a cell's text, and BT5c, a row's space as a share, still stop                                                                                                                                                |
| `word-stops-floats.ts`         | FT1 to FT8, FR1 to FR6, HR1          | HR1a to HR1h: a table's header rows go on to the next page with the row after them when none of it goes below them, and stay with as many of its lines as fit                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `word-stops-floats2.ts`        | TX1 to FB1                           | TX1: a text box's text has its width less its insets and outline; PV1: inside or outside down the page is half the header's or footer's distance from the page's edge; CO1: no anchor across the page is the column; NR1: a table that may not overlap goes left with no room right; NR2: rooms of 17 and 17.5 points take no text; KP1: a kept heading moves on with its picture, leaving a floating table; TF1 to TF3: a float stays before a table that moves on, breaks with header rows again, and borders between rows only give its rows' room; EN1, FN1, FB1: notes, footnotes, frames   |
| `word-stops-vml.ts`            | VM20 to VM30, in 9 documents         | VM20: a pixel drawn 33 points square at any size of 33 or more (not followed); VM21: objects at their size; VM22: a header's line as the body's; VM23, VM24: an outline's weight in the line, half each side beside it in whole points; VM25, VM26: boxes of their own height, insets or outline, a footnote in one left out, a list from 1; VM27, VM28: tight and through as square, 1 point nearer on the right, left and top as margins, a share of the margins, inside and outside margins, past the page's edge moved back; VM29: no unit as pixels, no size as 50 points, a group its size |
| `word-stops-tabs.ts`           | TA1 to TA8, SH10 to SH15, JU1 to JU3 | TA8a to TA8h: a left tab stop past the end of the line takes a line of its own, and the text after it goes on the next, with a first line or hanging indent too (TA1a, TA1b). TA3, TA4, TA6, TA7, SH10 to SH13 and JU1 to JU3: right, centred and decimal stops past the end of the line and the right indent, decimal stops after a number, tabs in a border, soft hyphens in justified and bordered lines, and how far Word squeezes a line                                                                                                                                                    |
| `word-stops-vertical-cells.ts` | TV1 to TV6, VC1 to VC5               | TV1 to TV6: a column of text running up or down is about a line of each paragraph wide, in Calibri; TV5d: a table in it stops the layout, and a layout that guesses lays it out. VC1 to VC5 (`word-stops-vertical-cells2.ts`): in Calibri 1.25 times its size, in Times New Roman, Arial, Cambria and Courier New a line across, and 7 twips more, empty paragraphs none; a row of only it a line of its last mark, beside other cells nothing                                                                                                                                                   |
| `word-stops-equations.ts`      | EQ10 to EQ28, EQS1, EQS2             | EQ10 to EQ28: equations Word builds up by Cambria Math's maths table, in a line of text and displayed, each character as wide as the font has it, an integral with its italic correction (EQ27k); EQS1 and EQS2: the maths settings                                                                                                                                                                                                                                                                                                                                                              |
| `word-stops-font-widths.ts`    | W, S, B, H                           | W, S: each of Office's 16 other fonts as wide as Word's own file of it; an italic Word slants as wide as upright. `STOPS_ITALIC=1` writes the italics. Read with `../word-character-widths.py`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `word-stops-font-kerning.ts`   | I, K, L, P, R, SP                    | K, L, P: kerned as each font's file kerns it; with ligatures, only where its GPOS table kerns Latin. `STOPS_SET=2` writes the second half. Read with `../word-kerning.py`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `word-stops-kerning.ts`        | KE1 to KE8, FH1 to FH16              | FH1 to FH16 (`word-stops-font-heights`): each of the 16 fonts' lines as tall as its file's hhea table makes it. Read with `word-font-heights.py`. KE3, KE6a, KE7b, KE7d, KE7f: ligatures beside a Latin letter outside Windows-1252, a kerned word longer than its line broken where its kerned letters fit, and tabular figures as wide as the font's own                                                                                                                                                                                                                                       |
| `word-stops-notes.ts`          | NT2 to NT16, NE1 to NE3              | NT13a to NT13c: a footnote's paragraph borders and automatic spacing take room as in the text, its last paragraph's space after at the foot of the page; NT14a to NT15: footnotes numbered on each page and from a later section's number, put below the text, and with a mark of their own; NT7, NT10b, NT2b, NE1, NE2, NE3                                                                                                                                                                                                                                                                     |
| `word-stops-numbers.ts`        | NF2 to NF4, LI1 to LI12, NF6         | NF2, NF3: page references in CardText, DollarText, OrdText and Hex, and pictures with a space for each `#` or `x` with no digit, decimals and text in quotes; LI1 to LI12, NF6 (`word-stops-lists`, `-list-definitions`, `-picture-bullets`): levels Word leaves out, centred numbers with their space, numbers' marks, raise and ascent at multiple spacing, tabs after right-aligned ones, lines of only a number, no automatic spacing between a list's levels, Thai words                                                                                                                    |
| `word-stops-marks.ts`          | HD1 to HD10, TR1 to TR11             | HD1 to HD10 (`word-stops-hidden`, `-hidden-edges`): paragraphs joined by a hidden mark in the first one's indents, tabs and borders, spaced line by line, across a control's end, sized as one; hidden notes laid out and counted. TR1 to TR11 (`word-stops-tracked`, `-tracked-edges`, `-moves`, in balloons, the page scaled 0.7422): deleted room counts in columns' widths, deleted endnotes and moves are counted, deleted section breaks leave theirs to the next                                                                                                                          |
| `word-stops-compat-mode.ts`    | CM1 to CM22, in modes 15 to 11       | Word 2010 and before laid out all but a few alike: justified lines not squeezed (CM1), a table's text at its indent, one sized to its text with its cells' margins beside the room (CM4)                                                                                                                                                                                                                                                                                                                                                                                                         |
| `word-stops-pages.ts`          | CO1, CO2, GT1, DV1, TB10, BK1, TO1   | CO1, CO2: kept paragraphs in 3 columns as in 2; GT1: a gutter at the top below a negative margin; DV1b: a row in a division as tall; TO1: two pages to a sheet as the section's                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `word-stops-compat2.ts`        | CN, ST6 to ST12, BK2, DV2, FE2       | CN: modes 14 and 12 as 15 but tabs past the end at their stops, the line past the margin (CN5), no ligatures (CN2b), tables in a cell as in 15 (CN8d), floating ones' text at their place (CN9), in 12 East Asian text broken only at spaces (CN10), a text box's outline no room (CN11); ST6 to ST12: at least X leaves out X less 9.6 points, multiple spacing, cells and a border as they are; BK2: a booklet's pages as the section's; DV2: divisions' margins and borders as paragraphs'; FE2: useFELayout as without it but East Asian text beside Latin                                   |
| `word-stops-east-asian.ts`     | GR1 to GR13, VD1 to VD13, EA1 to EA3 | GR1 to GR12: notes, spaced and kerned text, marks, tabs, pictures, long words and columns on grids; VD1 to VD13: text down the page with tabs, borders, notes, gutters, grids; EA1 to EA3: no change in text of no language                                                                                                                                                                                                                                                                                                                                                                      |
| `word-stops-east-asian2.ts`    | GR14 to GR16, EA4                    | GR14a to GR14f: indents of part of a cell rounded up to the next, a hanging indent's other lines that many cells more; GR16a to GR16f: soft hyphens, distributed lines, right and centred tabs, emphasis marks at least a height, kerning and pictures on grids; GR15a, GR15c: endnotes on the last section's grid; EA4a to EA4c: the strict rules keep small kana from the start of a line, and compressed punctuation is left as it is aligned left                                                                                                                                            |
| `word-stops-imported.ts`       | IM1 to IM3                           | IM2a to IM2d: kept formatting keeps its own paragraph and character styles but takes the document's table styles and theme, its last paragraph without space after; IM3: no font or size in its defaults is Times New Roman 10                                                                                                                                                                                                                                                                                                                                                                   |
| `word-stops-more-widths.ts`    | W                                    | W: Hebrew, Thai, Arabic-Indic and Devanagari digits, box drawing, shapes, symbols and dingbats as wide as the font, or another Word draws them in, whose ascent and descent the line takes, in the five fonts, plain, bold and italic (`word-stops-more-italic-widths`), and Office's other fonts, plain and bold (`word-stops-more-widths-office`). Read by `word-stops-more-widths.py`                                                                                                                                                                                                         |
| `word-stops-arabic.ts`         | AR1, AR2                             | AR1, AR2: Arabic's letters in each form Word joins them in as wide as their glyphs in Arial, Times New Roman, Cambria (drawn in Times New Roman) and Courier New, and a line of right-to-left words with room for the space after its last. Read with `word-stops-arabic.py`                                                                                                                                                                                                                                                                                                                     |
| `word-stops-office-fonts.ts`   | MB1 to MB4, FB1, FB2, KL1, KL2, DS   | MB1 to MB3: the bold Word makes itself 20 thousandths of an em wider a glyph at any size, kerned as the regular, as tall; FB1, FB2: a letter a font lacks drawn in the same font whatever the language, the line as tall as that font; KL1: text with ligatures not kerned in a font kerned by its kern table alone; DS: hhea descents. Read by `word-stops-office-fonts.py`                                                                                                                                                                                                                     |
| `word-stops-text2.ts`          | RF24 to KE9                          | RF27d to RF27g: sizes in any unit at whole half-points, rounded down; PB5f, PB5g: a hanging indent in twips from a left indent in characters; PB3c to PB3e, PB7e; SH16, SH17: a part goes on when its hyphen fits, and a shorter part as it is rather than a longer squeezed; JU4; TA10, TA11: stops past the end with any indents, a word taking its tab on; KE9a: no kerning across a soft hyphen; RF24c, RF24d, RF32b: borders' room; RF29b to RF29d: fitted text. Not RF31b to RF31d                                                                                                         |

`word-stops-thai-and-compat.ts` writes `word-stops-top-spacing` (ST1 to ST5), whose PDF showed `suppressTopSpacing`
leaving all but 9.6 points above the text of the first line of a page or column at exact and at-least spacing, and
`word-stops-fe-layout` (FE1), whose PDF showed `useFELayout` leaving Latin paragraphs as they are, both followed, and
`word-stops-thai` (TH1 to TH3), whose PDF showed Thai justified for it breaking as justified Thai (TH1d, TH1e), and lines
of Thai in Calibri as tall as Tahoma's, which Word draws them in, also followed.

`word-stops-text2.ts` has the cases around what `word-stops-text`, `-tabs` and `-kerning` settled (RF24, RF27, RF29,
RF31, RF32, PB3, PB5, PB7, SH16, SH17, JU4, TA10, TA11 and KE9), whose PDF, saved from Word in round 25, is followed as
the table says, but for RF31b to RF31d, phonetic guides, whose line heights don't follow from their raise and sizes yet.
`word-stops-text3.ts` has what it left stopping, for the next batch Word saves: phonetic guides of other raises and sizes
(RF31e to RF31l), a picture, tabs in a row and a word with soft hyphens that don't fit after a tab, a list's number's tab,
stops past the end with a right indent, and past the right indent in a distributed line (TA12d to TA12l), a soft hyphen's
longer part squeezed against a shorter one with twice the room, kerned before its hyphen, and with ligatures across it
(SH18), en spaces beside ordinary ones within a quarter of theirs (JU5), run borders and pictures in borders (RF24e to
RF24g, RF32c, RF32d), fitted text wider than its line or of two sizes (RF29e, RF29f), and a grid's room above footnotes
(PB7h to PB7j); TA12a to TA12c check that a word that doesn't fit after a tab to a default, right or centred stop takes the
tab on to the next line, as docx/layout lays it out. It has no PDF from Word yet.

`word-stops-edges.ts` has the cases around those of the table, where docx/layout still stops (DH2, PB9, HR2 and TA9),
for the next batch Word saves: it has no PDF from Word yet. Nor have `word-stops-compat2.ts`'s `word-stops-top-spacing3`
(ST13 to ST15) and `word-stops-booklet3` (BK3), which round 25 left out, and `word-stops-compat3.ts` has what the
compatibility modes, `suppressTopSpacing`, `useFELayout` and HTML divisions still leave stopping (CN12 to CN18, ST16, DV3
and FE3), for the next batch too. `word-stops-equations.py` reads the equations' widths and heights from Word's PDFs, and
`word-equation-characters.py` EQ27's width of each character, which Cambria Math's own widths in
`src/layout/cambria-math.ts`, generated by `scripts/generate-cambria-math.ts`, are. `word-stops-notes2.ts`, the cases
around `word-stops-notes.ts`'s (NT2c to NT21, NE4 to NE7), waits for the next batch too, and `word-stops-numbers.ts` and
`word-stops-marks.ts` now write their list, number format, hidden mark and tracked change probes in smaller documents,
as Word couldn't open the batch's. Word saved those of lists, hidden marks and tracked changes in round 25, committed
here. Word opens `word-stops-page-formats` and `word-stops-page-32768`, but couldn't save either as a PDF, so they have
none. Word lays the tracked changes out with their markup in balloons beside the page, which it scales down by 0.7422
(the tables' borders 9026 twips apart) and moves, so lengths read from them with `word-stops.py` are scaled: divide them
by it. `word-stops-lists2.ts` (`word-stops-lists2`) and `word-stops-marks2.ts` (`word-stops-hidden2`,
`word-stops-tracked2`) have what those left stopping, for the next batch too: LI13 to LI20, HD11 to HD16 and TR12 to
TR17.

`word-stops-equations2.ts` has the equations' cases Word's PDFs left open (EQ30 to EQ45), in
`word-stops-equations2`, `word-stops-equation-limits`, `word-stops-equation-small` and `word-stops-equation-spacing`,
whose PDFs Word saved in round 25. Read them with `word-stops-equations.py`, as its own: they showed scripts' sizes
rounded down to the half point (EQ30), Word's sizes of roots' signs, brackets, accents and braces, and where it puts
them (EQ31 to EQ37), its spacing of symbols and operators (EQ32, EQ39), bold digits (EQ45), and the maths settings
followed (EQ42 to EQ44). Equations too long for their line (EQ40) and normal text (EQ41) still stop.
`word-stops-equations3.ts` has the cases around those, for the next batch: roots, brackets, accents and braces whose
size Word's PDFs leave between two (EQ46 to EQ49), superscripts in lower limits (EQ50), fractions, sums and functions
beside brackets (EQ51), symbols not yet seen beside letters (EQ52), a sum in a script's script (EQ53), equation arrays
lined up otherwise (EQ54), boxes with a side hidden, phantoms that take less room and pre-scripts (EQ55), in
`word-stops-equations3`, and small fractions with displayed equations' defaults on (EQ56), in
`word-stops-equation-small2`. They have no PDF from Word yet.

`word-stops-tables3.ts` has what the round-25 table probes left open, for the next batch too: long words across cells
merged across columns of a table narrowed to the page (LW9), the text of the cell before two borders of different styles
that meet (BT7), thick outer borders of a table sized to its text (BT8), the border above a row of an exact height with
space between cells, a thick border, or both (TS16), and the text of a cell merged down rows where the page breaks between
them with room for more than a line of it (RW21).

`word-stops-east-asian2.ts` has what `word-stops-east-asian.ts` left stopping: indents of part of a character on a grid
that snaps to characters (GR14), the cases around GR3, GR5, GR7, GR8 and GR10 on grids (GR16), which change of grid or
direction sends endnotes to the end of their own section (GR15), and the strict rules and compression in text in Japanese
(EA4). Its PDFs, from the final batch, round 25, showed what the table says, and that a change of direction, but not of
grid, ends endnotes with their own section (GR15b), which isn't followed yet. `word-stops-east-asian3.ts` has what they
and `word-stops-arabic.ts` left open, for a later batch: each character the strict rules may keep from the start of a
line, in Japanese, Chinese and Korean, and with the document's own list (EA5), compressed punctuation justified and in
other fonts and languages (EA6), indents of part of a character Word's PDFs didn't round (GR17), lines that end between
right-to-left and left-to-right text, in Hebrew and in a right-to-left paragraph (AR3), and endnotes after text that runs
down the page (GR15d, GR15e). `word-stops-arabic.ts` has the widths of
Arabic's letters in each form Word joins them in (AR1), which `word-stops-more-widths` and `word-stops-thai` TH3b, ten of
each letter in a row, showed joined, and lines of Arabic prose to check them by (AR2). Word kerns Arabic's letters side
by side, by pairs, in Arial and Times New Roman (as ten joined copies of a letter in `word-stops-more-widths` show) and in
Calibri, which isn't followed yet: `word-stops-arabic2.ts` writes every pair of the letters, for a later batch
(`word-stops-arabic-kerning`, AR4). Read Word's PDF of it with `word-stops-arabic.py`, which
reads `word-stops-arabic.json`, and `scripts/generate-arabic-widths.ts` writes `src/text-layout/arabic-widths.ts` from
what it reads. `word-stops-more-widths.ts` writes
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

`python3 ../../scripts/layout-probes/stops2/word-stops-shapes.py <name>.pdf [--text]`, from the same folder, prints the images and
paths a PDF draws, such as shapes' boxes and tables' borders, in twips from the margins, from the PDF's own content, and with
`--text` where each run of text starts and its baseline. Word 16 for Mac wouldn't open `word-stops-vml-nested.docx`, a text
box in a text box, so it has no PDF and isn't committed here.

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
