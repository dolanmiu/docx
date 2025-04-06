import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { createMathSubScriptElement } from "./math-sub-script";

describe("createMathSubScriptElement", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScriptElement with correct root key", () => {
            const mathSubScriptElement = createMathSubScriptElement({ children: [new MathRun("2+2")] });

            const tree = new Formatter().format(mathSubScriptElement);
            expect(tree).to.deep.equal({
                "m:sub": [
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
