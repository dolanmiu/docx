import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathEndingCharacter } from "./math-ending-char";

describe("MathEndingCharacter", () => {
    describe("#constructor()", () => {
        it("should create a MathEndingCharacter with correct root key", () => {
            const mathEndingCharacter = new MathEndingCharacter("]");

            const tree = new Formatter().format(mathEndingCharacter);
            expect(tree).to.deep.equal({
                "m:endChr": {
                    _attr: {
                        "m:val": "]",
                    },
                },
            });
        });
    });
});
