import { expect } from "chai";

import { Formatter } from "export/formatter";

import { TableStyle } from "./table-style";

describe("TableStyle", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const tableStyle = new TableStyle("test-id");
            const tree = new Formatter().format(tableStyle);

            expect(tree).to.deep.equal({
                "w:tblStyle": {
                    _attr: {
                        "w:val": "test-id",
                    },
                },
            });
        });
    });
});
