import { expect } from "chai";

import { Formatter } from "export/formatter";
import { BorderStyle } from "file/styles";

import { VerticalAlign, VerticalMergeType, WidthType } from "./table-cell-components";
import { TableCellProperties } from "./table-cell-properties";

describe("TableCellProperties", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const properties = new TableCellProperties({});
            // The TableCellProperties is ignorable if there are no attributes,
            // which results in prepForXml returning undefined, which causes
            // the formatter to throw an error if that is the only object it
            // has been asked to format.
            expect(() => new Formatter().format(properties)).to.throw("XMLComponent did not format correctly");
        });

        it("adds grid span", () => {
            const properties = new TableCellProperties({ columnSpan: 1 });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:gridSpan": { _attr: { "w:val": 1 } } }] });
        });

        it("adds vertical merge", () => {
            const properties = new TableCellProperties({ verticalMerge: VerticalMergeType.CONTINUE });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:vMerge": { _attr: { "w:val": "continue" } } }] });
        });

        it("sets vertical align", () => {
            const properties = new TableCellProperties({ verticalAlign: VerticalAlign.BOTTOM });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:vAlign": { _attr: { "w:val": "bottom" } } }] });
        });

        it("should set width", () => {
            const properties = new TableCellProperties({
                width: {
                    size: 1,
                    type: WidthType.DXA,
                },
            });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:tcW": { _attr: { "w:type": "dxa", "w:w": 1 } } }] });
        });

        it("should set width using default of AUTO", () => {
            const properties = new TableCellProperties({
                width: {
                    size: 1,
                },
            });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:tcW": { _attr: { "w:type": "auto", "w:w": 1 } } }] });
        });

        it("sets shading", () => {
            const properties = new TableCellProperties({
                shading: {
                    fill: "test",
                    color: "000",
                },
            });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:shd": { _attr: { "w:fill": "test", "w:color": "000" } } }] });
        });

        it("sets shading", () => {
            const properties = new TableCellProperties({
                margins: {},
            });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({
                "w:tcPr": [
                    {
                        "w:tcMar": [
                            {
                                "w:top": {
                                    _attr: {
                                        "w:type": "dxa",
                                        "w:w": 0,
                                    },
                                },
                            },
                            {
                                "w:start": {
                                    _attr: {
                                        "w:type": "dxa",
                                        "w:w": 0,
                                    },
                                },
                            },
                            {
                                "w:bottom": {
                                    _attr: {
                                        "w:type": "dxa",
                                        "w:w": 0,
                                    },
                                },
                            },
                            {
                                "w:end": {
                                    _attr: {
                                        "w:type": "dxa",
                                        "w:w": 0,
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
        });

        it("should set the TableCellBorders", () => {
            const properties = new TableCellProperties({
                borders: {
                    top: {
                        style: BorderStyle.DASH_DOT_STROKED,
                        color: "red",
                        size: 3,
                    },
                },
            });

            const tree = new Formatter().format(properties);

            expect(tree["w:tcPr"][0]).to.deep.equal({
                "w:tcBorders": [{ "w:top": { _attr: { "w:val": "dashDotStroked", "w:sz": 3, "w:color": "red" } } }],
            });
        });
    });
});
