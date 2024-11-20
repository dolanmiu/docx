import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathSubScript } from "./math-sub-script-function";
import { MathRun } from "../../math-run";

describe("MathSubScript", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScript with correct root key", () => {
            const mathSubScript = new MathSubScript({
                children: [new MathRun("e")],
                subScript: [new MathRun("2")],
            });

            const tree = new Formatter().format(mathSubScript);
            expect(tree).to.deep.equal({
                "m:sSub": [
                    {
                        "m:sSubPr": {},
                    },
                    {
                        "m:e": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["e"],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "m:sub": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["2"],
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
