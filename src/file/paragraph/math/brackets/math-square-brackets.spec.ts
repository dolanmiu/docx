import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathSquareBrackets } from "./math-square-brackets";

describe("MathSquareBrackets", () => {
    describe("#constructor()", () => {
        it("should create a MathSquareBrackets with correct root key", () => {
            const mathSquareBrackets = new MathSquareBrackets({
                children: [new MathRun("60")],
            });

            const tree = new Formatter().format(mathSquareBrackets);
            expect(tree).to.deep.equal({
                "m:d": [
                    {
                        "m:dPr": [
                            {
                                "m:begChr": {
                                    _attr: {
                                        "m:val": "[",
                                    },
                                },
                            },
                            {
                                "m:endChr": {
                                    _attr: {
                                        "m:val": "]",
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
