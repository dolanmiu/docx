import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathFunctionName } from "./math-function-name";

describe("MathFunctionName", () => {
    describe("#constructor()", () => {
        it("should create a MathFunctionName with correct root key", () => {
            const mathFunctionName = new MathFunctionName([new MathRun("2")]);

            const tree = new Formatter().format(mathFunctionName);
            expect(tree).to.deep.equal({
                "m:fName": [
                    {
                        "m:r": [
                            {
                                "m:t": ["2"],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
