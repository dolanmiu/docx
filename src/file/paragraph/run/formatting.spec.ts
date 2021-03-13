import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Bold } from "./formatting";

describe("Bold", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const currentBold = new Bold();

            const tree = new Formatter().format(currentBold);
            expect(tree).to.deep.equal({
                "w:b": {
                    _attr: {
                        "w:val": true,
                    },
                },
            });
        });
    });
});
