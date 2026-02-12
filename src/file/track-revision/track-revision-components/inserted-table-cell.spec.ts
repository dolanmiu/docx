import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { InsertedTableCell } from "./inserted-table-cell";

describe("InsertedTableCell", () => {
    describe("#constructor", () => {
        it("should create the insertion for table cell", () => {
            const insertion = new InsertedTableCell({ id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(insertion);
            expect(tree).to.deep.equal({
                "w:cellIns": {
                    _attr: {
                        "w:author": "Author",
                        "w:date": "123",
                        "w:id": 0,
                    },
                },
            });
        });
    });
});
