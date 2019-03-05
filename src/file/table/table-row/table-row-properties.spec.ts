import { expect } from "chai";
import { Formatter } from "export/formatter";
import { TableRowProperties } from "./table-row-properties";

describe("TableRowProperties", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const rowProperties = new TableRowProperties();
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [] });
        });
    });

    describe("#setCantSplit", () => {
        it("sets cantSplit to avoid row been paginated", () => {
            const rowProperties = new TableRowProperties();
            rowProperties.setCantSplit();
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:cantSplit": [{ _attr: { "w:val": true } }] }] });
        });
    });

    describe("#setTableHeader", () => {
        it("sets row as table header (repeat row on each page of table)", () => {
            const rowProperties = new TableRowProperties();
            rowProperties.setTableHeader();
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:tblHeader": [{ _attr: { "w:val": true } }] }] });
        });
    });
});
