import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { BorderStyle } from "@file/border";
import { VerticalAlign } from "@file/vertical-align";

import { WidthType } from "../table-width";

import { VerticalMergeType } from "./table-cell-components";
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
                    fill: "ffffff",
                    color: "000000",
                },
            });
            const tree = new Formatter().format(properties);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:shd": { _attr: { "w:fill": "ffffff", "w:color": "000000" } } }] });
        });

        it("should set the TableCellBorders", () => {
            const properties = new TableCellProperties({
                borders: {
                    top: {
                        style: BorderStyle.DASH_DOT_STROKED,
                        color: "ff0000",
                        size: 3,
                    },
                },
            });

            const tree = new Formatter().format(properties);

            expect(tree["w:tcPr"][0]).to.deep.equal({
                "w:tcBorders": [{ "w:top": { _attr: { "w:val": "dashDotStroked", "w:sz": 3, "w:color": "ff0000" } } }],
            });
        });

        it("should set the margins", () => {
            const properties = new TableCellProperties({
                margins: {
                    marginUnitType: WidthType.DXA,
                    top: 5,
                    left: 10,
                    bottom: 15,
                    right: 20,
                },
            });

            const tree = new Formatter().format(properties);

            expect(tree["w:tcPr"][0]).to.deep.equal({
                "w:tcMar": [
                    { "w:top": { _attr: { "w:type": "dxa", "w:w": 5 } } },
                    { "w:left": { _attr: { "w:type": "dxa", "w:w": 10 } } },
                    { "w:bottom": { _attr: { "w:type": "dxa", "w:w": 15 } } },
                    { "w:right": { _attr: { "w:type": "dxa", "w:w": 20 } } },
                ],
            });
        });
    });
});
