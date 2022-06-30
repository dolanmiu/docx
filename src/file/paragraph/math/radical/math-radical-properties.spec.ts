import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathRadicalProperties } from "./math-radical-properties";

describe("MathRadicalProperties", () => {
    describe("#constructor()", () => {
        it("should create a MathRadicalProperties with correct root key", () => {
            const mathRadicalProperties = new MathRadicalProperties(true);

            const tree = new Formatter().format(mathRadicalProperties);
            expect(tree).to.deep.equal({
                "m:radPr": {},
            });
        });

        it("should create a MathRadicalProperties with correct root key with degree hide", () => {
            const mathRadicalProperties = new MathRadicalProperties(false);

            const tree = new Formatter().format(mathRadicalProperties);
            expect(tree).to.deep.equal({
                "m:radPr": [
                    {
                        "m:degHide": {
                            _attr: {
                                "m:val": 1,
                            },
                        },
                    },
                ],
            });
        });
    });
});
