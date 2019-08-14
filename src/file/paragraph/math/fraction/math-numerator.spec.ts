import { expect } from "chai";

import { Formatter } from "export/formatter";

import { MathNumerator } from "./math-numerator";

describe("MathNumerator", () => {
    describe("#constructor()", () => {
        it("should create a MathNumerator with correct root key", () => {
            const mathNumerator = new MathNumerator("2+2");
            const tree = new Formatter().format(mathNumerator);
            expect(tree).to.deep.equal({
                "m:num": [
                    {
                        "m:r": [
                            {
                                "m:t": ["2+2"],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
