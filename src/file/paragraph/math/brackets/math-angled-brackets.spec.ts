import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathAngledBrackets } from "./math-angled-brackets";

describe("MathAngledBrackets", () => {
    describe("#constructor()", () => {
        it("should create a MathAngledBrackets with correct root key", () => {
            const mathAngledBrackets = new MathAngledBrackets({
                children: [new MathRun("60")],
            });

            const tree = new Formatter().format(mathAngledBrackets);
            expect(tree).to.deep.equal({
                "m:d": [
                    {
                        "m:dPr": [
                            {
                                "m:begChr": {
                                    _attr: {
                                        "m:val": "〈",
                                    },
                                },
                            },
                            {
                                "m:endChr": {
                                    _attr: {
                                        "m:val": "〉",
                                    },
                                },
                            },
                        ],
                    },
                    {
                        "m:e": [
                            {
                                "m:r": [
                                    {
                                        "m:t": ["60"],
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
