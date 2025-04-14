import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createMathBeginningCharacter } from "./math-beginning-character";

describe("createMathBeginningCharacter", () => {
    describe("#constructor()", () => {
        it("should create a MathBeginningCharacter with correct root key", () => {
            const mathBeginningCharacter = createMathBeginningCharacter({ character: "[" });

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
