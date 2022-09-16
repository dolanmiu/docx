import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathBeginningCharacter } from "./math-beginning-character";

describe("MathBeginningCharacter", () => {
    describe("#constructor()", () => {
        it("should create a MathBeginningCharacter with correct root key", () => {
            const mathBeginningCharacter = new MathBeginningCharacter("[");

            const tree = new Formatter().format(mathBeginningCharacter);
            expect(tree).to.deep.equal({
                "m:begChr": {
                    _attr: {
                        "m:val": "[",
                    },
                },
            });
        });
    });
});
