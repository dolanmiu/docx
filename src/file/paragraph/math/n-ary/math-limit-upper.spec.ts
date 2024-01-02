import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathLimitUpper } from "./math-limit-upper";

describe("MathLimitUpper", () => {
    describe("#constructor()", () => {
        it("should create a MathLimitUpper with correct root key", () => {
            const mathLimitUpper = new MathLimitUpper({
                children: [new MathRun("x")],
                limit: [new MathRun("-")],
            });

            const tree = new Formatter().format(mathLimitUpper);
            expect(tree).to.deep.equal({
                "m:limUpp": [
                    {
                        "m:e": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["x"],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "m:lim": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["-"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
