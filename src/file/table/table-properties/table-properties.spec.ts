import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { AlignmentType } from "@file/paragraph";
import { ShadingType } from "@file/shading";

import { WidthType } from "../table-width";
import { TableLayoutType } from "./table-layout";
import { TableProperties } from "./table-properties";

describe("TableProperties", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const tp = new TableProperties({});
            // The TableProperties is ignorable if there are no attributes,
            // which results in prepForXml returning undefined, which causes
            // the formatter to throw an error if that is the only object it
            // has been asked to format.
            expect(() => new Formatter().format(tp)).to.throw("XMLComponent did not format correctly");
        });

        it("should add a table style property", () => {
            const tp = new TableProperties({
                style: "TableNormal",
            });
            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblStyle": { _attr: { "w:val": "TableNormal" } } }],
            });
        });

        it("should add a table width property", () => {
            const tp = new TableProperties({
                width: {
                    size: 1234,
                    type: WidthType.DXA,
                },
            });
            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblW": { _attr: { "w:type": "dxa", "w:w": 1234 } } }],
            });
        });

        it("should add a table width property with default of AUTO", () => {
            const tp = new TableProperties({
                width: {
                    size: 1234,
                },
            });

            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblW": { _attr: { "w:type": "auto", "w:w": 1234 } } }],
            });
        });

        it("should add a table indent property", () => {
            const tp = new TableProperties({
                indent: {
                    size: 1234,
                    type: WidthType.DXA,
                },
            });
            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblInd": { _attr: { "w:type": "dxa", "w:w": 1234 } } }],
            });
        });

        it("should add a table indent property with default of AUTO", () => {
            const tp = new TableProperties({
                indent: {
                    size: 1234,
                },
            });

            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblInd": { _attr: { "w:type": "auto", "w:w": 1234 } } }],
            });
        });

        it("sets the table to fixed width layout", () => {
            const tp = new TableProperties({
                layout: TableLayoutType.FIXED,
            });

            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblLayout": { _attr: { "w:type": "fixed" } } }],
            });
        });
    });

    describe("#cellMargin", () => {
        it("adds a table cell top margin", () => {
            const tp = new TableProperties({
                cellMargin: {
                    marginUnitType: WidthType.DXA,
                    top: 1234,
                },
            });

            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblCellMar": [{ "w:top": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] }],
            });
        });

        it("adds a table cell left margin", () => {
            const tp = new TableProperties({
                cellMargin: {
                    marginUnitType: WidthType.DXA,
                    left: 1234,
                },
            });

            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [{ "w:tblCellMar": [{ "w:left": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] }],
            });
        });
    });

    describe("#setShading", () => {
        it("sets the shading of the table", () => {
            const tp = new TableProperties({
                shading: {
                    fill: "b79c2f",
                    type: ShadingType.REVERSE_DIAGONAL_STRIPE,
                    color: "auto",
                },
            });

            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [
                    {
                        "w:shd": {
                            _attr: {
                                "w:color": "auto",
                                "w:fill": "b79c2f",
                                "w:val": "reverseDiagStripe",
                            },
                        },
                    },
                ],
            });
        });
    });

    describe("#setAlignment", () => {
        it("sets the alignment of the table", () => {
            const tp = new TableProperties({
                alignment: AlignmentType.CENTER,
            });
            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [
                    {
                        "w:jc": {
                            _attr: {
                                "w:val": "center",
                            },
                        },
                    },
                ],
            });
        });
    });

    describe("#Set Virtual Right to Left", () => {
        it("sets the alignment of the table", () => {
            const tp = new TableProperties({
                visuallyRightToLeft: true,
            });
            const tree = new Formatter().format(tp);
            expect(tree).to.deep.equal({
                "w:tblPr": [
                    {
                        "w:bidiVisual": {},
                    },
                ],
            });
        });
    });
});
