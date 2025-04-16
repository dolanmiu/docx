import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { createMathSuperScriptElement } from "./math-super-script";

describe("createMathSuperScriptElement", () => {
    describe("#constructor()", () => {
        it("should create a MathSuperScriptElement with correct root key", () => {
            const mathSuperScriptElement = createMathSuperScriptElement({ children: [new MathRun("2+2")] });

            const tree = new Formatter().format(mathSuperScriptElement);
            expect(tree).to.deep.equal({
                "m:sup": [
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
