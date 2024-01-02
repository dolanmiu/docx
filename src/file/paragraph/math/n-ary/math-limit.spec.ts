import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathLimit } from "./math-limit";

describe("MathLimit", () => {
    describe("#constructor()", () => {
        it("should create a MathLimit with correct root key", () => {
            const mathLimit = new MathLimit([new MathRun("x→0")]);

            const tree = new Formatter().format(mathLimit);
            expect(tree).to.deep.equal({
                "m:lim": [
                    {
                        "m:r": [
                            {
                                "m:t": ["x→0"],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
