import { expect } from "chai";

import { Formatter } from "export/formatter";
import { BorderStyle } from "file/styles";

import { TableCellBorders, TableCellWidth, WidthType } from "./table-cell-components";

describe("TableCellBorders", () => {
    describe("#prepForXml", () => {
        it("should not add empty borders element if there are no borders defined", () => {
            const tb = new TableCellBorders();
            expect(() => new Formatter().format(tb)).to.throw();
        });
    });

    describe("#addingBorders", () => {
        it("should add top border", () => {
            const tb = new TableCellBorders();
            tb.addTopBorder(BorderStyle.DOTTED, 1, "FF00FF");

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:top": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 1,
                                    "w:val": "dotted",
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should add start(left) border", () => {
            const tb = new TableCellBorders();
            tb.addStartBorder(BorderStyle.SINGLE, 2, "FF00FF");

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:start": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 2,
                                    "w:val": "single",
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should add bottom border", () => {
            const tb = new TableCellBorders();
            tb.addBottomBorder(BorderStyle.DOUBLE, 1, "FF00FF");

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:bottom": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should add end(right) border", () => {
            const tb = new TableCellBorders();
            tb.addEndBorder(BorderStyle.THICK, 3, "FF00FF");

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:end": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 3,
                                    "w:val": "thick",
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should add multiple borders", () => {
            const tb = new TableCellBorders();
            tb.addTopBorder(BorderStyle.DOTTED, 1, "FF00FF");
            tb.addEndBorder(BorderStyle.THICK, 3, "FF00FF");
            tb.addBottomBorder(BorderStyle.DOUBLE, 1, "FF00FF");
            tb.addStartBorder(BorderStyle.SINGLE, 2, "FF00FF");

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:top": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 1,
                                    "w:val": "dotted",
                                },
                            },
                        ],
                    },
                    {
                        "w:end": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 3,
                                    "w:val": "thick",
                                },
                            },
                        ],
                    },
                    {
                        "w:bottom": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 1,
                                    "w:val": "double",
                                },
                            },
                        ],
                    },
                    {
                        "w:start": [
                            {
                                _attr: {
                                    "w:color": "FF00FF",
                                    "w:sz": 2,
                                    "w:val": "single",
                                },
                            },
                        ],
                    },
                ],
            });
        });
    });
});

describe("TableCellWidth", () => {
    describe("#constructor", () => {
        it("should create object", () => {
            const tcWidth = new TableCellWidth(100, WidthType.DXA);
            const tree = new Formatter().format(tcWidth);
            expect(tree).to.deep.equal({
                "w:tcW": [
                    {
                        _attr: {
                            "w:type": "dxa",
                            "w:w": 100,
                        },
                    },
                ],
            });
        });
    });
});
