import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathBase } from "./math-base";

describe("MathBase", () => {
    describe("#constructor()", () => {
        it("should create a MathBase with correct root key", () => {
            const mathBase = new MathBase([new MathRun("2+2")]);

            const tree = new Formatter().format(mathBase);
            expect(tree).to.deep.equal({
                "m:e": [
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
