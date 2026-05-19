import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { InsertedTableRow } from "./inserted-table-row";

describe("InsertedTableRow", () => {
    describe("#constructor", () => {
        it("should create the insertion for table row", () => {
            const insertion = new InsertedTableRow({ id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(insertion);
            expect(tree).to.deep.equal({
                "w:ins": {
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
