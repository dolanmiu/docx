/**
 * Probes of what Word does with footnotes where docx/layout still stops after `word-watertight-notes` (FN1 to FN15): table
 * rows in a footnote that break across pages, a footnote too long for the columns of a page that no room below them
 * leaves on the page with its reference, and the empty paragraph Word puts after a table that ends a footnote or endnote
 * where the note text styles aren't formatted as Normal. Each probe starts a page, and each line's text names its probe,
 * so the lines can be found in a PDF saved from Word with pdftotext -bbox-layout, which word-notes-across-pages.py reads.
 *
 * word-notes-across-pages.docx: Calibri 11, single spaced, no space before or after, on A4 with 1440 margins, 51 lines to
 * a page, and footnotes in 11 points too, so a footnote's line is as tall as a body line, and the separator takes a line.
 * "fill" lines are one-line paragraphs; a probe named with a number has its reference on that line.
 *
 * NP1: a footnote of a line and a table of a 120-line row, from line 11: how the rest of the row goes on across the next
 *      2 pages
 * NP2: a line at the top of the second of 2 columns, below 51 lines in the first, whose footnote is a 55-line paragraph
 *      kept together, so no room below the columns leaves the line on the page with any of it
 * NP3: a footnote of a line and a table of a row of 2 cells, of 6 lines and of 3, from line 47, with room for the line and
 *      2 of the row's: whether the cell of 3 lines, which widow control keeps together, has none of them on the page
 *      beside the 2 of the other, as in a row of the text
 *
 * A footnote that starts with a table, whose first row Word may keep some of with its reference, isn't here, as docx
 * writes the note's mark in its first paragraph, so can't write one.
 *
 * word-notes-final-table.docx: Calibri 11, with the footnote text and endnote text styles in 8 points with 24 points of
 * space after, so the empty paragraph Word puts after a table that ends a note is about 13.4 points tall in Normal and
 * 33.8 in the note's style.
 *
 * NF1: a footnote of a line and a table of a line, then 2 lines on, a footnote of a line: how far below the table the
 *      second footnote starts
 * NF2: the same with endnotes, at the end of the document
 */
// cspell:ignore bbox
import { mkdirSync, writeFileSync } from "node:fs";

import {
    BorderStyle,
    Document,
    EndnoteReferenceRun,
    FootnoteReferenceRun,
    type ISectionOptions,
    Packer,
    Paragraph,
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

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

/** A table across the page, with no cell margins, of one row with a cell of each paragraph, side by side */
const table = (...cells: readonly Paragraph[]): Table => {
    const width = Math.floor(9026 / cells.length);
    return new Table({
        width: { size: width * cells.length, type: WidthType.DXA },
        columnWidths: cells.map(() => width),
        borders,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [
            new TableRow({
                children: cells.map((paragraph) => new TableCell({ width: { size: width, type: WidthType.DXA }, children: [paragraph] })),
            }),
        ],
    });
};

/** Notes, by their numbers, and a reference to each as it is added */
const notes = (): {
    readonly all: Record<number, { children: Paragraph[] }>;
    readonly add: (...children: Child[]) => number;
} => {
    const all: Record<number, { children: Paragraph[] }> = {};
    let count = 0;
    return {
        all,
        add: (...children: Child[]): number => {
            count++;
            // A note can have a table in it, though the option's type only names paragraphs
            all[count] = { children: children as Paragraph[] };
            return count;
        },
    };
};

const footnotes = notes();
const withNote = (text: string, ...children: Child[]): Paragraph =>
    new Paragraph({ children: [new TextRun(text), new FootnoteReferenceRun(footnotes.add(...children))] });

const across: ISectionOptions[] = [
    // NP1: a note of a line and a table of a 120-line row from line 11
    { children: [...fill("NP1", 10), withNote("NP1 ref", line("NP1 head"), table(lines("NP1 row", 120))), ...fill("NP1 after", 20)] },

    // NP2: 51 lines in the first of 2 columns, then a line whose note is 55 lines kept together
    {
        properties: { column: { count: 2, space: 720 } },
        children: [...fill("NP2", 51), withNote("NP2 ref", lines("NP2 note", 55, { keepLines: true })), ...fill("NP2 after", 20)],
    },

    // NP3: room for 3 below line 47, and a note of a line and a row of cells of 6 lines and 3
    {
        children: [
            ...fill("NP3", 46),
            withNote("NP3 ref", line("NP3 head"), table(lines("NP3 a", 6), lines("NP3 b", 3))),
            ...fill("NP3 after", 20),
        ],
    },
];

const finalNotes = notes();
const endnotes = notes();
const final: ISectionOptions[] = [
    // NF1: a note of a line and a table, then 2 lines on, a note of a line
    {
        children: [
            ...fill("NF1", 5),
            new Paragraph({
                children: [new TextRun("NF1 ref"), new FootnoteReferenceRun(finalNotes.add(line("NF1 head"), table(line("NF1 cell"))))],
            }),
            ...fill("NF1 between", 2),
            new Paragraph({ children: [new TextRun("NF1 next ref"), new FootnoteReferenceRun(finalNotes.add(line("NF1 next note")))] }),
            ...fill("NF1 after", 5),
        ],
    },
    // NF2: the same with endnotes, at the end of the document
    {
        children: [
            ...fill("NF2", 5),
            new Paragraph({
                children: [new TextRun("NF2 ref"), new EndnoteReferenceRun(endnotes.add(line("NF2 head"), table(line("NF2 cell"))))],
            }),
            ...fill("NF2 between", 2),
            new Paragraph({ children: [new TextRun("NF2 next ref"), new EndnoteReferenceRun(endnotes.add(line("NF2 next note")))] }),
            ...fill("NF2 after", 5),
        ],
    },
];

const SINGLE = { before: 0, after: 0, line: 240 };

const main = async (): Promise<void> => {
    mkdirSync("build/word-probes", { recursive: true });
    writeFileSync(
        "build/word-probes/word-notes-across-pages.docx",
        await Packer.toBuffer(
            new Document({
                styles: {
                    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: SINGLE } } },
                    paragraphStyles: [{ id: "FootnoteText", name: "footnote text", run: { size: 22 }, paragraph: { spacing: SINGLE } }],
                },
                footnotes: footnotes.all,
                sections: across,
            }),
        ),
    );
    const noteText = { run: { size: 16 }, paragraph: { spacing: { before: 0, after: 480, line: 240 } } };
    writeFileSync(
        "build/word-probes/word-notes-final-table.docx",
        await Packer.toBuffer(
            new Document({
                styles: {
                    default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: SINGLE } } },
                    paragraphStyles: [
                        { id: "FootnoteText", name: "footnote text", ...noteText },
                        { id: "EndnoteText", name: "endnote text", ...noteText },
                    ],
                },
                footnotes: finalNotes.all,
                endnotes: endnotes.all,
                sections: final,
            }),
        ),
    );
};

void main();
