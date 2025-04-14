import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { createMathBar } from "./math-bar";

describe("MathBar", () => {
    describe("#constructor()", () => {
        it("should create a MathBar with correct root key", () => {
            const mathBar = createMathBar({ type: "top", children: [new MathRun("text")] });
            const tree = new Formatter().format(mathBar);

            expect(tree).to.deep.equal({
                "m:bar": [
                    {
                        "m:barPr": [
                            {
                                "m:pos": {
                                    _attr: {
                                        "w:val": "top",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "m:e": [
                            {
                                "m:r": [{ "m:t": ["text"] }],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
