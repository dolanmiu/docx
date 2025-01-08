import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathBar } from "./math-bar";
import { MathRun } from "../math-run";

describe("MathBar", () => {
    describe("#constructor()", () => {
        it("should create a MathBar with correct root key", () => {
            const mathBar = new MathBar({ type: "top", children: [new MathRun("text")] });
            const tree = new Formatter().format(mathBar);
            expect(tree).to.deep.equal({
                "m:bar": [
                    {
                        "m:barPr": {
                            _attr:{
                                "m:pos": "top",
                            },
                        },
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
