import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { DeletedTableCell } from "./deleted-table-cell";

describe("DeletedTableCell", () => {
    describe("#constructor", () => {
        it("should create the deletion for table cell", () => {
            const deletion = new DeletedTableCell({ id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(deletion);
            expect(tree).to.deep.equal({
                "w:cellDel": {
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
