import { expect } from "chai";

import { Formatter } from "export/formatter";
import { BorderStyle } from "file/styles";

import { VerticalAlign, VMergeType, WidthType } from "./table-cell-components";
import { TableCellProperties } from "./table-cell-properties";

describe("TableCellProperties", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const cellMargain = new TableCellProperties();
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [] });
        });
    });

    describe("#addGridSpan", () => {
        it("adds grid span", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.addGridSpan(1);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:gridSpan": [{ _attr: { "w:val": 1 } }] }] });
        });
    });

    describe("#addVerticalMerge", () => {
        it("adds vertical merge", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.addVerticalMerge(VMergeType.CONTINUE);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:vMerge": [{ _attr: { "w:val": "continue" } }] }] });
        });
    });

    describe("#setVerticalAlign", () => {
        it("sets vertical align", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.setVerticalAlign(VerticalAlign.BOTTOM);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:vAlign": [{ _attr: { "w:val": "bottom" } }] }] });
        });
    });

    describe("#setWidth", () => {
        it("should set width", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.setWidth(1, WidthType.DXA);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:tcW": [{ _attr: { "w:type": "dxa", "w:w": 1 } }] }] });
        });

        it("should set width using default of AUTO", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.setWidth(1);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:tcW": [{ _attr: { "w:type": "auto", "w:w": 1 } }] }] });
        });
    });

    describe("#setShading", () => {
        it("sets shading", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.setShading({
                fill: "test",
                color: "000",
            });
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tcPr": [{ "w:shd": [{ _attr: { "w:fill": "test", "w:color": "000" } }] }] });
        });
    });

    describe("#Borders", () => {
        it("should return the TableCellBorders if Border has borders", () => {
            const cellMargain = new TableCellProperties();
            cellMargain.Borders.addTopBorder(BorderStyle.DASH_DOT_STROKED, 3, "red");
            const borders = cellMargain.Borders;

            const tree = new Formatter().format(borders);

            expect(tree).to.deep.equal({
                "w:tcBorders": [{ "w:top": [{ _attr: { "w:val": "dashDotStroked", "w:sz": 3, "w:color": "red" } }] }],
            });
        });
    });
});
