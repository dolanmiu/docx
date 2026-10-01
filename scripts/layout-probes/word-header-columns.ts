// Probes of how Word repeats a table's header rows at the top of each column, for the cases `word-rules2.docx` Q4
// didn't show: columns evened out before a continuous section break, and a table that goes on into a second page,
// evened out there or not.
//
// Each probe evened out starts on a new page with a line, then a continuous section of columns, then a continuous section
// of one column with a line after. Calibri 11, single spaced, no space after, 51 lines to a page, in tables without
// borders or cell margins, so each row is a line.
//
// Save it from Word as word-header-columns.pdf, and read it with word-header-columns.py. Word and LibreOffice both
// repeat the header rows at the top of every column. Word evens out the columns of a table that goes on from the page
// before (H7, H8), where LibreOffice leaves them as they are, and gives the empty paragraph that ends a section after a
// table a line of its own below the last column, where LibreOffice gives it no room: the line after the columns is a
// line lower in H1, H2, H4, H7 and H8, and in H3 the empty line brings the shorter second column level with the first.
import * as fs from "fs";

import { Document, Packer, Paragraph, SectionType, Table, TableBorders, TableCell, TableRow, TextRun, WidthType } from "docx";

type Options = ConstructorParameters<typeof Paragraph>[0] & object;
const line = (text: string, options: Options = {}): Paragraph => new Paragraph({ ...options, children: [new TextRun(text)] });
const fill = (probe: string, count: number): Paragraph[] => Array.from({ length: count }, (_, i) => line(`${probe} fill ${i + 1}`));
/** One paragraph of lines split by line breaks */
const lines = (probe: string, count: number): Paragraph =>
    new Paragraph({
        children: Array.from({ length: count }, (_, i) => new TextRun({ text: `${probe} line ${i + 1}`, ...(i > 0 ? { break: 1 } : {}) })),
    });

/** A table of one column 4150 twips wide, with header rows, then rows of one line each, then any other rows */
const table = (probe: string, headers: number, rows: number, more: readonly Paragraph[] = []): Table =>
    new Table({
        width: { size: 4150, type: WidthType.DXA },
        columnWidths: [4150],
        borders: TableBorders.NONE,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        rows: [
            ...Array.from({ length: headers }, (_, i) => ({ cell: line(`${probe} header ${i + 1}`), header: true })),
            ...Array.from({ length: rows }, (_, i) => ({ cell: line(`${probe} row ${i + 1}`), header: false })),
            ...more.map((cell) => ({ cell, header: false })),
        ].map(
            ({ cell, header }) =>
                new TableRow({
                    tableHeader: header,
                    children: [new TableCell({ width: { size: 4150, type: WidthType.DXA }, children: [cell] })],
                }),
        ),
    });

const probe = (name: string, children: (Paragraph | Table)[], count = 2) => [
    { children: [line(`${name} top`)] },
    { properties: { type: SectionType.CONTINUOUS, column: { count, space: 720 } }, children },
    { properties: { type: SectionType.CONTINUOUS }, children: [line(`${name} after`)] },
];

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } } } },
    sections: [
        // H1: a header row and 20 rows in 2 columns: 11 and 11 with the header repeated, or 11 and 10 without
        ...probe("H1", [table("H1", 1, 20)]),
        // H2: 2 header rows and 15 rows in 3 columns: 7, 7 and 7 with the headers repeated
        ...probe("H2", [table("H2", 2, 15)], 3),
        // H3: 3 lines, then a header row and 12 rows, in 2 columns: 9 and 8 with the header repeated
        ...probe("H3", [...fill("H3", 3), table("H3", 1, 12)]),
        // H4: a header row, 2 rows and a row of a 10-line cell, in 2 columns: the row broken across the columns, below the
        // header in the second
        ...probe("H4", [table("H4", 1, 2, [lines("H4 cell", 10)])]),
        // H5: a header row and 10 rows, then 6 lines, in 2 columns: 9 and 9 with the header repeated
        ...probe("H5", [table("H5", 1, 10), ...fill("H5", 6)]),
        // H6: a header row and 120 rows in 2 columns, then a section on a new page: not evened out, and the header at the
        // top of each column of both pages
        { children: [line("H6 top")] },
        { properties: { type: SectionType.CONTINUOUS, column: { count: 2, space: 720 } }, children: [table("H6", 1, 120)] },
        { children: [line("H6 after")] },
        // H7: a header row and 120 rows in 2 columns, evened out on the second page, and H8, the same without the header
        // row: whether the columns of a table that goes on from the page before are evened out
        ...probe("H7", [table("H7", 1, 120)]),
        ...probe("H8", [table("H8", 0, 120)]),
    ],
});

Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-header-columns.docx", buffer));
