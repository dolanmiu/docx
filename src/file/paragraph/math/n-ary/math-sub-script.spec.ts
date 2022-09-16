import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathSubScriptElement } from "./math-sub-script";

describe("MathSubScriptElement", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScriptElement with correct root key", () => {
            const mathSubScriptElement = new MathSubScriptElement([new MathRun("2+2")]);

            const tree = new Formatter().format(mathSubScriptElement);
            expect(tree).to.deep.equal({
                "m:sub": [
                    {
                        "m:r": [
                            {
                                "m:t": ["2+2"],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
