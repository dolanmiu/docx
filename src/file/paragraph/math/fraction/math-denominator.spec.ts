import { expect } from "chai";

import { Formatter } from "export/formatter";

import { MathDenominator } from "./math-denominator";

describe("MathDenominator", () => {
    describe("#constructor()", () => {
        it("should create a MathDenominator with correct root key", () => {
            const mathDenominator = new MathDenominator("2+2");
            const tree = new Formatter().format(mathDenominator);
            expect(tree).to.deep.equal({
                "m:den": [
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
