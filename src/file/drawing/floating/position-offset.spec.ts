import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { PositionOffset } from "./position-offset";

describe("PositionOffset", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const tree = new Formatter().format(new PositionOffset(50));
            expect(tree).to.deep.equal({
                "wp:posOffset": ["50"],
            });
        });
    });
});
