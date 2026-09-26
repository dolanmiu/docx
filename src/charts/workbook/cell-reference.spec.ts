import { describe, expect, it } from "vitest";

import { cellName, columnName, sheetReference } from "./cell-reference";

describe("cell references", () => {
    it("should name columns with letters, and with more than one after Z", () => {
        expect([0, 1, 25, 26, 27, 51, 52, 701, 702, 16383].map(columnName)).to.deep.equal([
            "A",
            "B",
            "Z",
            "AA",
            "AB",
            "AZ",
            "BA",
            "ZZ",
            "AAA",
            "XFD",
        ]);
    });

    it("should name a cell by its column and row, from row 1", () => {
        expect(cellName(0, 0)).to.equal("A1");
        expect(cellName(27, 9)).to.equal("AB10");
    });

    it("should refer to a cell, or to cells down a column, on the sheet", () => {
        expect(sheetReference(1, 0)).to.equal("Sheet1!$B$1");
        expect(sheetReference(0, 1, 4)).to.equal("Sheet1!$A$2:$A$5");
        expect(sheetReference(26, 1, 1)).to.equal("Sheet1!$AA$2");
    });
});
