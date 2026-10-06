# The stops batch (lay-stops2)

<!-- cspell:ignore pdftocairo Poppler poppler hhea GPOS tatweel tatweels -->

Probe documents for the stops of docx/layout that no Word PDF saved before 2026-10-04 settled, made in one batch from
docx at `master` a871df8a25 and saved from Word 16 for Mac on 2026-10-04, 2026-10-05 and 2026-10-06 (Save As, PDF,
Best for printing, No to updating fields). Each script's header says what each of its probes is and which stop it settles. Those
committed here are the ones a change to docx/layout has followed, with Word's PDF of each beside its `.docx`:

| Script                         | Probes                               | What Word showed, followed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `word-stops-long-words.ts`     | LW1 to LW5                           | LW1 to LW5: columns share the room in proportion to their longest words; long words beside space between cells widen their columns. And `word-stops-long-words2.ts`, below                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `word-stops-long-words2.ts`    | LW6 to LW8                           | LW6, LW7: a table of a share of the width that its words don't fit grows to them, up to the page, and shares the page past it as one of all of it; rows that give a column different widths in a table of a share of it, or that start past its first column, are evened out; a table sized to its text or of a share fills it less half of each of its outer borders. LW8: a long word across cells merged across columns of a table narrowed to the page still stops                                                                                                                           |
| `word-stops-drawings.ts`       | DR1 to DR16, DH1                     | DH1a to DH1e: a header's or footer's picture that text wraps around, placed against the page, is one the body's text goes round, on both sides, one side, or above and below it, in the first page's header too                                                                                                                                                                                                                                                                                                                                                                                  |
| `word-stops-tables.ts`         | RW1 to RW12, TS1 to TS9              | RW1 to RW12: merged text, nested tables, rows taller than a page; NT11 of `word-stops-notes`: rows cut for footnotes; TS1 to TS9: table styles' rows and cells. And `word-stops-rows2.ts`, `word-stops-tables2.ts`, below                                                                                                                                                                                                                                                                                                                                                                        |
| `word-stops-rows2.ts`          | RW13 to RW20                         | RW13 to RW16, RW18 to RW20: merged text goes on page by page, across a page break between its rows, and in and out of rows taller than a page; a cut row's footnotes go to the next page; a header row taller than a page isn't repeated, and what follows its table goes a page on; rows taller than a column go down first columns. RW17, a footnote in a row at least as tall as a page with text taller too, still stops                                                                                                                                                                     |
| `word-stops-tables2.ts`        | TS10 to TS15                         | TS10 to TS15: a table style's rows kept whole, its own or a part's; an indent as a share of the width is none; in a table sized to its text, a cell that doesn't wrap as wide as its lines, and one fitted to its text as its grid column; the bands of a header of four rows with the first row off start at its first row; an exact row height holds the border above it                                                                                                                                                                                                                       |
| `word-stops-tables3.ts`        | LW9, BT7, BT8, TS16, RW21            | BT7a to BT7c: the cell before two borders that meet keeps its text from the border Word draws; BT8a, BT8b: half of each outer border of 3 and 6 points inside the room, as of half a point; TS16a: an exact row's own space between cells and its cells' borders inside its height, the table's edge outside; TS16b: a border of 3 points above an exact row inside it; RW21: a merged cell's text breaks between its rows as a paragraph's lines do; LW9a to LW9f: Word's columns, not yet followed                                                                                             |
| `word-stops-text.ts`           | RF20 to RF32, PB1 to PB8             | PB6a to PB6e: contextual spacing at a table cell's top compares its first paragraph with the paragraph before the table, and at its bottom with the end of the row, which is in the default paragraph style. RF20 to RF23, RF25, RF26, RF28, RF30, PB1 to PB3, PB5b, PB5c, PB5e, PB7b and PB8: the room of emphasis marks, run borders' widths, lengths' minus signs, two lines in one, boxes of paragraph borders with between borders and across page breaks, a section's empty last paragraph, indents in characters, multiple spacing below evened-out columns, and a line of only a picture |
| `word-stops-table-borders.ts`  | TB1 to TB7                           | TB1 to TB7: borders that meet take the heavier's room, by Word's weights, and cells' own borders take room beside space between cells; PB4 of `word-stops-text`: paragraph borders' widths. And `word-stops-table-borders2.ts`, below                                                                                                                                                                                                                                                                                                                                                            |
| `word-stops-table-borders2.ts` | BT1 to BT6                           | BT1 to BT6: a cell's text kept from its own border where two meet, whichever Word draws; art borders as many points as their size above and below; paragraph borders of no width and space in five bits; rows' own space and borders; space of the type auto is none; the last row and header rows of a table with space between its cells across pages. BT1g, an art border beside a cell's text, and BT5c, a row's space as a share, still stop                                                                                                                                                |
| `word-stops-floats.ts`         | FT1 to FT8, FR1 to FR6, HR1          | HR1a to HR1h: a table's header rows go on to the next page with the row after them when none of it goes below them, and stay with as many of its lines as fit                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `word-stops-floats2.ts`        | TX1 to FB1                           | TX1: a text box's text has its width less its insets and outline; PV1: inside or outside down the page is half the header's or footer's distance from the page's edge; CO1: no anchor across the page is the column; NR1: a table that may not overlap goes left with no room right; NR2: rooms of 17 and 17.5 points take no text; KP1: a kept heading moves on with its picture, leaving a floating table; TF1 to TF3: a float stays before a table that moves on, breaks with header rows again, and borders between rows only give its rows' room; EN1, FN1, FB1: notes, footnotes, frames   |
| `word-stops-vml.ts`            | VM20 to VM30, in 9 documents         | VM30: pictures at their shapes' sizes; VM20: a pixel 33 points at most; VM21: objects at their size; VM22: a header's line as the body's; VM23, VM24: an outline's weight in the line, half each side beside it in whole points; VM25, VM26: boxes of their own height, insets or outline, a footnote in one left out, a list from 1; VM27, VM28: tight and through as square, 1 point nearer on the right, left and top as margins, a share of the margins, inside and outside margins, past the page's edge moved back; VM29: no unit as pixels, no size as 50 points, a group its size        |
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
| `word-stops-compat2.ts`        | CN, ST6 to ST15, BK2, BK3, DV2, FE2  | CN: modes 14 and 12 as 15 but tabs past the end at their stops, the line past the margin (CN5), no ligatures (CN2b), tables in a cell as in 15 (CN8d), floating ones' text at their place (CN9), in 12 East Asian text broken only at spaces (CN10), a text box's outline no room (CN11); ST6 to ST15: at least X leaves out X less 9.6 points, in Calibri 20 below a header too, other spacing, cells, borders as they are; BK2, BK3: a booklet's pages as the section's, folded either way; DV2: divisions' margins and borders as paragraphs'; FE2: useFELayout spaces East Asian from Latin  |
| `word-stops-compat3.ts`        | CN12 to CN18, ST16, DV3, FE3         | CN12: a share of the width is of the text and two margins; CN13: gaps of 1250 or less beside a frame empty, pictures' as in 15; CN14: text after a tab on the line to 22 inches; CN15: floating tables sized to text shifted as CN9, centred as in 15; CN16: widened to the room and margins, rows evened; CN17: in 12 East Asian text in its language as in none; CN18: in 12 a shape's outline no room; ST16: 0.8 lines and a bordered later line as they are; DV3: a division's box drawn once, later paragraphs with margins and side borders; FE3: half the font's average character width  |
| `word-stops-east-asian.ts`     | GR1 to GR13, VD1 to VD13, EA1 to EA3 | GR1 to GR12: notes, spaced and kerned text, marks, tabs, pictures, long words and columns on grids; VD1 to VD13: text down the page with tabs, borders, notes, gutters, grids; EA1 to EA3: no change in text of no language                                                                                                                                                                                                                                                                                                                                                                      |
| `word-stops-east-asian2.ts`    | GR14 to GR16, EA4                    | GR14a to GR14f: indents of part of a cell rounded up to the next, a hanging indent's other lines that many cells more; GR16a to GR16f: soft hyphens, distributed lines, right and centred tabs, emphasis marks at least a height, kerning and pictures on grids; GR15a, GR15c: endnotes on the last section's grid; EA4a to EA4c: the strict rules keep small kana from the start of a line, and compressed punctuation is left as it is aligned left                                                                                                                                            |
| `word-stops-imported.ts`       | IM1 to IM3                           | IM2a to IM2d: kept formatting keeps its own paragraph and character styles but takes the document's table styles and theme, its last paragraph without space after; IM3: no font or size in its defaults is Times New Roman 10                                                                                                                                                                                                                                                                                                                                                                   |
| `word-stops-more-widths.ts`    | W                                    | W: Hebrew, Thai, Arabic-Indic and Devanagari digits, box drawing, shapes, symbols and dingbats as wide as the font, or another Word draws them in, whose ascent and descent the line takes, in the five fonts, plain, bold and italic (`word-stops-more-italic-widths`), and Office's other fonts, plain and bold (`word-stops-more-widths-office`). Read by `word-stops-more-widths.py`                                                                                                                                                                                                         |
| `word-stops-arabic.ts`         | AR1, AR2                             | AR1, AR2: Arabic's letters in each form Word joins them in as wide as their glyphs in Arial, Times New Roman, Cambria (drawn in Times New Roman) and Courier New, and a line of right-to-left words with room for the space after its last. Read with `word-stops-arabic.py`                                                                                                                                                                                                                                                                                                                     |
| `word-stops-office-fonts.ts`   | MB1 to MB4, FB1, FB2, KL1, KL2, DS   | MB1 to MB3: the bold Word makes itself 20 thousandths of an em wider a glyph at any size, kerned as the regular, as tall; FB1, FB2: a letter a font lacks drawn in the same font whatever the language, the line as tall as that font; KL1: text with ligatures not kerned in a font kerned by its kern table alone; DS: hhea descents. Read by `word-stops-office-fonts.py`                                                                                                                                                                                                                     |
| `word-stops-text2.ts`          | RF24 to KE9                          | RF27d to RF27g: sizes in any unit at whole half-points, rounded down; PB5f, PB5g: a hanging indent in twips from a left indent in characters; PB3c to PB3e, PB7e; SH16, SH17: a part goes on when its hyphen fits, and a shorter part as it is rather than a longer squeezed; JU4; TA10, TA11: stops past the end with any indents, a word taking its tab on; KE9a: no kerning across a soft hyphen; RF24c, RF24d, RF32b: borders' room; RF29b to RF29d: fitted text. RF31b to RF31d too                                                                                                         |
| `word-stops-text3.ts`          | RF31e to PB7j                        | RF31e to RF31l: phonetic guides' lines as tall as the guide raised; TA12: a picture or a word after tabs in a row takes the tab on, a word breaks after a list number's tab, centred text ends at the end of the line, stops past the end with a right indent; SH18: the longer part squeezed with twice the room, not distributed, no kerning or ligatures across a soft hyphen; JU5: spaces beside en spaces squeezed; RF24, RF32: shadows and frames of other styles, pictures in borders; RF29: fitted text wider than its line or of two sizes; PB7h to PB7j: a grid's room above footnotes |
| `word-stops-edges.ts`          | DH2a to DH2d, PB9a to PB9f, HR2, TA9 | DH2a to DH2d: a header's picture against its paragraph or line, at the header's top, and against a column of several, from the margin; the header's lines go round it. PB9a, PB9b, PB9d, PB9e: Normal paragraphs leave out contextual space beside cells and rows, and after a table. HR2: header rows go to the next column, and a heading with them. TA9: a left tab past the line in an indented paragraph                                                                                                                                                                                    |
| `word-stops-notes2.ts`         | NT2c to NT21, NE4 to NE7             | NT2c to NT21: a footnote's rest before a continuous section shows its footer; a line or row whose footnote can't go with it stays or goes on, the footnote on the next page, those after it continued past its end; in columns, after one that continues; NT16: footnotes in columns of their own; NT18, NT19: numbering; NT20: below the text; NE4 to NE7: endnotes in columns, own marks, at sections' ends, separators                                                                                                                                                                        |
| `word-stops-east-asian3.ts`    | EA5 to GR15e                         | EA5, EA5L: strict rules keep each small kana and ー from starting a line of Japanese, in place of the document's own list, nothing in Chinese or Korean; EA6a, EA6e: compression leaves justified Japanese and left-aligned Chinese as they are; GR17: indents of part of a cell rounded up line by line; AR3: a space after a right-to-left word takes room beside left-to-right text in a right-to-left run and between right-to-left words in any run; GR15d, GR15e: endnotes after text down the page run down it, and end with their section before a change of direction                   |
| `word-stops-arabic2.ts`        | AR4                                  | AR4: every pair of the 42 letters, joined as initial and final and as medials, in Arial and Times New Roman, plain and bold, as wide as its forms to 8 thousandths of an em: Word doesn't kern them. Calibri's it kerns by pairs of their glyphs, by as much as 268 thousandths, and with the spaces beside them, which still stops. Read with `word-stops-arabic-kerning.py`, and check the layout's forms by it with `word-stops-arabic-kerning.ts`                                                                                                                                            |

`word-stops-thai-and-compat.ts` writes `word-stops-top-spacing` (ST1 to ST5), whose PDF showed `suppressTopSpacing`
leaving all but 9.6 points above the text of the first line of a page or column at exact and at-least spacing, and
`word-stops-fe-layout` (FE1), whose PDF showed `useFELayout` leaving Latin paragraphs as they are, both followed, and
`word-stops-thai` (TH1 to TH3), whose PDF showed Thai justified for it breaking as justified Thai (TH1d, TH1e), and lines
of Thai in Calibri as tall as Tahoma's, which Word draws them in, also followed.

`word-stops-edges.ts` has the cases around those of the table, where docx/layout stopped (DH2, PB9, HR2 and TA9), saved
from Word in the batch of 2026-10-05 (round 25). Its sections after DH2d have DH2d's header, with its picture, as they
have none of their own: PB9c's table, below a paragraph beside the picture, went below it, which leaves contextual spacing
before a table open, and so did HR2b's, which moved with its heading all the same.

`word-stops-run-fonts.ts` writes `word-stops-run-fonts` (HA1 to HA3: which of a run's fonts Word draws characters past
ASCII in, with the hint for East Asian text, in runs given a high ANSI font alone or other than their font for ASCII, and
for the scripts the run-font rules leave out) and `word-stops-float-distance` (FD1: text beside a floating table 0 to 15
twips from it), saved from Word in the batch of 2026-10-06 (round 26) and followed: with the hint, Word drew curly
quotes and parentheses in SimSun beside Chinese (HA1a), an ellipsis, dashes, a degree sign, a multiplication sign and a
section sign in MS Mincho beside Japanese (HA1b), and curly quotes and dashes in MS Mincho in English with no East Asian
character in the run (HA1c), each a full width but the em dash, half a width, where the control without the hint has
them in Calibri (HA1d); accented letters in Arial, the high ANSI font given alone or beside Courier New (HA2a, HA2b);
Greek symbols past U+03CF, Cyrillic Supplement letters and a dash of the Supplemental Punctuation block, which the rules
leave out, in Arial, the high ANSI font, where the control has them in Courier New, and Thai, Devanagari, Armenian,
Georgian, Braille and the rest in the fonts it falls back on, the same from either (HA3a); and Hebrew and Arabic in
Courier New, the font for ASCII (HA3b). The text beside the table starts at 5019 twips with 0, 1, 5, 9 and 10 twips from
it and at 5024 with 15, and the justified lines left of it end at 1990 and 1985: at least half a point from it (FD1a to
FD1f).

`word-stops-text2.ts` has the cases around what `word-stops-text`, `-tabs` and `-kerning` settled (RF24, RF27, RF29,
RF31, RF32, PB3, PB5, PB7, SH16, SH17, JU4, TA10, TA11 and KE9), whose PDF, saved from Word in round 25, is followed as
the table says, RF31b to RF31d, phonetic guides, since `word-stops-text3.ts`'s PDF showed what makes their lines taller.
`word-stops-text3.ts` has what `word-stops-text2` left stopping: phonetic guides of other raises and sizes (RF31e to
RF31l), a picture, tabs in a row and a word with soft hyphens that don't fit after a tab, a list's number's tab, stops
past the end with a right indent, and past the right indent in a distributed line (TA12d to TA12l), a soft hyphen's
longer part squeezed against a shorter one with twice the room, kerned before its hyphen, and with ligatures across it
(SH18), en spaces beside ordinary ones within a quarter of theirs (JU5), run borders and pictures in borders (RF24e to
RF24g, RF32c, RF32d), fitted text wider than its line or of two sizes (RF29e, RF29f), and a grid's room above footnotes
(PB7h to PB7j); TA12a to TA12c check that a word that doesn't fit after a tab to a default, right or centred stop takes
the tab on to the next line, as docx/layout lays it out, and it does, with the text after the centred stop ending at the
end of the line. Its PDF, saved from Word in round 26, is committed here and followed as the table says. In it, a guide
is a line of its own above its base in `word-stops.py`, so the base's line is "not a line of Word's", and the lines after
it are where they are; Word fitted one more "m" of TA12h's 110 on the number's line than docx/layout's widths do, 44
ending at 9022 twips where the 44th ends 1.4 past 9026 in them, with three lines either way.
`word-stops-compat2.ts`'s `word-stops-top-spacing3` (ST13 to ST15) and `word-stops-booklet3` (BK3), which round 25
left out, and `word-stops-compat3.ts`'s probes of what the compatibility modes, `suppressTopSpacing`, `useFELayout` and
HTML divisions left stopping (CN12 to CN18, ST16, DV3 and FE3) were saved in round 26 too and are followed as the table
says. `word-stops-divisions2`'s paragraphs are all in the division of `word-stops-divisions`' DV2a, so DV3b to DV3f showed
how Word lays out a division's paragraphs after its first run, with its margins and side borders but no box, and not the
box's own edges beside spacing, which still stop. `word-stops-compat4.ts` has those, and what else the round left open
(DV4, DV5, CN19 to CN21, FE4), for a later batch; it has no PDF from Word yet.

`word-stops-equations.py` reads the equations' widths and heights from Word's PDFs, and `word-equation-characters.py`
EQ27's width of each character, which Cambria Math's own widths in `src/layout/cambria-math.ts`, generated by
`scripts/generate-cambria-math.ts`, are. `word-stops-notes2.ts`, the cases around `word-stops-notes.ts`'s (NT2c to NT21,
NE4 to NE7), was saved from Word in the batch of 2026-10-05 (round 25), in `word-stops-notes2`, `word-stops-note-numbers`
and the `word-stops-endnotes-*` documents. Its sections after NT2c have NT2c's taller footer, as they have none of their
own, so its pages hold 50 lines: read them with `whole-layout.ts` and `whole-lines.py`, rather than probe by probe.
NT20d's text in 2 columns stayed in the first, as Word doesn't even out the last section's columns at the end of a
document, which leaves footnotes below the text of columns open. `word-stops-numbers.ts` and `word-stops-marks.ts` now
write their list, number format, hidden mark and tracked change probes in smaller documents, as Word couldn't open the
batch's. Word saved those of lists, hidden marks and tracked changes in round 25, committed here. Word opens
`word-stops-page-formats` and `word-stops-page-32768`, but couldn't save either as a PDF, so they have none. Word lays the
tracked changes out with their markup in balloons beside the page, which it scales down by 0.7422 (the tables' borders
9026 twips apart) and moves, so lengths read from them with `word-stops.py` are scaled: divide them by it.
`word-stops-lists2.ts` (`word-stops-lists2`) and `word-stops-marks2.ts` (`word-stops-hidden2`, `word-stops-tracked2`)
have what those left stopping (LI13 to LI20, HD11 to HD16 and TR12 to TR17), saved from Word in round 26, committed here.
They showed a bordered number's box ending at its tab's stop, or after the border's room from the number where that is
further, with a tab or a space (LI13a to LI13d), a paragraph at a left-out level starting the levels below it again
(LI14), a list with a level aligned both numbering its other levels (LI15), the word after a number's tab breaking on the
number's line rather than leaving the number alone (LI16), Word's automatic spacing between lists made from the same
definition (LI17), numbers aligned distribute and with a low kashida to the left, numTab to the right and for Thai in the
centre (LI18a to LI18d), the text after a Word 6 number at the level's indent from the number or after its space from
the number's end, whichever is further (LI19a, LI19b), no picture drawn for picture bullets, with their shape type or of
20 points (LI20a, LI20b), a hidden mark before a content control's first paragraph joined (HD11), a header's and the last
footnote's hidden empty last paragraph taking no room (HD12, HD13), a hidden section break with text shown joined to the
next section's first paragraph before a continuous section alike (HD14a), and one with nothing shown taking no room
before a section on a new page (HD14b), paragraphs of other styles joined, each one's text in its own style's
formatting, with the first's style's space before (HD15a, HD15b), each line spaced as the paragraph it ends in with
exact and at-least spacing and three paragraphs too (HD16a to HD16c), a deleted mark before a content control's first
paragraph joined (TR12), a deleted section break between sections that start differently leaving its section to the
next, start and all (TR13), a deleted section break before a table taking no room (TR14), a list in a deleted row
counted (TR15), a deleted first, last or own-bordered row in a spaced table laid out as without it (TR16a to TR16c), and
the note of a deleted endnote reference with a mark of its own laid out after the kept note's, marked i (TR17), which
isn't followed: the layout stops there. Read `word-stops-tracked2` as round 25's, with its lengths scaled by the balloons.

`word-stops-equations2.ts` has the equations' cases Word's PDFs left open (EQ30 to EQ45), in
`word-stops-equations2`, `word-stops-equation-limits`, `word-stops-equation-small` and `word-stops-equation-spacing`,
whose PDFs Word saved in round 25. Read them with `word-stops-equations.py`, as its own: they showed scripts' sizes
rounded down to the half point (EQ30), Word's sizes of roots' signs, brackets, accents and braces, and where it puts
them (EQ31 to EQ37), its spacing of symbols and operators (EQ32, EQ39), bold digits (EQ45), and the maths settings
followed (EQ42 to EQ44). Equations too long for their line (EQ40) and normal text (EQ41) still stop.
`word-stops-equations3.ts` has the cases around those: roots, brackets, accents and braces whose size Word's PDFs left
between two (EQ46 to EQ49), superscripts in lower limits (EQ50), fractions, sums and functions beside brackets (EQ51),
symbols not yet seen beside letters (EQ52), a sum in a script's script (EQ53), equation arrays lined up otherwise
(EQ54), boxes with a side hidden, phantoms that take less room and pre-scripts (EQ55), in `word-stops-equations3`, and
small fractions with displayed equations' defaults on (EQ56), in `word-stops-equation-small2`, whose PDFs Word saved in
round 26. Read them with `word-stops-equations.py`, as its own: they showed the accent over a letter sized to fit the
letter's width where the font attaches it (EQ48), lower limits cramped (EQ50), TeX's spaces beside brackets and bars
(EQ51), the symbols' classes (EQ52), rows of an equation array without ampersands centred and an alignment mark
(`m:aln`) left as it is (EQ54), boxes struck through as plain, phantoms without their width, ascent or descent, and
pre-scripts with the space after scripts before them (EQ55), and small fractions laid out as without them (EQ56). A
second ampersand in a row (EQ54b), which Word spaces by about 0.7 points for a reason not yet known, still stops.

`word-stops-tables3.ts` has what the round-25 table probes left open: long words across cells merged across columns of a
table narrowed to the page (LW9), the text of the cell before two borders of different styles that meet (BT7), thick outer
borders of a table sized to its text (BT8), the border above a row of an exact height with space between cells, a thick
border, or both (TS16), and the text of a cell merged down rows where the page breaks between them with room for more than
a line of it (RW21). Word saved it in round 26 (2026-10-06), from a `.docx` without TS16c, which the script gained after.
It showed the table's rules, which the layout follows; LW9's columns are Word's for six more cases, which with LW2f to
LW2i and LW8a to LW8d show that Word hands the word's width past the columns' widest words to the columns it is across one
by one, each taking a share of what is left, so the first gets more (the columns alike in LW2f to LW2i, LW8a and LW8b fit
that within 12 twips, equal shares), but no rule tried for the shares of columns that differ fits LW8c, LW8d, LW9a to
LW9f within 45, so the layout still stops there. `word-stops-tables4.ts` has what would settle it, for the next batch:
the same tables with a column of prose beside the merged cells' that none is across, so that how far Word narrows the
columns can be read from it and the raise of each column's widest word follows (LW10a to LW10h), the cell before two
borders that meet of which Word draws the wider, or the next cell's over none, and the cell after a wider drawn border
(BT9a to BT9d), and a row of an exact height with space between cells below a border of 3 points, and as the last row
(TS16c, TS16d). It has no PDF from Word yet.

`word-stops-east-asian2.ts` has what `word-stops-east-asian.ts` left stopping: indents of part of a character on a grid
that snaps to characters (GR14), the cases around GR3, GR5, GR7, GR8 and GR10 on grids (GR16), which change of grid or
direction sends endnotes to the end of their own section (GR15), and the strict rules and compression in text in Japanese
(EA4). Its PDFs, from the final batch, round 25, showed what the table says, and that a change of direction, but not of
grid, ends endnotes with their own section (GR15b), now followed. `word-stops-east-asian3.ts` has what they and
`word-stops-arabic.ts` left open: each character the strict rules may keep from the start of a line, in Japanese, Chinese
and Korean, and with the document's own list (EA5, `word-stops-strict2`, `-strict-list`), compressed punctuation justified
and in other fonts and languages (EA6, `word-stops-compress2`, `-compress-kana2`, whose PDFs are the same but for a byte),
indents of part of a character Word's PDFs didn't round (GR17, `word-stops-grid-indents2`), lines that end between
right-to-left and left-to-right text, in Hebrew and in a right-to-left paragraph (AR3, `word-stops-rtl-ends`), and endnotes
after text that runs down the page (GR15d, GR15e, `word-stops-endnotes-down2`, `-down3`). Their PDFs, saved from Word on
2026-10-06 (round 26), showed what the table says. EA5's half-width small katakana fitted at the ends of their lines, so
whether the strict rules keep them from the start of one is still open, and EA6b showed Word fitting more on the lines of
a distributed paragraph with compression: a full stop or closing bracket at the end of a line took half its width, and a
line 4 twips too long was squeezed on, which isn't followed. `word-stops-east-asian4.ts` has the cases those leave open,
for the next batch (EA7, EA8, GR18, GR15f and VL1), with no PDF from Word yet: the half-width small katakana on a line
they don't fit, the document's own lists beyond the strict list, distributed lines a few twips too long with and without
compression, in Japanese and Chinese, indents a character or more before the margin, endnotes from a section followed by
one that runs as it does before one that runs another way, and lines of Latin text down the page, which Word's PDFs put
278 twips apart in Calibri 11 where across the page they are 268.55 (GR15e, `word-stops-east-asian` VD5), which isn't
followed either. `word-stops-arabic.ts` has the widths of
Arabic's letters in each form Word joins them in (AR1), which `word-stops-more-widths` and `word-stops-thai` TH3b, ten of
each letter in a row, showed joined, and lines of Arabic prose to check them by (AR2). `word-stops-arabic2.ts` writes
every pair of the letters, as a word of the two and between tatweels (`word-stops-arabic-kerning`, AR4), whose PDF, from
round 26, showed Word drawing each as wide as its forms in Arial and Times New Roman: it doesn't kern them, and ten joined
copies of a letter in `word-stops-more-widths` W are as wide as their glyphs too, read again. Calibri's letters it kerns,
by pairs of their glyphs, by as much as 268 thousandths of an em, differently in the two contexts, and with the spaces
beside them, so Calibri's Arabic still stops. Read Word's PDF of it with `word-stops-arabic-kerning.py`, and check the
layout's forms by it with `word-stops-arabic-kerning.ts`. Read `word-stops-arabic`'s with `word-stops-arabic.py`, which
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
box in a text box, so it has no PDF and isn't committed here. `word-stops-vml-pictures2` (VM30a to VM30h, the pictures
as Word writes them, with its shape type, its formulas and `o:spid`), saved from Word in the batch of 2026-10-06 (round
26), showed pictures of 100 by 50 pixels drawn at their shapes' sizes, from 20 to 150 points, and the one-pixel picture
33 points square again, so the first batch's VM20 is the picture's pixels, not VML: a picture is laid out at its shape's
size, 33 points a pixel at most, which a picture of one pixel is drawn at, with no outline, as Word's shape type for
pictures has none. `word-stops-vml-pictures3` (VM31a to VM31h) has what that leaves open, for the next batch: a picture
placed on the page that text flows around, pictures of 2 by 2 and 4 by 4 pixels in shapes past and within 33 points a
pixel, the pixel at 300 and 96 dots to the inch, a picture with an outline of its own, and one with no size.

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
