import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathSubSuperScript } from "./math-sub-super-script-function";
import { MathRun } from "../../math-run";

describe("MathSubScript", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScript with correct root key", () => {
            const mathSubScript = new MathSubSuperScript({
                children: [new MathRun("e")],
                subScript: [new MathRun("2")],
                superScript: [new MathRun("5")],
            });

            const tree = new Formatter().format(mathSubScript);
            expect(tree).to.deep.equal({
                "m:sSubSup": [
                    {
                        "m:sSubSupPr": {},
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
                    {
                        "m:sup": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["5"],
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
