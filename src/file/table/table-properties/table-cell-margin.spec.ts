import { expect } from "chai";

import { Formatter } from "export/formatter";

import { WidthType } from "../table-cell";
import { TableCellMargin } from "./table-cell-margin";

describe("TableCellMargin", () => {
    describe("#constructor", () => {
        it("should throw an error if theres no child elements", () => {
            const cellMargin = new TableCellMargin({});
            expect(() => new Formatter().format(cellMargin)).to.throw();
        });
    });

    describe("#addTopMargin", () => {
        it("should add a table cell top margin", () => {
            const cellMargin = new TableCellMargin({
                top: {
                    value: 1234,
                    type: WidthType.DXA,
                },
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:top": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell top margin using default width type", () => {
            const cellMargin = new TableCellMargin({
                top: {
                    value: 1234,
                },
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:top": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });

    describe("#addLeftMargin", () => {
        it("should add a table cell left margin", () => {
            const cellMargin = new TableCellMargin({
                left: {
                    value: 1234,
                    type: WidthType.DXA,
                },
            });
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:left": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell left margin using default width type", () => {
            const cellMargin = new TableCellMargin({
                left: {
                    value: 1234,
                },
            });
            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:left": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });

    describe("#addBottomMargin", () => {
        it("should add a table cell bottom margin", () => {
            const cellMargin = new TableCellMargin({
                bottom: {
                    value: 1234,
                    type: WidthType.DXA,
                },
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:bottom": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell bottom margin using default width type", () => {
            const cellMargin = new TableCellMargin({
                bottom: {
                    value: 1234,
                },
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:bottom": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });

    describe("#addRightMargin", () => {
        it("should add a table cell right margin", () => {
            const cellMargin = new TableCellMargin({
                right: {
                    value: 1234,
                    type: WidthType.DXA,
                },
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:right": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });

        it("should add a table cell right margin using default width type", () => {
            const cellMargin = new TableCellMargin({
                right: {
                    value: 1234,
                },
            });

            const tree = new Formatter().format(cellMargin);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:right": { _attr: { "w:type": "dxa", "w:w": 1234 } } }] });
        });
    });
});
