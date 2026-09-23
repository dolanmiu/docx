import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { WidthType, createTableWidthElement } from "@file/table/table-width";

describe("createTableWidthElement", () => {
    it("writes a numeric pct width in fiftieths of a percent, matching Word (#1457)", () => {
        // A "50%" string is misread by Google Docs / Apple Pages and collapses
        // the table; Word writes 50% as the integer 2500.
        const tree = new Formatter().format(createTableWidthElement("w:tblW", { size: 50, type: WidthType.PERCENTAGE }));

        expect(tree).to.deep.equal({ "w:tblW": { _attr: { "w:type": "pct", "w:w": 2500 } } });
    });

    it("rounds fractional percentages to the nearest fiftieth", () => {
        // 33.31 * 50 = 1665.5, which only becomes 1666 with rounding (truncation would give 1665)
        const tree = new Formatter().format(createTableWidthElement("w:tblW", { size: 33.31, type: WidthType.PERCENTAGE }));

        expect(tree).to.deep.equal({ "w:tblW": { _attr: { "w:type": "pct", "w:w": 1666 } } });
    });

    it("still emits the literal percent string when the caller passes a Percentage", () => {
        const tree = new Formatter().format(createTableWidthElement("w:tblW", { size: "50%", type: WidthType.PERCENTAGE }));

        expect(tree).to.deep.equal({ "w:tblW": { _attr: { "w:type": "pct", "w:w": "50%" } } });
    });

    it("leaves dxa widths untouched", () => {
        const tree = new Formatter().format(createTableWidthElement("w:tblW", { size: 5000, type: WidthType.DXA }));

        expect(tree).to.deep.equal({ "w:tblW": { _attr: { "w:type": "dxa", "w:w": 5000 } } });
    });
});
