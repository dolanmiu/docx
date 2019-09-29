import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Paragraph } from "file/paragraph";
import { HeightRule } from "file/table/table-row/table-row-height";
import { EMPTY_OBJECT } from "file/xml-components";
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
                                "w:cantSplit": {
                                    _attr: {
                                        "w:val": true,
                                    },
                                },
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
                                "w:tblHeader": {
                                    _attr: {
                                        "w:val": true,
                                    },
                                },
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
                    height: 100,
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
                                "w:tblHeader": {
                                    _attr: {
                                        "w:val": true,
                                    },
                                },
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
});
