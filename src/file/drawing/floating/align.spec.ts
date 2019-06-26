import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Align } from "./align";
import { VerticalPositionAlign } from "./floating-position";

describe("Align", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const tree = new Formatter().format(new Align(VerticalPositionAlign.CENTER));
            expect(tree).to.deep.equal({
                "wp:align": ["center"],
            });
        });
    });
});
