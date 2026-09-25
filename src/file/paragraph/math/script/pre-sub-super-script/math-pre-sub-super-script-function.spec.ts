import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathPreSubSuperScript } from "./math-pre-sub-super-script-function";
import { MathRun } from "../../math-run";

describe("MathPreSubScript", () => {
    describe("#constructor()", () => {
        it("should write the pre-scripts before the base, as the schema orders them", () => {
            const mathPreSubScript = new MathPreSubSuperScript({
                children: [new MathRun("e")],
                subScript: [new MathRun("2")],
                superScript: [new MathRun("5")],
            });

            const tree = new Formatter().format(mathPreSubScript);
            expect(tree).to.deep.equal({
                "m:sPre": [
                    {
                        "m:sPrePr": {},
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
                ],
            });
        });
    });
});
