import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Paragraph } from "@file/paragraph";
import { HeightRule } from "@file/table/table-row/table-row-height";
import { EMPTY_OBJECT, type IContext } from "@file/xml-components";

import { Table } from "../table";
import { TableCell } from "../table-cell";
import { TableRow } from "./table-row";
import { CellSpacingType } from "../table-cell-spacing";

describe("TableRow", () => {
    describe("#CellCount", () => {
        it("counts the cells the row was created with, regardless of column spans", () => {
            const row = new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph("a")] }),
                    new TableCell({ children: [new Paragraph("b")], columnSpan: 2 }),
                ],
            });

            expect(row.CellCount).to.equal(2);
        });
    });

    describe("#constructor", () => {
        it("writes nothing with no cells, as Word can't open a document with a row that has none", () => {
            const tableRow = new TableRow({
                children: [],
            });
            expect(tableRow.prepForXml({ stack: [] } as unknown as IContext)).to.equal(undefined);
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
                children: [new TableCell({ children: [] })],
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
                    { "w:tc": [{ "w:p": EMPTY_OBJECT }] },
                ],
            });
        });

        it("should create with table header", () => {
            const tableRow = new TableRow({
                children: [new TableCell({ children: [] })],
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
                    { "w:tc": [{ "w:p": EMPTY_OBJECT }] },
                ],
            });
        });

        it("should create with inserted revision", () => {
            const tableRow = new TableRow({
                children: [new TableCell({ children: [] })],
                insertion: {
                    id: 1,
                    author: "Firstname Lastname",
                    date: "123",
                },
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:ins": {
                                    _attr: {
                                        "w:author": "Firstname Lastname",
                                        "w:date": "123",
                                        "w:id": 1,
                                    },
                                },
                            },
                        ],
                    },
                    { "w:tc": [{ "w:p": EMPTY_OBJECT }] },
                ],
            });
        });

        it("should create with deleted revision", () => {
            const tableRow = new TableRow({
                children: [new TableCell({ children: [] })],
                deletion: {
                    id: 1,
                    author: "Firstname Lastname",
                    date: "123",
                },
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:del": {
                                    _attr: {
                                        "w:author": "Firstname Lastname",
                                        "w:date": "123",
                                        "w:id": 1,
                                    },
                                },
                            },
                        ],
                    },
                    { "w:tc": [{ "w:p": EMPTY_OBJECT }] },
                ],
            });
        });

        it("should create with properties revision", () => {
            const run = new TableRow({
                children: [new TableCell({ children: [] })],
                cantSplit: false,
                tableHeader: false,
                height: {
                    value: 200,
                    rule: HeightRule.EXACT,
                },
                cellSpacing: {
                    value: 100,
                    type: CellSpacingType.DXA,
                },
                revision: {
                    id: 1,
                    author: "Firstname Lastname",
                    date: "123",
                    cantSplit: true,
                    tableHeader: true,
                    height: {
                        value: 100,
                        rule: HeightRule.EXACT,
                    },
                    cellSpacing: {
                        value: 60,
                        type: CellSpacingType.DXA,
                    },
                },
            });
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:trPr": [
                            {
                                "w:cantSplit": {
                                    _attr: {
                                        "w:val": "off",
                                    },
                                },
                            },
                            {
                                "w:tblHeader": {
                                    _attr: {
                                        "w:val": "off",
                                    },
                                },
                            },
                            {
                                "w:trHeight": {
                                    _attr: {
                                        "w:hRule": "exact",
                                        "w:val": 200,
                                    },
                                },
                            },
                            {
                                "w:tblCellSpacing": {
                                    _attr: {
                                        "w:type": "dxa",
                                        "w:w": 100,
                                    },
                                },
                            },
                            {
                                "w:trPrChange": [
                                    {
                                        _attr: {
                                            "w:author": "Firstname Lastname",
                                            "w:date": "123",
                                            "w:id": 1,
                                        },
                                    },
                                    {
                                        "w:trPr": [
                                            {
                                                "w:cantSplit": {},
                                            },
                                            {
                                                "w:tblHeader": {},
                                            },
                                            {
                                                "w:trHeight": {
                                                    _attr: {
                                                        "w:hRule": "exact",
                                                        "w:val": 100,
                                                    },
                                                },
                                            },
                                            {
                                                "w:tblCellSpacing": {
                                                    _attr: {
                                                        "w:type": "dxa",
                                                        "w:w": 60,
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    { "w:tc": [{ "w:p": EMPTY_OBJECT }] },
                ],
            });
        });

        it("should set row height", () => {
            const tableRow = new TableRow({
                children: [new TableCell({ children: [] })],
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
                    { "w:tc": [{ "w:p": EMPTY_OBJECT }] },
                ],
            });
        });
    });

    describe("#keepNext", () => {
        it("keeps each paragraph in the row's cells with the next, after its style", () => {
            const tableRow = new TableRow({
                keepNext: true,
                children: [
                    new TableCell({ children: [new Paragraph("a")] }),
                    new TableCell({ children: [new Paragraph({ text: "b", style: "Strong", keepLines: true })] }),
                ],
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    {
                        "w:tc": [
                            {
                                "w:p": [
                                    { "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] },
                                    { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "a"] }] },
                                ],
                            },
                        ],
                    },
                    {
                        "w:tc": [
                            {
                                "w:p": [
                                    {
                                        "w:pPr": [
                                            { "w:pStyle": { _attr: { "w:val": "Strong" } } },
                                            { "w:keepNext": EMPTY_OBJECT },
                                            { "w:keepLines": EMPTY_OBJECT },
                                        ],
                                    },
                                    { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "b"] }] },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("keeps the paragraph a cell is given when it has none", () => {
            const tableRow = new TableRow({ keepNext: true, children: [new TableCell({ children: [] })] });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [{ "w:tc": [{ "w:p": [{ "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] }] }] }],
            });
        });

        it("leaves a paragraph's own keepNext as it is", () => {
            const tableRow = new TableRow({
                keepNext: true,
                children: [new TableCell({ children: [new Paragraph({ keepNext: false })] })],
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [{ "w:tc": [{ "w:p": [{ "w:pPr": [{ "w:keepNext": { _attr: { "w:val": false } } }] }] }] }],
            });
        });

        it("turns keepNext off with false", () => {
            const tableRow = new TableRow({ keepNext: false, children: [new TableCell({ children: [new Paragraph({})] })] });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [{ "w:tc": [{ "w:p": [{ "w:pPr": [{ "w:keepNext": { _attr: { "w:val": false } } }] }] }] }],
            });
        });

        it("leaves the paragraphs of a table nested in a cell alone", () => {
            const tableRow = new TableRow({
                keepNext: true,
                children: [
                    new TableCell({
                        children: [new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({})] })] })] })],
                    }),
                ],
            });
            const tree = new Formatter().format(tableRow);
            const [nestedTable, lastParagraph] = tree["w:tr"][0]["w:tc"];
            expect(JSON.stringify(nestedTable)).not.to.contain("w:keepNext");
            expect(lastParagraph).to.deep.equal({ "w:p": [{ "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] }] });
        });

        it("leaves the row's own properties as they are", () => {
            const tableRow = new TableRow({
                keepNext: true,
                cantSplit: true,
                children: [new TableCell({ children: [new Paragraph({})] })],
            });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({
                "w:tr": [
                    { "w:trPr": [{ "w:cantSplit": EMPTY_OBJECT }] },
                    { "w:tc": [{ "w:p": [{ "w:pPr": [{ "w:keepNext": EMPTY_OBJECT }] }] }] },
                ],
            });
        });

        it("writes nothing more without it", () => {
            const tableRow = new TableRow({ children: [new TableCell({ children: [new Paragraph({})] })] });
            const tree = new Formatter().format(tableRow);
            expect(tree).to.deep.equal({ "w:tr": [{ "w:tc": [{ "w:p": EMPTY_OBJECT }] }] });
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
