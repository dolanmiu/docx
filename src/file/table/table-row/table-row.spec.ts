import { expect } from "chai";

import { Formatter } from "export/formatter";

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

    // describe("#mergeCells", () => {
    //     it("should merge the cell", () => {
    //         const tableRow = new TableRow({
    //             children: [
    //                 new TableCell({
    //                     children: [],
    //                 }),
    //                 new TableCell({
    //                     children: [],
    //                 }),
    //             ],
    //         });

    //         tableRow.mergeCells(0, 1);
    //         expect(() => tableRow.getCell(1)).to.throw();
    //     });
    // });
});
