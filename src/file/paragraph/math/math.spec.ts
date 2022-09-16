import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Math } from "./math";
import { MathRun } from "./math-run";

describe("Math", () => {
    describe("#constructor()", () => {
        it("should create a Math with correct root key", () => {
            const math = new Math({
                children: [],
            });
            const tree = new Formatter().format(math);
            expect(tree).to.deep.equal({
                "m:oMath": {},
            });
        });

        it("should be able to add children", () => {
            const math = new Math({
                children: [new MathRun("2+2")],
            });
            const tree = new Formatter().format(math);
            expect(tree).to.deep.equal({
                "m:oMath": [
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
