import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { NoFill } from "./no-fill";

describe("NoFill", () => {
    describe("#constructor()", () => {
        it("should create", () => {
            const tree = new Formatter().format(new NoFill());
            expect(tree).to.deep.equal({
                "a:noFill": {},
            });
        });
    });
});
