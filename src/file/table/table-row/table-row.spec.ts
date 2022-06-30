import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Paragraph } from "@file/paragraph";
import { HeightRule } from "@file/table/table-row/table-row-height";
import { EMPTY_OBJECT } from "@file/xml-components";
import { TableCell } from "../table-cell";
import { TableRow } from "./table-row";

describe("TableRow", () => {
    describe("#constructor", () => {
        it("should create with no cells", () => {
            const tableRow = new TableRow({
                children: [],
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": EMPTY_OBJECT,
            });
        });

        it("should create with one cell", () => {
            const tableRow = new TableRow({
                children: [
                    new TableCell({
                        children: [],
                    }),
                ],
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:tc": [
                            {
                                "w:p": EMPTY_OBJECT,
                            },
                        ],
                    },
                ],
            });
        });

        it("should create with cant split", () => {
            const tableRow = new TableRow({
                children: [],
                cantSplit: true,
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:cantSplit": {},
                            },
                        ],
                    },
                ],
            });
        });

        it("should create with table header", () => {
            const tableRow = new TableRow({
                children: [],
                tableHeader: true,
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:tblHeader": {},
                            },
                        ],
                    },
                ],
            });
        });

        it("should set row height", () => {
            const tableRow = new TableRow({
                children: [],
                height: {
                    value: 100,
                    rule: HeightRule.EXACT,
                },
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:trHeight": {
                                    _attr: {
                                        "w:hRule": "exact",
                                        "w:val": 100,
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#addCellToIndex", () => {
        it("should add cell to correct index with no initial properties", () => {
            const tableRow = new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                ],
                tableHeader: true,
            });

            tableRow.addCellToIndex(
                new TableCell({
                    children: [],
                }),
                0,
            );

            const tree = new Formatter().format(tableRow);

            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:tblHeader": {},
                            },
                        ],
                    },
                    {
                        "w:tc": [
                            {
                                "w:p": {},
                            },
                        ],
                    },
                    {
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
                                                    "test",
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#rootIndexToColumnIndex", () => {
        it("should get the correct virtual column index by root index", () => {
            const tableRow = new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("test")],
                        columnSpan: 3,
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                        columnSpan: 3,
                    }),
                ],
            });

            expect(tableRow.rootIndexToColumnIndex(1)).to.equal(0);
            expect(tableRow.rootIndexToColumnIndex(2)).to.equal(3);
            expect(tableRow.rootIndexToColumnIndex(3)).to.equal(4);
            expect(tableRow.rootIndexToColumnIndex(4)).to.equal(5);

            expect(() => tableRow.rootIndexToColumnIndex(0)).to.throw(`cell 'rootIndex' should between 1 to 4`);
            expect(() => tableRow.rootIndexToColumnIndex(5)).to.throw(`cell 'rootIndex' should between 1 to 4`);
        });
    });

    describe("#columnIndexToRootIndex", () => {
        it("should get the correct root index by virtual column index", () => {
            const tableRow = new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("test")],
                        columnSpan: 3,
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                        columnSpan: 3,
                    }),
                ],
            });

            expect(tableRow.columnIndexToRootIndex(0)).to.equal(1);
            expect(tableRow.columnIndexToRootIndex(1)).to.equal(1);
            expect(tableRow.columnIndexToRootIndex(2)).to.equal(1);

            expect(tableRow.columnIndexToRootIndex(3)).to.equal(2);
            expect(tableRow.columnIndexToRootIndex(4)).to.equal(3);

            expect(tableRow.columnIndexToRootIndex(5)).to.equal(4);
            expect(tableRow.columnIndexToRootIndex(6)).to.equal(4);
            expect(tableRow.columnIndexToRootIndex(7)).to.equal(4);

            expect(() => tableRow.columnIndexToRootIndex(-1)).to.throw(`cell 'columnIndex' should not less than zero`);
            expect(() => tableRow.columnIndexToRootIndex(8)).to.throw(`cell 'columnIndex' should not great than 7`);
        });

        it("should allow end new cell index", () => {
            const tableRow = new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph("test")],
                        columnSpan: 3,
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                    }),
                    new TableCell({
                        children: [new Paragraph("test")],
                        columnSpan: 3,
                    }),
                ],
            });

            expect(tableRow.columnIndexToRootIndex(8, true)).to.equal(5);
            // for column 10, just place the new cell at the end of row
            expect(tableRow.columnIndexToRootIndex(10, true)).to.equal(5);
        });
    });
});
