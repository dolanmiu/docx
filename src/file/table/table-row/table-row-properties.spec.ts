import { expect } from "chai";
import { Formatter } from "export/formatter";
import { TableRowProperties } from "./table-row-properties";

describe("TableRowProperties", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const rowProperties = new TableRowProperties();
            // The TableRowProperties is ignorable if there are no attributes,
            // which results in prepForXml returning undefined, which causes
            // the formatter to throw an error if that is the only object it
            // has been asked to format.
            expect(() => new Formatter().format(rowProperties)).to.throw("XMLComponent did not format correctly");
        });
    });

    describe("#setCantSplit", () => {
        it("sets cantSplit to avoid row been paginated", () => {
            const rowProperties = new TableRowProperties();
            rowProperties.setCantSplit();
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:cantSplit": { _attr: { "w:val": true } } }] });
        });
    });

    describe("#setTableHeader", () => {
        it("sets row as table header (repeat row on each page of table)", () => {
            const rowProperties = new TableRowProperties();
            rowProperties.setTableHeader();
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:tblHeader": { _attr: { "w:val": true } } }] });
        });
    });
});
