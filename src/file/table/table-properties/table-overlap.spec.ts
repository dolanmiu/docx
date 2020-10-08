import { expect } from "chai";

import { Formatter } from "export/formatter";

import { OverlapType, TableOverlap } from "./table-overlap";

describe("TableOverlap", () => {
    describe("#constructor", () => {
        it("sets the width attribute to the value given", () => {
            const tableOverlap = new TableOverlap(OverlapType.OVERLAP);
            const tree = new Formatter().format(tableOverlap);

            expect(tree).to.deep.equal({
                "w:tblOverlap": {
                    _attr: {
                        "w:val": "overlap",
                    },
                },
            });
        });
    });
});
