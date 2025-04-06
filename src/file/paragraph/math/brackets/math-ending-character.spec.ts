import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createMathEndingCharacter } from "./math-ending-char";

describe("createMathEndingCharacter", () => {
    describe("#constructor()", () => {
        it("should create a MathEndingCharacter with correct root key", () => {
            const mathEndingCharacter = createMathEndingCharacter({ character: "]" });

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
