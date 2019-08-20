import { expect } from "chai";

import { Formatter } from "export/formatter";

import { MathRun } from "../math-run";
import { MathSubScript } from "./math-sub-script";

describe("MathSubScript", () => {
    describe("#constructor()", () => {
        it("should create a MathSubScript with correct root key", () => {
            const mathSubScript = new MathSubScript(new MathRun("2+2"));

            const tree = new Formatter().format(mathSubScript);
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
