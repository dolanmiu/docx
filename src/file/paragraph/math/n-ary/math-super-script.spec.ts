import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathSuperScriptElement } from "./math-super-script";

describe("MathSuperScriptElement", () => {
    describe("#constructor()", () => {
        it("should create a MathSuperScriptElement with correct root key", () => {
            const mathSuperScriptElement = new MathSuperScriptElement([new MathRun("2+2")]);

            const tree = new Formatter().format(mathSuperScriptElement);
            expect(tree).to.deep.equal({
                "m:sup": [
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
