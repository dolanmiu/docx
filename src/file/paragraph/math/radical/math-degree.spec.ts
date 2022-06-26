import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRun } from "../math-run";
import { MathDegree } from "./math-degree";

describe("MathDegree", () => {
    describe("#constructor()", () => {
        it("should create a MathDegree with correct root key", () => {
            const mathDegree = new MathDegree();

            const tree = new Formatter().format(mathDegree);
            expect(tree).to.deep.equal({
                "m:deg": {},
            });
        });

        it("should create a MathDegree with correct root key with child", () => {
            const mathDegree = new MathDegree([new MathRun("2")]);

            const tree = new Formatter().format(mathDegree);
            expect(tree).to.deep.equal({
                "m:deg": [
                    {
                        "m:r": [
                            {
                                "m:t": ["2"],
                            },
                        ],
                    },
                ],
            });
        });
    });
});
