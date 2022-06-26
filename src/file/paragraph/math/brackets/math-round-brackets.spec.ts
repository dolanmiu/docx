import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathRoundBrackets } from "./math-round-brackets";

describe("MathRoundBrackets", () => {
    describe("#constructor()", () => {
        it("should create a MathRoundBrackets with correct root key", () => {
            const mathRoundBrackets = new MathRoundBrackets({
                children: [new MathRun("60")],
            });

            const tree = new Formatter().format(mathRoundBrackets);
            expect(tree).to.deep.equal({
                "m:d": [
                    {
                        "m:dPr": {},
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
