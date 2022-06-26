import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathNumerator } from "./math-numerator";

describe("MathNumerator", () => {
    describe("#constructor()", () => {
        it("should create a MathNumerator with correct root key", () => {
            const mathNumerator = new MathNumerator([new MathRun("2+2")]);
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
