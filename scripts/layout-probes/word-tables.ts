// cspell:ignore bbox
// Probes of how Word sizes table columns, now that docx writes each cell's width from columnWidths. Each table's first
// row has a word in each cell naming the table and column, so pdftotext -bbox-layout shows where each column starts.
import * as fs from "fs";
import { Document, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, WidthType } from "docx";

type TableOptions = ConstructorParameters<typeof Table>[0];

const LONG = "each entry of the log says what was found on the survey where it was found and what should be done about it";
const cell = (text: string, options: Partial<ConstructorParameters<typeof TableCell>[0]> = {}): TableCell =>
    new TableCell({ ...options, children: [new Paragraph(text)] });
const probe = (name: string, note: string, table: Table): (Paragraph | Table)[] => [
    new Paragraph(`${name}: ${note}`),
    table,
    new Paragraph(`${name} end`),
];
/** Rows of short text in the first column and long text in the others, which Word would size to fit */
const rows = (name: string, columns: number): TableRow[] => [
    new TableRow({ children: Array.from({ length: columns }, (_, index) => cell(`${name}c${index + 1}`)) }),
    new TableRow({ children: Array.from({ length: columns }, (_, index) => cell(index === 0 ? "1.1" : LONG)) }),
];
const table = (name: string, columns: number, options: Omit<TableOptions, "rows"> = {}): Table =>
    new Table({ ...options, rows: rows(name, columns) });

const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { after: 0 } } } } },
    sections: [
        {
            children: [
                ...probe(
                    "T1",
                    "columnWidths 1400 5226 2400, width 9026 dxa",
                    table("T1", 3, {
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [1400, 5226, 2400],
                    }),
                ),
                ...probe("T2", "columnWidths 1400 5226 2400, no width", table("T2", 3, { columnWidths: [1400, 5226, 2400] })),
                ...probe("T3", "no columnWidths, no widths", table("T3", 3)),
                ...probe("T4", "no columnWidths, width 100%", table("T4", 3, { width: { size: 100, type: WidthType.PERCENTAGE } })),
                ...probe(
                    "T5",
                    "columnWidths 2000 3000, width 100%",
                    table("T5", 2, {
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        columnWidths: [2000, 3000],
                    }),
                ),
                ...probe(
                    "T6",
                    "columnWidths 2000 3000, width 9026 dxa",
                    table("T6", 2, {
                        width: { size: 9026, type: WidthType.DXA },
                        columnWidths: [2000, 3000],
                    }),
                ),
                ...probe(
                    "T7",
                    "columnWidths 900 8126, a long word in the first column",
                    new Table({
                        columnWidths: [900, 8126],
                        rows: [
                            new TableRow({ children: [cell("T7c1"), cell("T7c2")] }),
                            new TableRow({ children: [cell("extraordinarily"), cell(LONG)] }),
                        ],
                    }),
                ),
                ...probe(
                    "T8",
                    "columnWidths 1400 5226 2400, layout fixed",
                    table("T8", 3, {
                        columnWidths: [1400, 5226, 2400],
                        layout: TableLayoutType.FIXED,
                    }),
                ),
                ...probe(
                    "T9",
                    "columnWidths 1000 2000 3000, merged cells",
                    new Table({
                        columnWidths: [1000, 2000, 3000],
                        rows: [
                            new TableRow({ children: [cell("T9c1"), cell("T9c2"), cell("T9c3")] }),
                            new TableRow({ children: [cell("T9 span 2", { columnSpan: 2 }), cell("T9 rows 2", { rowSpan: 2 })] }),
                            new TableRow({ children: [cell("T9 a"), cell("T9 b")] }),
                        ],
                    }),
                ),
                ...probe(
                    "T10",
                    "columnWidths 1000 2000, cell widths 3000 3000 dxa",
                    new Table({
                        columnWidths: [1000, 2000],
                        rows: [
                            new TableRow({
                                children: [
                                    cell("T10c1", { width: { size: 3000, type: WidthType.DXA } }),
                                    cell("T10c2", { width: { size: 3000, type: WidthType.DXA } }),
                                ],
                            }),
                        ],
                    }),
                ),
                // Proportions given as columnWidths, as some issues recommend (#528, #745, #1457, #2980)
                ...probe(
                    "T11",
                    "columnWidths 20 80, width 100%",
                    table("T11", 2, {
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        columnWidths: [20, 80],
                    }),
                ),
                ...probe(
                    "T12",
                    "columnWidths 5 50 10 10 10 15, width 100%",
                    table("T12", 6, {
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        columnWidths: [5, 50, 10, 10, 10, 15],
                    }),
                ),
                ...probe("T13", "columnWidths 20 80, no width", table("T13", 2, { columnWidths: [20, 80] })),
            ],
        },
    ],
});

fs.mkdirSync("build/word-probes", { recursive: true });
Packer.toBuffer(doc).then((buffer) => fs.writeFileSync("build/word-probes/word-tables.docx", buffer));
