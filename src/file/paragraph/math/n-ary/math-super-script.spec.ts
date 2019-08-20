import { expect } from "chai";

import { Formatter } from "export/formatter";

import { MathRun } from "../math-run";
import { MathSuperScript } from "./math-super-script";

describe("MathSuperScript", () => {
    describe("#constructor()", () => {
        it("should create a MathSuperScript with correct root key", () => {
            const mathSuperScript = new MathSuperScript(new MathRun("2+2"));

            const tree = new Formatter().format(mathSuperScript);
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
