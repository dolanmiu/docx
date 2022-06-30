import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathDegreeHide } from "./math-degree-hide";

describe("MathDegreeHide", () => {
    describe("#constructor()", () => {
        it("should create a MathDegreeHide with correct root key", () => {
            const mathDegreeHide = new MathDegreeHide();

            const tree = new Formatter().format(mathDegreeHide);
            expect(tree).to.deep.equal({
                "m:degHide": {
                    _attr: {
                        "m:val": 1,
                    },
                },
            });
        });
    });
});
