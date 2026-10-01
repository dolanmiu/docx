// Probes of how Word evens out columns before a continuous section break, for the cases it hasn't shown yet. Each probe
// starts on a new page with a line, then a continuous section of columns, then a continuous section of one column with
// a line after. Calibri 11, single spaced, no space after, 51 lines to a page. Save it from Word as word-balance.pdf, and
// read it with word-balance.py.
import * as fs from "fs";
import { ColumnBreak, Document, Packer, Paragraph, SectionType, Table, TableBorders, TableCell, TableRow, TextRun, WidthType } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number, options: Options = {}): Paragraph[] =>
    Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`, options));
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number, options: Options = {}): Paragraph =>
    new Paragraph({
        ...options,
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });
const table = (rows: readonly Paragraph[]): Table =>
    new Table({
        width: { size: 4150, type: WidthType.DXA },
        columnWidths: [4150],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: rows.map(
            (cell) => new TableRow({ children: [new TableCell({ width: { size: 4150, type: WidthType.DXA }, children: [cell] })] }),
        ),
    });

const probe = (name: string, children: (Paragraph | Table)[], count = 2, after: Options = {}) => [
    { children: [line(`${name} top`)] },
    { properties: { type: SectionType.CONTINUOUS, column: { count, space: 720 } }, children },
    { properties: { type: SectionType.CONTINUOUS }, children: [line(`${name} after`, after)] },
];

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    sections: [
        // W1: a column break at the end of the 3rd of 10 lines, in 2 columns, and after the 2nd of 12, in 3
        ...probe("W1a", [
            ...fill("W1a", 2),
            new Paragraph({ children: [new TextRun("W1a fill 3"), new ColumnBreak()] }),
            ...fill("W1a rest", 7),
        ]),
        ...probe(
            "W1b",
            [...fill("W1b", 1), new Paragraph({ children: [new TextRun("W1b fill 2"), new ColumnBreak()] }), ...fill("W1b rest", 10)],
            3,
        ),
        // W2: 5 lines, the last with 24 points after, in the shorter column; and the 3rd with 24 after, the tallest's last
        ...probe("W2a", [...fill("W2a", 4), line("W2a fill 5", { spacing: { after: 480 } })]),
        ...probe("W2b", [...fill("W2b", 2), line("W2b fill 3", { spacing: { after: 480 } }), ...fill("W2b rest", 2)]),
        // W3: a paragraph of 60 lines kept together, after the line above the columns
        ...probe("W3", [lines("W3", 60, { keepLines: true })]),
        // W4: a paragraph of 5 lines, of 3 lines, and of 3 lines without widow control
        ...probe("W4a", [lines("W4a", 5)]),
        ...probe("W4b", [lines("W4b", 3)]),
        ...probe("W4c", [lines("W4c", 3, { widowControl: false })]),
        // W5: 4 lines, the 5th kept with the next, then 5 lines; and 3 lines, then 4 kept together
        ...probe("W5a", [...fill("W5a", 4), line("W5a kept", { keepNext: true }), ...fill("W5a rest", 5)]),
        ...probe("W5b", [...fill("W5b", 3), lines("W5b kept", 4, { keepLines: true })]),
        // W6: 2 lines, a table of 6 rows, 4 lines; and 2 lines, a row of a 6-line cell, 2 lines
        ...probe("W6a", [...fill("W6a", 2), table(Array.from({ length: 6 }, (_, i) => line(`W6a row ${i + 1}`))), ...fill("W6a rest", 4)]),
        ...probe("W6b", [...fill("W6b", 2), table([lines("W6b cell", 6)]), ...fill("W6b rest", 2)]),
        // W7: 110 lines, which fill a page and go on to the next; and 10 lines of 11 points and 4 of 16
        ...probe("W7a", fill("W7a", 110)),
        ...probe("W7b", [
            ...fill("W7b", 10),
            ...Array.from({ length: 4 }, (_, i) => new Paragraph({ children: [new TextRun({ text: `W7b big ${i + 1}`, size: 32 })] })),
        ]),
        // W8: columns that start low on the page, below 49 lines, with a line kept with a paragraph of 4 lines, which need 3
        { children: [line("W8 top"), ...fill("W8 above", 48)] },
        {
            properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } },
            children: [line("W8 kept", { keepNext: true }), lines("W8", 4), ...fill("W8 rest", 4)],
        },
        { properties: { type: SectionType.CONTINUOUS }, children: [line("W8 after")] },
        // W9: a page of exactly 51 lines, then a section on a new page: is there a page for the section's empty last paragraph?
        { children: [line("W9 top"), ...fill("W9", 50)] },
        { children: [line("W9 next section")] },
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-balance.docx", buffer));
