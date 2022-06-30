/* tslint:disable:no-unused-expression */
import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { AlignmentType, Paragraph } from "../paragraph";
import { Table } from "./table";
import { RelativeHorizontalPosition, RelativeVerticalPosition, TableAnchorType } from "./table-properties";

import { TableCell } from "./table-cell";
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
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 100 } } }, { "w:gridCol": { _attr: { "w:w": 100 } } }],
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
                        "w:tblGrid": [{ "w:gridCol": { _attr: { "w:w": 100 } } }, { "w:gridCol": { _attr: { "w:w": 100 } } }],
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
                                "w:w": "100%",
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
                const row = tree["w:tbl"].find((x) => x["w:tr"]);
                expect(row).not.to.be.undefined;
                expect(row["w:tr"]).to.be.an("array").which.has.length.at.least(1);
                expect(row["w:tr"].find((x) => x["w:tc"])).to.deep.equal({
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
