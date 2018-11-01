import { expect } from "chai";

import { Formatter } from "export/formatter";

import { WidthType } from "../table-cell";
import { TableCellMargin } from "./table-cell-margin";

describe("TableCellMargin", () => {
    describe("#constructor", () => {
        it("should throw an error if theres no child elements", () => {
            const cellMargain = new TableCellMargin();
            expect(() => new Formatter().format(cellMargain)).to.throw();
        });
    });

    describe("#addTopMargin", () => {
        it("adds a table cell top margin", () => {
            const cellMargain = new TableCellMargin();
            cellMargain.addTopMargin(1234, WidthType.DXA);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:top": [{ _attr: { "w:sz": "dxa", "w:w": 1234 } }] }] });
        });
    });

    describe("#addLeftMargin", () => {
        it("adds a table cell left margin", () => {
            const cellMargain = new TableCellMargin();
            cellMargain.addLeftMargin(1234, WidthType.DXA);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:left": [{ _attr: { "w:sz": "dxa", "w:w": 1234 } }] }] });
        });
    });

    describe("#addBottomMargin", () => {
        it("adds a table cell bottom margin", () => {
            const cellMargain = new TableCellMargin();
            cellMargain.addBottomMargin(1234, WidthType.DXA);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:bottom": [{ _attr: { "w:sz": "dxa", "w:w": 1234 } }] }] });
        });
    });

    describe("#addRightMargin", () => {
        it("adds a table cell right margin", () => {
            const cellMargain = new TableCellMargin();
            cellMargain.addRightMargin(1234, WidthType.DXA);
            const tree = new Formatter().format(cellMargain);
            expect(tree).to.deep.equal({ "w:tblCellMar": [{ "w:right": [{ _attr: { "w:sz": "dxa", "w:w": 1234 } }] }] });
        });
    });
});
