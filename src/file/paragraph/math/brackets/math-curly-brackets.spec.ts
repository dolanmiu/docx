import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathCurlyBrackets } from "./math-curly-brackets";

describe("MathCurlyBrackets", () => {
    describe("#constructor()", () => {
        it("should create a MathCurlyBrackets with correct root key", () => {
            const mathCurlyBrackets = new MathCurlyBrackets({
                children: [new MathRun("60")],
            });

            const tree = new Formatter().format(mathCurlyBrackets);
            expect(tree).to.deep.equal({
                "m:d": [
                    {
                        "m:dPr": [
                            {
                                "m:begChr": {
                                    _attr: {
                                        "m:val": "{",
                                    },
                                },
                            },
                            {
                                "m:endChr": {
                                    _attr: {
                                        "m:val": "}",
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
