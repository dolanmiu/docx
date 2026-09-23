/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { PageOrientation } from "@file/document/body/section-properties/properties/page-size";
import { File } from "@file/file";
import { Header } from "@file/header";

import { AlignmentType, Paragraph } from "../paragraph";
import { Table } from "./table";
import { TableCell } from "./table-cell";
import { RelativeHorizontalPosition, RelativeVerticalPosition, TableAnchorType } from "./table-properties";
import { TableLayoutType } from "./table-properties/table-layout";
import { TableRow } from "./table-row";
import { WidthType } from "./table-width";

const BORDERS = {
    "w:tblBorders": [
        { "w:top": { _attr: { "w:val": "single", "w:sz": 4, "w:color": "auto" } } },
        { "w:left": { _attr: { "w:val": "single", "w:sz": 4, "w:color": "auto" } } },
        { "w:bottom": { _attr: { "w:val": "single", "w:sz": 4, "w:color": "auto" } } },
        { "w:right": { _attr: { "w:val": "single", "w:sz": 4, "w:color": "auto" } } },
        { "w:insideH": { _attr: { "w:val": "single", "w:sz": 4, "w:color": "auto" } } },
        { "w:insideV": { _attr: { "w:val": "single", "w:sz": 4, "w:color": "auto" } } },
    ],
};

const WIDTHS = {
    "w:tblW": {
        _attr: {
            "w:type": "auto",
            "w:w": 100,
        },
    },
};

// const f = {
//     "w:tbl": [
//         {
//             "w:tblPr": [
//                 {
//                     "w:tblCellMar": [
//                         { "w:bottom": { _attr: { "w:type": "auto", "w:w": 0 } } },
//                         { "w:top": { _attr: { "w:type": "auto", "w:w": 0 } } },
//                         { "w:left": { _attr: { "w:type": "auto", "w:w": 0 } } },
//                         { "w:right": { _attr: { "w:type": "auto", "w:w": 0 } } },
//                     ],
//                 },
//                 {
//                     "w:tblBorders": [
//                         { "w:top": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
//                         { "w:left": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
//                         { "w:bottom": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
//                         { "w:right": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
//                         { "w:insideH": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
//                         { "w:insideV": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
//                     ],
//                 },
//                 { "w:tblW": { _attr: { "w:type": "auto", "w:w": 100 } } },
//                 {
//                     "w:tblpPr": {
//                         _attr: {
//                             "w:horzAnchor": "margin",
//                             "w:vertAnchor": "page",
//                             "w:tblpX": 10,
//                             "w:tblpXSpec": "center",
//                             "w:tblpY": 20,
//                             "w:tblpYSpec": "bottom",
//                             "w:bottomFromText": 30,
//                             "w:topFromText": 40,
//                             "w:leftFromText": 50,
//                             "w:rightFromText": 60,
//                         },
//                     },
//                 },
//             ],
//         },
//         { "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 100 } } }] },
//         { "w:tr": [{ "w:tc": [{ "w:p": EMPTY_OBJECT }] }] },
//     ],
// };

describe("Table", () => {
    describe("#constructor", () => {
        it("creates a table with the correct number of rows and columns", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
            });
            const tree = new Formatter().format(table);
            const cell = {
                "w:tc": [
                    {
                        "w:p": [
                            {
                                "w:r": [
                                    {
                                        "w:t": [
                                            {
                                                _attr: {
                                                    "xml:space": "preserve",
                                                },
                                            },
                                            "hello",
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
            expect(tree).to.deep.equal({
                "w:tbl": [
                    { "w:tblPr": [WIDTHS, BORDERS] },
                    {
                        // No widths given: the grid splits the default page's text width (9026 twips) equally
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 4513 } } }, { "w:gridCol": { _attr: { "w:w": 4513 } } }],
                    },
                    { "w:tr": [cell, cell] },
                    { "w:tr": [cell, cell] },
                    { "w:tr": [cell, cell] },
                ],
            });
        });

        it("creates a table with the correct columnSpan and rowSpan", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                                columnSpan: 2,
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                                rowSpan: 2,
                            }),
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
            });
            const tree = new Formatter().format(table);
            const cellP = { "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "hello"] }] }] };
            expect(tree).to.deep.equal({
                "w:tbl": [
                    { "w:tblPr": [WIDTHS, BORDERS] },
                    {
                        // No widths given: the grid splits the default page's text width (9026 twips) equally
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 4513 } } }, { "w:gridCol": { _attr: { "w:w": 4513 } } }],
                    },
                    {
                        "w:tr": [
                            {
                                "w:tc": [{ "w:tcPr": [{ "w:gridSpan": { _attr: { "w:val": 2 } } }] }, cellP],
                            },
                        ],
                    },
                    {
                        "w:tr": [
                            {
                                "w:tc": [{ "w:tcPr": [{ "w:vMerge": { _attr: { "w:val": "restart" } } }] }, cellP],
                            },
                            { "w:tc": [cellP] },
                        ],
                    },
                    {
                        "w:tr": [
                            {
                                "w:tc": [{ "w:tcPr": [{ "w:vMerge": { _attr: { "w:val": "continue" } } }] }, { "w:p": {} }],
                            },
                            { "w:tc": [cellP] },
                        ],
                    },
                ],
            });
        });

        it("sets the table to fixed width layout", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                layout: TableLayoutType.FIXED,
            });
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [WIDTHS, BORDERS, { "w:tblLayout": { _attr: { "w:type": "fixed" } } }],
            });
        });

        it("should center the table", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                alignment: AlignmentType.CENTER,
            });
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [WIDTHS, { "w:jc": { _attr: { "w:val": "center" } } }, BORDERS],
            });
        });

        it("should set the table to provided 100% width", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                layout: TableLayoutType.FIXED,
            });
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    {
                        "w:tblW": {
                            _attr: {
                                "w:type": "pct",
                                "w:w": 5000,
                            },
                        },
                    },
                    BORDERS,
                    { "w:tblLayout": { _attr: { "w:type": "fixed" } } },
                ],
            });
        });

        it("should set the table to provided 1000 DXA", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                width: {
                    size: 1000,
                    type: WidthType.DXA,
                },
                layout: TableLayoutType.FIXED,
            });
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    {
                        "w:tblW": {
                            _attr: {
                                "w:type": "dxa",
                                "w:w": 1000,
                            },
                        },
                    },
                    BORDERS,
                    { "w:tblLayout": { _attr: { "w:type": "fixed" } } },
                ],
            });
        });

        it("creates a table with properties revision", () => {
            const run = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                alignment: AlignmentType.CENTER,
                revision: {
                    id: 1,
                    author: "Firstname Lastname",
                    date: "123",
                    alignment: AlignmentType.RIGHT,
                },
            });
            const tree = new Formatter().format(run);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    WIDTHS,
                    { "w:jc": { _attr: { "w:val": "center" } } },
                    BORDERS,
                    {
                        "w:tblPrChange": [
                            {
                                _attr: {
                                    "w:author": "Firstname Lastname",
                                    "w:date": "123",
                                    "w:id": 1,
                                },
                            },
                            {
                                "w:tblPr": [
                                    {
                                        "w:jc": {
                                            _attr: {
                                                "w:val": "right",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("creates a table with grid revision", () => {
            const run = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                alignment: AlignmentType.CENTER,
                columnWidths: [1234, 321, 123],
                columnWidthsRevision: { id: 1, columnWidths: [1234, 123, 321] },
            });
            const tree = new Formatter().format(run);
            const tableGrid = tree["w:tbl"].find((x: any) => x["w:tblGrid"]);
            expect(tableGrid).to.deep.equal({
                "w:tblGrid": [
                    { "w:gridCol": { _attr: { "w:w": 1234 } } },
                    { "w:gridCol": { _attr: { "w:w": 321 } } },
                    { "w:gridCol": { _attr: { "w:w": 123 } } },
                    {
                        "w:tblGridChange": [
                            {
                                _attr: { "w:id": 1 },
                            },
                            {
                                "w:tblGrid": [
                                    { "w:gridCol": { _attr: { "w:w": 1234 } } },
                                    { "w:gridCol": { _attr: { "w:w": 123 } } },
                                    { "w:gridCol": { _attr: { "w:w": 321 } } },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#columnWidths", () => {
        const col = (width: number): any => ({ "w:gridCol": { _attr: { "w:w": width } } });
        const gridOf = (tableTree: any): any => tableTree["w:tbl"].find((x: any) => x["w:tblGrid"])["w:tblGrid"];
        const tablesIn = (tree: any, key: string): readonly any[] => tree[key].filter((x: any) => x["w:tbl"]);

        // The table from #1457: 100% wide with 90% / 10% cells
        const percentTable = (options: Partial<ConstructorParameters<typeof Table>[0]> = {}): Table =>
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 90, type: WidthType.PERCENTAGE }, children: [new Paragraph("Hello")] }),
                            new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 90, type: WidthType.PERCENTAGE }, children: [] }),
                            new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph("World")] }),
                        ],
                    }),
                ],
                ...options,
            });

        const twoColumnTable = (options: Partial<ConstructorParameters<typeof Table>[0]> = {}): Table =>
            new Table({
                rows: [
                    new TableRow({
                        children: [new TableCell({ children: [new Paragraph("a")] }), new TableCell({ children: [new Paragraph("b")] })],
                    }),
                ],
                ...options,
            });

        it("derives a twip grid from percentage widths instead of a placeholder grid (#1457)", () => {
            // A4 with 1 inch margins: 9026 twips of text width
            expect(gridOf(new Formatter().format(percentTable()))).to.deep.equal([col(8123), col(903)]);
        });

        it("derives the grid from dxa cell widths", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ width: { size: 3505, type: WidthType.DXA }, children: [new Paragraph("Hello")] }),
                            new TableCell({ width: { size: 5505, type: WidthType.DXA }, children: [] }),
                        ],
                    }),
                ],
            });

            expect(gridOf(new Formatter().format(table))).to.deep.equal([col(3505), col(5505)]);
        });

        it("keeps explicit columnWidths untouched even when the cells have percentage widths", () => {
            const table = percentTable({ columnWidths: [1000, 2000] });

            expect(gridOf(new Formatter().format(table))).to.deep.equal([col(1000), col(2000)]);
        });

        it("exposes the grid widths through ColumnWidths", () => {
            expect(percentTable().ColumnWidths).to.deep.equal([8123, 903]);
            expect(percentTable({ columnWidths: [1000, 2000] }).ColumnWidths).to.deep.equal([1000, 2000]);
        });

        it("accounts for the continuation cells inserted for rowSpan", () => {
            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ rowSpan: 2, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph("a")] }),
                            new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph("b")] }),
                        ],
                    }),
                    new TableRow({
                        children: [new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph("c")] })],
                    }),
                ],
            });

            expect(gridOf(new Formatter().format(table))).to.deep.equal([col(2708), col(6318)]);
        });

        it("keeps the grid revision when the grid is derived", () => {
            const table = twoColumnTable({ columnWidthsRevision: { id: 1, columnWidths: [1, 2] } });

            expect(gridOf(new Formatter().format(table))).to.deep.equal([
                col(4513),
                col(4513),
                { "w:tblGridChange": [{ _attr: { "w:id": 1 } }, { "w:tblGrid": [col(1), col(2)] }] },
            ]);
        });

        it("creates an empty grid for a table without rows", () => {
            expect(gridOf(new Formatter().format(new Table({ rows: [] })))).to.deep.equal({});
        });

        it("produces the same output when formatted more than once", () => {
            const table = percentTable();
            const first = new Formatter().format(table);
            const second = new Formatter().format(table);

            expect(second).to.deep.equal(first);
            expect(second["w:tbl"].filter((x: any) => x["w:tblGrid"])).to.have.length(1);
        });

        it("resolves percentages against the page size and margins of the section the table is in", () => {
            const doc = new File({
                sections: [
                    {
                        properties: { page: { size: { width: 12240, height: 15840 }, margin: { left: 1440, right: 1440 } } },
                        children: [percentTable()],
                    },
                ],
            });

            const tree = new Formatter().format(doc.Document.View.Body);

            // Letter with 1 inch margins: 9360 twips of text width
            expect(gridOf(tablesIn(tree, "w:body")[0])).to.deep.equal([col(8424), col(936)]);
        });

        it("resolves each table against its own section in a multi-section document", () => {
            const doc = new File({
                sections: [
                    { properties: { page: { size: { width: 12240, height: 15840 } } }, children: [percentTable()] },
                    {
                        properties: { page: { size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE } } },
                        children: [percentTable()],
                    },
                ],
            });

            const tables = tablesIn(new Formatter().format(doc.Document.View.Body), "w:body");

            expect(gridOf(tables[0])).to.deep.equal([col(8424), col(936)]);
            // Landscape: 15840 - 2880 = 12960 twips of text width
            expect(gridOf(tables[1])).to.deep.equal([col(11664), col(1296)]);
        });

        it("resolves a table in a header against the first section", () => {
            const doc = new File({
                sections: [
                    {
                        headers: { default: new Header({ children: [percentTable()] }) },
                        properties: { page: { size: { width: 12240, height: 15840 } } },
                        children: [],
                    },
                ],
            });
            const header = doc.Headers[0];

            const tree = new Formatter().format(header.View, { file: doc, viewWrapper: header, stack: [] });

            expect(gridOf(tablesIn(tree, "w:hdr")[0])).to.deep.equal([col(8424), col(936)]);
        });

        it("falls back to the default page when the document has no sections", () => {
            const doc = new File({ sections: [] });

            const tree = new Formatter().format(percentTable(), { file: doc, viewWrapper: doc.Document, stack: [] });

            expect(gridOf(tree)).to.deep.equal([col(8123), col(903)]);
        });

        it("falls back to the default page when formatted without a document", () => {
            const tree = new Formatter().format(percentTable(), { file: {} as any, viewWrapper: {} as any, stack: [] });

            expect(gridOf(tree)).to.deep.equal([col(8123), col(903)]);
        });

        it("falls back to the default page when the cell on the stack is not in a row", () => {
            const cell = new TableCell({ children: [] });

            const tree = new Formatter().format(percentTable(), { stack: [new Paragraph(""), new Paragraph(""), cell] } as any);

            expect(gridOf(tree)).to.deep.equal([col(8123), col(903)]);
        });

        it("falls back to the default page when the row on the stack is not in a table", () => {
            const cell = new TableCell({ children: [] });
            const row = new TableRow({ children: [cell] });

            const tree = new Formatter().format(percentTable(), { stack: [new Paragraph(""), row, cell] } as any);

            expect(gridOf(tree)).to.deep.equal([col(8123), col(903)]);
        });

        it("resolves a nested table against the cell it sits in", () => {
            const inner = twoColumnTable({ width: { size: 100, type: WidthType.PERCENTAGE } });
            const outer = new Table({
                columnWidths: [3000, 6000],
                rows: [
                    new TableRow({
                        children: [new TableCell({ children: [new Paragraph("a")] }), new TableCell({ children: [inner] })],
                    }),
                ],
            });

            new Formatter().format(outer);

            expect(inner.ColumnWidths).to.deep.equal([3000, 3000]);
        });

        it("resolves a nested table against all the columns its cell spans", () => {
            const inner = twoColumnTable({ width: { size: 50, type: WidthType.PERCENTAGE } });
            const outer = new Table({
                columnWidths: [3000, 6000],
                rows: [new TableRow({ children: [new TableCell({ columnSpan: 2, children: [inner] })] })],
            });

            new Formatter().format(outer);

            expect(inner.ColumnWidths).to.deep.equal([2250, 2250]);
        });

        it("resolves a nested table against a derived outer grid", () => {
            const inner = twoColumnTable({ width: { size: 100, type: WidthType.PERCENTAGE } });
            const outer = new Table({
                rows: [
                    new TableRow({
                        children: [new TableCell({ children: [new Paragraph("a")] }), new TableCell({ children: [inner] })],
                    }),
                ],
            });

            new Formatter().format(outer);

            expect(outer.ColumnWidths).to.deep.equal([4513, 4513]);
            expect(inner.ColumnWidths).to.deep.equal([2257, 2257]);
        });

        it("falls back to the page when the outer grid has no column for the cell", () => {
            const inner = twoColumnTable({ width: { size: 100, type: WidthType.PERCENTAGE } });
            const outer = new Table({
                columnWidths: [3000],
                rows: [
                    new TableRow({
                        children: [new TableCell({ children: [new Paragraph("a")] }), new TableCell({ children: [inner] })],
                    }),
                ],
            });

            new Formatter().format(outer);

            expect(inner.ColumnWidths).to.deep.equal([4513, 4513]);
        });

        it("falls back to the section the outer table is in when the outer grid has no column for the cell", () => {
            const inner = twoColumnTable({ width: { size: 100, type: WidthType.PERCENTAGE } });
            const outer = new Table({
                columnWidths: [3000],
                rows: [
                    new TableRow({
                        children: [new TableCell({ children: [new Paragraph("a")] }), new TableCell({ children: [inner] })],
                    }),
                ],
            });
            const doc = new File({
                sections: [{ properties: { page: { size: { width: 12240, height: 15840 } } }, children: [outer] }],
            });

            new Formatter().format(doc.Document.View.Body);

            // Letter with 1 inch margins: 9360 twips of text width
            expect(inner.ColumnWidths).to.deep.equal([4680, 4680]);
        });

        describe("#getCellWidth", () => {
            it("sums the grid columns the cell spans", () => {
                const row = new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph("a")] }),
                        new TableCell({ columnSpan: 2, children: [new Paragraph("b")] }),
                    ],
                });
                const table = new Table({ columnWidths: [1000, 2000, 3000], rows: [row] });

                expect(table.getCellWidth(row, row.cells[0])).to.equal(1000);
                expect(table.getCellWidth(row, row.cells[1])).to.equal(5000);
            });

            it("returns undefined for a cell that is not in the row", () => {
                const row = new TableRow({ children: [new TableCell({ children: [new Paragraph("a")] })] });
                const table = new Table({ columnWidths: [1000], rows: [row] });

                expect(table.getCellWidth(row, new TableCell({ children: [] }))).to.be.undefined;
            });
        });
    });

    describe("Cell", () => {
        describe("#prepForXml", () => {
            it("inserts a paragraph at the end of the cell if it is empty", () => {
                const table = new Table({
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph("hello")],
                                }),
                            ],
                        }),
                    ],
                });
                const tree = new Formatter().format(table);
                expect(tree).to.have.property("w:tbl").which.is.an("array");
                const row = tree["w:tbl"].find((x: any) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"]).to.be.an("array").which.has.length.at.least(1);
                expect(row["w:tr"].find((x: any) => x["w:tc"])).to.deep.equal({
                    "w:tc": [
                        {
                            "w:p": [
                                {
                                    "w:r": [
                                        {
                                            "w:t": [
                                                {
                                                    _attr: {
                                                        "xml:space": "preserve",
                                                    },
                                                },
                                                "hello",
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
            });

            // it("inserts a paragraph at the end of the cell even if it has a child table", () => {
            //     const table = new Table({
            //         rows: [
            //             new TableRow({
            //                 children: [
            //                     new TableCell({
            //                         children: [new Paragraph("hello")],
            //                     }),
            //                 ],
            //             }),
            //         ],
            //     });
            //     table.getCell(0, 0).add(
            //         new Table({
            //             rows: [
            //                 new TableRow({
            //                     children: [
            //                         new TableCell({
            //                             children: [new Paragraph("hello")],
            //                         }),
            //                     ],
            //                 }),
            //             ],
            //         }),
            //     );
            //     const tree = new Formatter().format(table);
            //     expect(tree)
            //         .to.have.property("w:tbl")
            //         .which.is.an("array");
            //     const row = tree["w:tbl"].find((x) => x["w:tr"]);
            //     expect(row).not.to.be.undefined;
            //     expect(row["w:tr"])
            //         .to.be.an("array")
            //         .which.has.length.at.least(1);
            //     const cell = row["w:tr"].find((x) => x["w:tc"]);
            //     expect(cell).not.to.be.undefined;
            //     expect(cell["w:tc"][cell["w:tc"].length - 1]).to.deep.equal({
            //         "w:p": EMPTY_OBJECT,
            //     });
            // });

            // it("does not insert a paragraph if it already ends with one", () => {
            //     const table = new Table({
            //         rows: [
            //             new TableRow({
            //                 children: [
            //                     new TableCell({
            //                         children: [new Paragraph("hello")],
            //                     }),
            //                 ],
            //             }),
            //         ],
            //     });
            //     table.getCell(0, 0).add(new Paragraph("Hello"));
            //     const tree = new Formatter().format(table);
            //     expect(tree)
            //         .to.have.property("w:tbl")
            //         .which.is.an("array");
            //     const row = tree["w:tbl"].find((x) => x["w:tr"]);
            //     expect(row).not.to.be.undefined;
            //     expect(row["w:tr"])
            //         .to.be.an("array")
            //         .which.has.length.at.least(1);
            //     expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
            //         "w:tc": [
            //             {
            //                 "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Hello"] }] }],
            //             },
            //         ],
            //     });
            // });
        });
    });

    describe("#float", () => {
        it("sets the table float properties", () => {
            const table = new Table({
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph("hello")],
                            }),
                        ],
                    }),
                ],
                float: {
                    horizontalAnchor: TableAnchorType.MARGIN,
                    verticalAnchor: TableAnchorType.PAGE,
                    absoluteHorizontalPosition: 10,
                    relativeHorizontalPosition: RelativeHorizontalPosition.CENTER,
                    absoluteVerticalPosition: 20,
                    relativeVerticalPosition: RelativeVerticalPosition.BOTTOM,
                    bottomFromText: 30,
                    topFromText: 40,
                    leftFromText: 50,
                    rightFromText: 60,
                },
            });
            const tree = new Formatter().format(table);
            expect(tree).to.have.property("w:tbl").which.is.an("array").with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    {
                        "w:tblpPr": {
                            _attr: {
                                "w:horzAnchor": "margin",
                                "w:vertAnchor": "page",
                                "w:tblpX": 10,
                                "w:tblpXSpec": "center",
                                "w:tblpY": 20,
                                "w:tblpYSpec": "bottom",
                                "w:bottomFromText": 30,
                                "w:topFromText": 40,
                                "w:leftFromText": 50,
                                "w:rightFromText": 60,
                            },
                        },
                    },
                    WIDTHS,
                    BORDERS,
                ],
            });
        });
    });
});
