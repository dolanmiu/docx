/**
 * Probes of what Word does with footnotes where docx/layout still stops after `word-watertight-stops` (SP1 to SP9), which
 * didn't reach two of the stops it was written for, and left variants of the others open. Each probe starts a page, and
 * each line's text names its probe, so the lines can be found in a PDF saved from Word with pdftotext -bbox-layout, which
 * word-watertight.py reads. Calibri 11, single spaced, no space before or after, on A4 with 1440 margins: 51 lines to a
 * page. Footnotes are in 11 points too, so a footnote's line is as tall as a body line, and the separator takes a line.
 * "fill" lines are one-line paragraphs; a probe named with a number has its reference on that line.
 *
 * FN1: a footnote in the second of 2 columns that fits below its reference, until the first column is laid out again
 *      above it, which moves the reference on to the next page (SP9 had its reference too low to fit at all)
 * FN2: a footnote in a section that starts in the next column, needing more room than the first column leaves below
 *      its 48 lines (SP8's 45 lines left enough)
 * FN3: a footnote of 120 lines in a section of 2 columns, longer than a page's columns
 * FN4: a footnote of 12 lines from line 48 at a section's end, before a section on a new page numbered from 1: whether its
 *      10 lines that don't fit go on a page of their own, as SP2's rest longer than a page did
 * FN5: a footnote of 120 lines at a section's end, before a continuous section
 * FN6: a line at a page's top whose footnote is 55 lines kept together, as SP5, with 70 lines after it
 * FN7: the same from line 21 of a page
 * FN8: the same with a footnote of 2 lines from a line below it on the page
 * FN9: a footnote of a line, 4 lines kept together and 2 lines, with room for 3 of its lines
 * FN10: a footnote of a line, a line kept with the next and 4 lines, with room for 2
 * FN11: a footnote of a line and a table of a 6-line row and a 1-line row, with room for 4 of its lines
 * FN12: a footnote of a line and a table of a header row and 4 rows, with room for the line and the header row
 * FN13: a line kept with a table, whose 8-line footnote doesn't fit with it and the table's first row, as SP4 with a table
 * FN14: footnotes from a section of 2 columns and a continuous section of 3 on one page
 * FN15: footnotes from a section of 2 columns and a continuous section of one on one page
 *
 * Word (word-watertight-notes.pdf, Word 16 for Mac): FN1's reference moves to the next page, and the page is as it was
 * without the footnote, 51 and 46 lines. FN2's footnote goes 2 and 2 below the first column's 48 lines, and 3 and 3 on a
 * page of its own; FN3's 44 and 44, as much as leaves its reference on the page once the first column is laid out again
 * with 6 lines, and 16 and 16 below the text on the next. The rests of FN4 and FN5 have pages of their own, and the next
 * section, continuous too, starts on the page after. FN6's text goes on below the footnote's page, above its end; FN7's
 * reference moves to the next page; FN8's second footnote goes below the end of the first. FN9 and FN10 break before the
 * kept paragraph and the one kept with the next; FN11's row breaks 3 and 3; FN12's table goes on the next page whole. FN13's
 * footnote goes below the table's first row. FN14's and FN15's footnotes are in the first section's 2 columns
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    BorderStyle,
    Document,
    FootnoteReferenceRun,
    type ISectionOptions,
    Packer,
    PageNumber,
    Paragraph,
    SectionType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
} from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
type Child = Paragraph | Table;

const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number, from = 1): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${from + i}`));
/** One paragraph of lines split by line breaks, each "<probe> <word> <n>" */
const lines = (probe: string, count: number, options: Options = {}, word = "line"): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from(
            { length: count },
            (_, i) => new TextRun({ text: `${probe} ${word} ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) }),
        ),
    });

let footnoteId = 0;
const footnotes: Record<number, { children: Paragraph[] }> = {};
const footnote = (...children: Child[]): FootnoteReferenceRun => {
    footnoteId++;
    // A footnote can have a table in it, though the option's type only names paragraphs
    footnotes[footnoteId] = { children: children as Paragraph[] };
    return new FootnoteReferenceRun(footnoteId);
};
const withNote = (text: string, note: FootnoteReferenceRun, options: Options = {}): Paragraph =>
    new Paragraph({ ...options, children: [new TextRun(text), note] });

const TWO = { count: 2, space: 720 };
const THREE = { count: 3, space: 720 };

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

/** A table across the page of one column, with no cell margins, of rows of paragraphs, the first a header row if asked */
const table = (rows: readonly Paragraph[], header = false): Table =>
    new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [9026],
        borders,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: rows.map(
            (paragraph, row) =>
                new TableRow({
                    tableHeader: header && row === 0,
                    children: [new TableCell({ width: { size: 9026, type: WidthType.DXA }, children: [paragraph] })],
                }),
        ),
    });

/** Lines with the page's number and its section's number of pages: "<probe> <n> page <PAGE> of <SECTIONPAGES>" */
const numbered = (probe: string, count: number): Paragraph[] =>
    Array.from(
        { length: count },
        (_, i) =>
            new Paragraph({
                children: [
                    new TextRun({ children: [`${probe} ${i + 1} page `, PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES_IN_SECTION] }),
                ],
            }),
    );

const sections: ISectionOptions[] = [
    // FN1: 51 lines in the first column and 46 in the second, then a 3-line note from the second's line 47, which fits
    // below it as the note takes 2 lines of each column. Then the first column has room for 48, which puts 49 above it
    {
        properties: { column: TWO },
        children: [...fill("FN1", 97), withNote("FN1 ref", footnote(lines("FN1 note", 3))), ...fill("FN1 after", 10)],
    },

    // FN2: 48 lines in the first column, then a section that starts in the second, with a 10-line note from its first line,
    // which takes 6 lines of each column with its separator, where the first leaves 3
    { properties: { column: TWO }, children: fill("FN2 first", 48) },
    {
        properties: { type: SectionType.NEXT_COLUMN, column: TWO },
        children: [withNote("FN2 next ref", footnote(lines("FN2 note", 10))), ...fill("FN2 next", 5)],
    },

    // FN3: a 120-line note from line 11 of the first of 2 columns
    {
        properties: { column: TWO },
        children: [...fill("FN3", 10), withNote("FN3 ref", footnote(lines("FN3 note", 120))), ...fill("FN3 after", 60)],
    },

    // FN4: a 12-line note from line 48 of a section's last page, then a section on a new page numbered from 1
    { children: [...fill("FN4", 47), withNote("FN4 ref", footnote(lines("FN4 note", 12)))] },
    { properties: { page: { pageNumbers: { start: 1 } } }, children: numbered("FN4 next", 10) },

    // FN5: a 120-line note from line 6, then a continuous section
    { children: [...fill("FN5", 5), withNote("FN5 ref", footnote(lines("FN5 note", 120)))] },
    { properties: { type: SectionType.CONTINUOUS }, children: numbered("FN5 next", 10) },

    // FN6: a line at the top of a page whose note is a 55-line paragraph kept together, then 70 lines
    { children: [withNote("FN6 ref", footnote(lines("FN6 note", 55, { keepLines: true }))), ...fill("FN6 after", 70)] },

    // FN7: the same from line 21, then 10 lines
    { children: [...fill("FN7", 20), withNote("FN7 ref", footnote(lines("FN7 note", 55, { keepLines: true }))), ...fill("FN7 after", 10)] },

    // FN8: as FN6, with a 2-line note from line 7, then 5 lines
    {
        children: [
            withNote("FN8 ref", footnote(lines("FN8 note", 55, { keepLines: true }))),
            ...fill("FN8", 5),
            withNote("FN8 second ref", footnote(lines("FN8 second note", 2))),
            ...fill("FN8 after", 5),
        ],
    },

    // FN9: room for 3 note lines below line 47, and a note of a line, 4 lines kept together and 2 lines
    {
        children: [
            ...fill("FN9", 46),
            withNote("FN9 ref", footnote(line("FN9 head"), lines("FN9 kept", 4, { keepLines: true }), lines("FN9 note", 2))),
            ...fill("FN9 after", 20),
        ],
    },

    // FN10: room for 2 below line 48, and a note of a line, a line kept with the next and 4 lines
    {
        children: [
            ...fill("FN10", 47),
            withNote("FN10 ref", footnote(line("FN10 head"), line("FN10 kept", { keepNext: true }), lines("FN10 note", 4))),
            ...fill("FN10 after", 20),
        ],
    },

    // FN11: room for 4 below line 46, and a note of a line and a table of a 6-line row and a 1-line row
    {
        children: [
            ...fill("FN11", 45),
            withNote("FN11 ref", footnote(line("FN11 head"), table([lines("FN11 row 1", 6), line("FN11 row 2")]))),
            ...fill("FN11 after", 20),
        ],
    },

    // FN12: room for 2 below line 48, and a note of a line and a table of a header row and 4 rows
    {
        children: [
            ...fill("FN12", 47),
            withNote(
                "FN12 ref",
                footnote(line("FN12 head"), table([line("FN12 header"), ...[1, 2, 3, 4].map((row) => line(`FN12 row ${row}`))], true)),
            ),
            ...fill("FN12 after", 20),
        ],
    },

    // FN13: a line kept with the next on line 45, with an 8-line note, then a table of 6 one-line rows
    {
        children: [
            ...fill("FN13", 44),
            withNote("FN13 kept", footnote(lines("FN13 note", 8)), { keepNext: true }),
            table([1, 2, 3, 4, 5, 6].map((row) => line(`FN13 row ${row}`))),
            ...fill("FN13 after", 20),
        ],
    },

    // FN14: a section of 2 columns with a 2-line note from line 7 of 10, then a continuous one of 3 columns with a 2-line
    // note from line 4 of 9, then one of one column
    {
        properties: { column: TWO },
        children: [...fill("FN14 two", 6), withNote("FN14 two ref", footnote(lines("FN14 two note", 2))), ...fill("FN14 two after", 3)],
    },
    {
        properties: { type: SectionType.CONTINUOUS, column: THREE },
        children: [
            ...fill("FN14 three", 3),
            withNote("FN14 three ref", footnote(lines("FN14 three note", 2))),
            ...fill("FN14 three after", 5),
        ],
    },
    { properties: { type: SectionType.CONTINUOUS }, children: fill("FN14 end", 5) },

    // FN15: a section of 2 columns with a 2-line note from line 7 of 10, then a continuous one of one column with a 2-line
    // note from line 3 of 5
    {
        properties: { column: TWO },
        children: [...fill("FN15 two", 6), withNote("FN15 two ref", footnote(lines("FN15 two note", 2))), ...fill("FN15 two after", 3)],
    },
    {
        properties: { type: SectionType.CONTINUOUS },
        children: [...fill("FN15 one", 2), withNote("FN15 one ref", footnote(lines("FN15 one note", 2))), ...fill("FN15 one after", 2)],
    },
];

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } },
        paragraphStyles: [
            { id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
        ],
    },
    footnotes,
    sections,
});

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync("build/word-probes/word-watertight-notes.docx", await Packer.toBuffer(doc));
};

void main();
