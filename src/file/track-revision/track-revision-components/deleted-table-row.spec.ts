import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { DeletedTableRow } from "./deleted-table-row";

describe("DeletedTableRow", () => {
    describe("#constructor", () => {
        it("should create the deletion for table row", () => {
            const deletion = new DeletedTableRow({ id: 0, date: "123", author: "Author" });
            const tree = new Formatter().format(deletion);
            expect(tree).to.deep.equal({
                "w:del": {
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
