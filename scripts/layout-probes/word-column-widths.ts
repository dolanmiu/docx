// cspell:ignore bbox
// Probes of how Word lays out a paragraph or a table that goes on into a column of another width, after
// word-rules2.ts's Q7 showed that it breaks each column's lines at the column's width. Each probe starts a section on a
// new page, in 2 columns of 2000 and 6306 twips, or 6306 and 2000, and each paragraph's text starts with its probe's
// name, so the lines can be found in a PDF saved from Word with pdftotext -bbox-layout. Calibri 11, single spaced, no
// space before or after, 51 lines to a column. word-column-widths.py reads the PDF.
//
// R1 to R4: widow control, where the lines left for the next column are broken again at its width. Whether Word counts
// them as they are broken in this column (A), or as they are in the next, moving one line back when only one is left
// there (B), or as many as it takes to leave two there (C):
//
// R1: 47 lines, then a paragraph of 6 narrow lines. Its last 2 go on 1 wide line, and so do its last 3, but not its last 4.
//     A: 4 narrow lines and 1 wide line. B: 3 and 1. C: 2 and 2.
// R2: the same, wide then narrow, with a paragraph of 5 wide lines. Its last goes on 3 narrow lines, and its last 2 on 7.
//     A: 3 wide lines and 7 narrow lines. B and C: 4 and 3.
// R3: 47 lines, then a paragraph of 5 narrow lines. Its last 1, 2 and 3 each go on 1 wide line, and its last 4 on 2.
//     A and B: 3 narrow lines and 1 wide line. C: the paragraph moves to the wide column, on 2 lines.
// R4: R2's paragraph at the bottom of the wide second column, going on in the narrow first column of the next page.
//
// R5 and R6: a table sized to its text that goes on from the narrow column into the wide one, given no width (R5) or a
// width of 100% (R6): whether Word gives its columns the same widths in both, as their x and the lines of each row show.
//
// Word 16 for Mac's PDF of it, word-column-widths.pdf (2026-10-01), showed A in R1 to R4, and the same widths in both
// columns in R5 and R6. LibreOffice 26.8 follows C, and sizes R6's table again in the wide column.
//
// Usage: npm run run-ts -- scripts/layout-probes/word-column-widths.ts, which writes
// build/word-probes/word-column-widths.docx
import * as fs from "fs";
import { Column, Document, type ISectionOptions, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";

const line = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));

const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(" ");
/** A paragraph of words that wraps, starting with its probe's name */
const prose = (probe: string, words: number): Paragraph =>
    line(`${probe} ${Array.from({ length: words }, (_, i) => WORDS[(i * 5) % WORDS.length]).join(" ")}`);

/** A table without widths, of rows of a cell naming the row and a cell of text that wraps in the narrow column */
const table = (probe: string, rows: number, width?: number): Table =>
    new Table({
        ...(width === undefined ? {} : { width: { size: width, type: WidthType.PERCENTAGE } }),
        rows: Array.from(
            { length: rows },
            (_, i) =>
                new TableRow({
                    children: [
                        new TableCell({ children: [line(`${probe} ${i + 1}`)] }),
                        new TableCell({ children: [line(`${probe} the survey of the coast`)] }),
                    ],
                }),
        ),
    });

// A4 with 1440 margins: 9026 twips of text
const NARROW_FIRST = { count: 2, equalWidth: false, children: [new Column({ width: 2000, space: 720 }), new Column({ width: 6306 })] };
const WIDE_FIRST = { count: 2, equalWidth: false, children: [new Column({ width: 6306, space: 720 }), new Column({ width: 2000 })] };

const sections: ISectionOptions[] = [
    { properties: { column: NARROW_FIRST }, children: [...fill("R1", 47), prose("R1", 24)] },
    { properties: { column: WIDE_FIRST }, children: [...fill("R2", 47), prose("R2", 66)] },
    { properties: { column: NARROW_FIRST }, children: [...fill("R3", 47), prose("R3", 20)] },
    { properties: { column: NARROW_FIRST }, children: [...fill("R4", 98), prose("R4", 66)] },
    { properties: { column: NARROW_FIRST }, children: [...fill("R5", 45), table("R5", 20)] },
    { properties: { column: NARROW_FIRST }, children: [...fill("R6", 45), table("R6", 20, 100)] },
];

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    sections,
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-column-widths.docx", buffer));
