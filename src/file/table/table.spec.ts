/* tslint:disable:no-unused-expression */
import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Paragraph } from "../paragraph";
import { Table } from "./table";
// import { WidthType } from "./table-cell";
import { RelativeHorizontalPosition, RelativeVerticalPosition, TableAnchorType } from "./table-properties";

import { EMPTY_OBJECT } from "file/xml-components";

const DEFAULT_TABLE_PROPERTIES = {
    "w:tblCellMar": [
        {
            "w:bottom": {
                _attr: {
                    "w:type": "auto",
                    "w:w": 0,
                },
            },
        },
        {
            "w:top": {
                _attr: {
                    "w:type": "auto",
                    "w:w": 0,
                },
            },
        },
        {
            "w:left": {
                _attr: {
                    "w:type": "auto",
                    "w:w": 0,
                },
            },
        },
        {
            "w:right": {
                _attr: {
                    "w:type": "auto",
                    "w:w": 0,
                },
            },
        },
    ],
};

const BORDERS = {
    "w:tblBorders": [
        { "w:top": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
        { "w:left": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
        { "w:bottom": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
        { "w:right": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
        { "w:insideH": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
        { "w:insideV": { _attr: { "w:val": "single", "w:sz": 4, "w:space": 0, "w:color": "auto" } } },
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
                rows: 3,
                columns: 2,
            });
            const tree = new Formatter().format(table);
            const cell = { "w:tc": [{ "w:p": EMPTY_OBJECT }] };
            expect(tree).to.deep.equal({
                "w:tbl": [
                    { "w:tblPr": [DEFAULT_TABLE_PROPERTIES, BORDERS, WIDTHS] },
                    {
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 100 } } }, { "w:gridCol": { _attr: { "w:w": 100 } } }],
                    },
                    { "w:tr": [cell, cell] },
                    { "w:tr": [cell, cell] },
                    { "w:tr": [cell, cell] },
                ],
            });
        });
    });

    describe("#getRow and Row#getCell", () => {
        const table = new Table({
            rows: 2,
            columns: 2,
        });

        it("should return the correct row", () => {
            table
                .getRow(0)
                .getCell(0)
                .addParagraph(new Paragraph("A1"));
            table
                .getRow(0)
                .getCell(1)
                .addParagraph(new Paragraph("B1"));
            table
                .getRow(1)
                .getCell(0)
                .addParagraph(new Paragraph("A2"));
            table
                .getRow(1)
                .getCell(1)
                .addParagraph(new Paragraph("B2"));
            const tree = new Formatter().format(table);
            const cell = (c) => ({
                "w:tc": [
                    {
                        "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, c] }] }],
                    },
                ],
            });
            expect(tree).to.deep.equal({
                "w:tbl": [
                    { "w:tblPr": [DEFAULT_TABLE_PROPERTIES, BORDERS, WIDTHS] },
                    {
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 100 } } }, { "w:gridCol": { _attr: { "w:w": 100 } } }],
                    },
                    { "w:tr": [cell("A1"), cell("B1")] },
                    { "w:tr": [cell("A2"), cell("B2")] },
                ],
            });
        });

        it("throws an exception if index is out of bounds", () => {
            expect(() => table.getCell(9, 9)).to.throw();
        });
    });

    describe("#getColumn", () => {
        const table = new Table({
            rows: 2,
            columns: 2,
        });

        it("should get correct cell", () => {
            const column = table.getColumn(0);

            expect(column.getCell(0)).to.equal(table.getCell(0, 0));
            expect(column.getCell(1)).to.equal(table.getCell(1, 0));
        });
    });

    describe("#getCell", () => {
        it("should returns the correct cell", () => {
            const table = new Table({
                rows: 2,
                columns: 2,
            });
            table.getCell(0, 0).addParagraph(new Paragraph("A1"));
            table.getCell(0, 1).addParagraph(new Paragraph("B1"));
            table.getCell(1, 0).addParagraph(new Paragraph("A2"));
            table.getCell(1, 1).addParagraph(new Paragraph("B2"));
            const tree = new Formatter().format(table);
            const cell = (c) => ({
                "w:tc": [
                    {
                        "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, c] }] }],
                    },
                ],
            });
            expect(tree).to.deep.equal({
                "w:tbl": [
                    { "w:tblPr": [DEFAULT_TABLE_PROPERTIES, BORDERS, WIDTHS] },
                    {
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 100 } } }, { "w:gridCol": { _attr: { "w:w": 100 } } }],
                    },
                    { "w:tr": [cell("A1"), cell("B1")] },
                    { "w:tr": [cell("A2"), cell("B2")] },
                ],
            });
        });
    });

    // describe("#setWidth", () => {
    //     it("should set the preferred width on the table", () => {
    //         const table = new Table({rows: 1,columns: 1,}).setWidth(1000, WidthType.PERCENTAGE);
    //         const tree = new Formatter().format(table);
    //         expect(tree)
    //             .to.have.property("w:tbl")
    //             .which.is.an("array")
    //             .with.has.length.at.least(1);
    //         expect(tree["w:tbl"][0]).to.deep.equal({
    //             "w:tblPr": [DEFAULT_TABLE_PROPERTIES, { "w:tblW": { _attr: { "w:type": "pct", "w:w": "1000%" } } }],
    //         });
    //     });

    //     it("sets the preferred width on the table with a default of AUTO", () => {
    //         const table = new Table({rows: 1,columns: 1,}).setWidth(1000);
    //         const tree = new Formatter().format(table);

    //         expect(tree["w:tbl"][0]).to.deep.equal({
    //             "w:tblPr": [DEFAULT_TABLE_PROPERTIES, { "w:tblW": { _attr: { "w:type": "auto", "w:w": 1000 } } }],
    //         });
    //     });
    // });

    describe("#setFixedWidthLayout", () => {
        it("sets the table to fixed width layout", () => {
            const table = new Table({
                rows: 1,
                columns: 1,
            }).setFixedWidthLayout();
            const tree = new Formatter().format(table);
            expect(tree)
                .to.have.property("w:tbl")
                .which.is.an("array")
                .with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [DEFAULT_TABLE_PROPERTIES, BORDERS, WIDTHS, { "w:tblLayout": { _attr: { "w:type": "fixed" } } }],
            });
        });
    });

    describe("Cell", () => {
        describe("#prepForXml", () => {
            it("inserts a paragraph at the end of the cell if it is empty", () => {
                const table = new Table({
                    rows: 1,
                    columns: 1,
                });
                const tree = new Formatter().format(table);
                expect(tree)
                    .to.have.property("w:tbl")
                    .which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"])
                    .to.be.an("array")
                    .which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
                    "w:tc": [{ "w:p": EMPTY_OBJECT }],
                });
            });

            it("inserts a paragraph at the end of the cell even if it has a child table", () => {
                const parentTable = new Table({
                    rows: 1,
                    columns: 1,
                });
                parentTable.getCell(0, 0).addTable(
                    new Table({
                        rows: 1,
                        columns: 1,
                    }),
                );
                const tree = new Formatter().format(parentTable);
                expect(tree)
                    .to.have.property("w:tbl")
                    .which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"])
                    .to.be.an("array")
                    .which.has.length.at.least(1);
                const cell = row["w:tr"].find((x) => x["w:tc"]);
                expect(cell).not.to.be.undefined;
                expect(cell["w:tc"][cell["w:tc"].length - 1]).to.deep.equal({
                    "w:p": EMPTY_OBJECT,
                });
            });

            it("does not insert a paragraph if it already ends with one", () => {
                const parentTable = new Table({
                    rows: 1,
                    columns: 1,
                });
                parentTable.getCell(0, 0).addParagraph(new Paragraph("Hello"));
                const tree = new Formatter().format(parentTable);
                expect(tree)
                    .to.have.property("w:tbl")
                    .which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"])
                    .to.be.an("array")
                    .which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
                    "w:tc": [
                        {
                            "w:p": [{ "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Hello"] }] }],
                        },
                    ],
                });
            });
        });

        describe("#createParagraph", () => {
            it("inserts a new paragraph in the cell", () => {
                const table = new Table({
                    rows: 1,
                    columns: 1,
                });
                const para = table.getCell(0, 0).createParagraph("Test paragraph");
                expect(para).to.be.an.instanceof(Paragraph);
                const tree = new Formatter().format(table);
                expect(tree)
                    .to.have.property("w:tbl")
                    .which.is.an("array");
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"])
                    .to.be.an("array")
                    .which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
                    "w:tc": [
                        {
                            "w:p": [
                                {
                                    "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "Test paragraph"] }],
                                },
                            ],
                        },
                    ],
                });
            });
        });
    });

    describe("#float", () => {
        it("sets the table float properties", () => {
            const table = new Table({
                rows: 1,
                columns: 1,
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
            expect(tree)
                .to.have.property("w:tbl")
                .which.is.an("array")
                .with.has.length.at.least(1);
            expect(tree["w:tbl"][0]).to.deep.equal({
                "w:tblPr": [
                    DEFAULT_TABLE_PROPERTIES,
                    BORDERS,
                    WIDTHS,
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
                ],
            });
        });
    });
});
