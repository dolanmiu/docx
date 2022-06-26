import { expect } from "chai";

import { Formatter } from "@export/formatter";
import { HeightRule } from "@file/table/table-row/table-row-height";

import { TableRowProperties } from "./table-row-properties";

describe("TableRowProperties", () => {
    describe("#constructor", () => {
        it("creates an initially empty property object", () => {
            const rowProperties = new TableRowProperties({});
            // The TableRowProperties is ignorable if there are no attributes,
            // which results in prepForXml returning undefined, which causes
            // the formatter to throw an error if that is the only object it
            // has been asked to format.
            expect(() => new Formatter().format(rowProperties)).to.throw("XMLComponent did not format correctly");
        });

        it("sets cantSplit to avoid row been paginated", () => {
            const rowProperties = new TableRowProperties({ cantSplit: true });
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:cantSplit": {} }] });
        });

        it("sets row as table header (repeat row on each page of table)", () => {
            const rowProperties = new TableRowProperties({ tableHeader: true });
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:tblHeader": {} }] });
        });

        it("sets row height exact", () => {
            const rowProperties = new TableRowProperties({
                height: {
                    value: 100,
                    rule: HeightRule.EXACT,
                },
            });
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:trHeight": { _attr: { "w:val": 100, "w:hRule": "exact" } } }] });
        });

        it("sets row height auto", () => {
            const rowProperties = new TableRowProperties({
                height: {
                    value: 100,
                    rule: HeightRule.AUTO,
                },
            });
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:trHeight": { _attr: { "w:val": 100, "w:hRule": "auto" } } }] });
        });

        it("sets row height at least", () => {
            const rowProperties = new TableRowProperties({
                height: {
                    value: 100,
                    rule: HeightRule.ATLEAST,
                },
            });
            const tree = new Formatter().format(rowProperties);
            expect(tree).to.deep.equal({ "w:trPr": [{ "w:trHeight": { _attr: { "w:val": 100, "w:hRule": "atLeast" } } }] });
        });
    });
});
