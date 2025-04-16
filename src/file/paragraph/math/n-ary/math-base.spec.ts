import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { createMathBase } from "./math-base";

describe("createMathBase", () => {
    describe("#constructor()", () => {
        it("should create a MathBase with correct root key", () => {
            const mathBase = createMathBase({ children: [new MathRun("2+2")] });

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
