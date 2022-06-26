import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";
import { ShadingType } from "@file/shading";
import { VerticalAlign } from "@file/vertical-align";

import { WidthType } from "../table-width";
import { TableCell } from "./table-cell";
import { TableCellBorders, TextDirection, VerticalMergeType } from "./table-cell-components";

describe("TableCellBorders", () => {
    describe("#prepForXml", () => {
        it("should not add empty borders element if there are no borders defined", () => {
            const tb = new TableCellBorders({});
            expect(() => new Formatter().format(tb)).to.throw();
        });
    });

    describe("#addingBorders", () => {
        it("should add top border", () => {
            const tb = new TableCellBorders({
                top: {
                    style: BorderStyle.DOTTED,
                    size: 1,
                    color: "FF00FF",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:top": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 1,
                                "w:val": "dotted",
                            },
                        },
                    },
                ],
            });
        });

        it("should add start(left) border", () => {
            const tb = new TableCellBorders({
                start: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: "FF00FF",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:start": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 2,
                                "w:val": "single",
                            },
                        },
                    },
                ],
            });
        });

        it("should add bottom border", () => {
            const tb = new TableCellBorders({
                bottom: {
                    style: BorderStyle.DOUBLE,
                    size: 1,
                    color: "FF00FF",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:bottom": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 1,
                                "w:val": "double",
                            },
                        },
                    },
                ],
            });
        });

        it("should add end(right) border", () => {
            const tb = new TableCellBorders({
                end: {
                    style: BorderStyle.THICK,
                    size: 3,
                    color: "FF0000",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:end": {
                            _attr: {
                                "w:color": "FF0000",
                                "w:sz": 3,
                                "w:val": "thick",
                            },
                        },
                    },
                ],
            });
        });

        it("should add left border", () => {
            const tb = new TableCellBorders({
                left: {
                    style: BorderStyle.THICK,
                    size: 3,
                    color: "FF00FF",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:left": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 3,
                                "w:val": "thick",
                            },
                        },
                    },
                ],
            });
        });

        it("should add right border", () => {
            const tb = new TableCellBorders({
                right: {
                    style: BorderStyle.THICK,
                    size: 3,
                    color: "FF00FF",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:right": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 3,
                                "w:val": "thick",
                            },
                        },
                    },
                ],
            });
        });

        it("should add multiple borders", () => {
            const tb = new TableCellBorders({
                top: {
                    style: BorderStyle.DOTTED,
                    size: 1,
                    color: "FF00FF",
                },
                end: {
                    style: BorderStyle.THICK,
                    size: 3,
                    color: "FF00FF",
                },
                bottom: {
                    style: BorderStyle.DOUBLE,
                    size: 1,
                    color: "FF00FF",
                },
                start: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: "FF00FF",
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: "FF00FF",
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: "FF00FF",
                },
            });

            const tree = new Formatter().format(tb);
            expect(tree).to.deep.equal({
                "w:tcBorders": [
                    {
                        "w:top": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 1,
                                "w:val": "dotted",
                            },
                        },
                    },
                    {
                        "w:start": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 2,
                                "w:val": "single",
                            },
                        },
                    },
                    {
                        "w:left": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 2,
                                "w:val": "single",
                            },
                        },
                    },
                    {
                        "w:bottom": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 1,
                                "w:val": "double",
                            },
                        },
                    },
                    {
                        "w:end": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 3,
                                "w:val": "thick",
                            },
                        },
                    },
                    {
                        "w:right": {
                            _attr: {
                                "w:color": "FF00FF",
                                "w:sz": 2,
                                "w:val": "single",
                            },
                        },
                    },
                ],
            });
        });
    });
});

describe("TableCell", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const cell = new TableCell({
                children: [],
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with vertical align", () => {
            const cell = new TableCell({
                children: [],
                verticalAlign: VerticalAlign.CENTER,
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:vAlign": {
                                    _attr: {
                                        "w:val": "center",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with text direction", () => {
            const cell = new TableCell({
                children: [],
                textDirection: TextDirection.BOTTOM_TO_TOP_LEFT_TO_RIGHT,
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:textDirection": {
                                    _attr: {
                                        "w:val": "btLr",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with vertical merge", () => {
            const cell = new TableCell({
                children: [],
                verticalMerge: VerticalMergeType.RESTART,
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:vMerge": {
                                    _attr: {
                                        "w:val": "restart",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with margins", () => {
            const cell = new TableCell({
                children: [],
                margins: {
                    top: 1,
                    left: 1,
                    bottom: 1,
                    right: 1,
                },
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:tcMar": [
                                    {
                                        "w:top": {
                                            _attr: {
                                                "w:type": "dxa",
                                                "w:w": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:left": {
                                            _attr: {
                                                "w:type": "dxa",
                                                "w:w": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:bottom": {
                                            _attr: {
                                                "w:type": "dxa",
                                                "w:w": 1,
                                            },
                                        },
                                    },
                                    {
                                        "w:right": {
                                            _attr: {
                                                "w:type": "dxa",
                                                "w:w": 1,
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with shading", () => {
            const cell = new TableCell({
                children: [],
                shading: {
                    fill: "FF0000",
                    color: "0000ff",
                    type: ShadingType.PERCENT_10,
                },
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:shd": {
                                    _attr: {
                                        "w:color": "0000ff",
                                        "w:fill": "FF0000",
                                        "w:val": "pct10",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with width", () => {
            const cell = new TableCell({
                children: [],
                width: { size: 100, type: WidthType.DXA },
            });
            const tree = new Formatter().format(cell);
            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:tcW": {
                                    _attr: {
                                        "w:type": "dxa",
                                        "w:w": 100,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        it("should create with column span", () => {
            const cell = new TableCell({
                children: [],
                columnSpan: 2,
            });

            const tree = new Formatter().format(cell);

            expect(tree).to.deep.equal({
                "w:tc": [
                    {
                        "w:tcPr": [
                            {
                                "w:gridSpan": {
                                    _attr: {
                                        "w:val": 2,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "w:p": {},
                    },
                ],
            });
        });

        describe("rowSpan", () => {
            it("should not create with row span if its less than 1", () => {
                const cell = new TableCell({
                    children: [],
                    rowSpan: 0,
                });

                const tree = new Formatter().format(cell);

                expect(tree).to.deep.equal({
                    "w:tc": [
                        {
                            "w:p": {},
                        },
                    ],
                });
            });

            it("should create with row span if its greater than 1", () => {
                const cell = new TableCell({
                    children: [],
                    rowSpan: 2,
                });

                const tree = new Formatter().format(cell);

                expect(tree).to.deep.equal({
                    "w:tc": [
                        {
                            "w:tcPr": [
                                {
                                    "w:vMerge": {
                                        _attr: {
                                            "w:val": "restart",
                                        },
                                    },
                                },
                            ],
                        },
                        {
                            "w:p": {},
                        },
                    ],
                });
            });

            it("should create with borders", () => {
                const cell = new TableCell({
                    children: [],
                    borders: {
                        top: {
                            style: BorderStyle.DASH_DOT_STROKED,
                            size: 3,
                            color: "FF0000",
                        },
                        bottom: {
                            style: BorderStyle.DOUBLE,
                            size: 3,
                            color: "0000ff",
                        },
                        left: {
                            style: BorderStyle.DASH_DOT_STROKED,
                            size: 3,
                            color: "00ff00",
                        },
                        right: {
                            style: BorderStyle.DASH_DOT_STROKED,
                            size: 3,
                            color: "#ff8000",
                        },
                    },
                });

                const tree = new Formatter().format(cell);

                expect(tree).to.deep.equal({
                    "w:tc": [
                        {
                            "w:tcPr": [
                                {
                                    "w:tcBorders": [
                                        {
                                            "w:top": {
                                                _attr: {
                                                    "w:color": "FF0000",
                                                    "w:sz": 3,
                                                    "w:val": "dashDotStroked",
                                                },
                                            },
                                        },
                                        {
                                            "w:left": {
                                                _attr: {
                                                    "w:color": "00ff00",
                                                    "w:sz": 3,
                                                    "w:val": "dashDotStroked",
                                                },
                                            },
                                        },
                                        {
                                            "w:bottom": {
                                                _attr: {
                                                    "w:color": "0000ff",
                                                    "w:sz": 3,
                                                    "w:val": "double",
                                                },
                                            },
                                        },
                                        {
                                            "w:right": {
                                                _attr: {
                                                    "w:color": "ff8000",
                                                    "w:sz": 3,
                                                    "w:val": "dashDotStroked",
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            "w:p": {},
                        },
                    ],
                });
            });
        });
    });
});
