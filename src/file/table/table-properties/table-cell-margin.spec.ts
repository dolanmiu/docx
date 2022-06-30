import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { WidthType } from "../table-width";

import { TableCellMargin, TableCellMarginElementType } from "./table-cell-margin";

describe("TableCellMargin", () => {
    describe("#constructor", () => {
        it("should throw an error if theres no child elements", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {});
            expect(() => new Formatter().format(cellMargin)).to.throw();
        });
    });

    describe("#addTopMargin", () => {
        it("should add a table cell top margin", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                marginUnitType: WidthType.DXA,
                top: 1234,
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:top": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell top margin using default width type", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                top: 1234,
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:top": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });

    describe("#addLeftMargin", () => {
        it("should add a table cell left margin", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                marginUnitType: WidthType.DXA,
                left: 1234,
            });
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:left": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell left margin using default width type", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                left: 1234,
            });
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:left": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });

    describe("#addBottomMargin", () => {
        it("should add a table cell bottom margin", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                marginUnitType: WidthType.DXA,
                bottom: 1234,
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:bottom": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell bottom margin using default width type", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                bottom: 1234,
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:bottom": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });

    describe("#addRightMargin", () => {
        it("should add a table cell right margin", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                marginUnitType: WidthType.DXA,
                right: 1234,
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:right": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell right margin using default width type", () => {
            const cellMargin = new TableCellMargin(TableCellMarginElementType.TABLE, {
                right: 1234,
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:right": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });
});
