import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createMathAccentCharacter } from "./math-accent-character";

describe("MathAccentCharacter", () => {
    describe("#constructor()", () => {
        it("should create a MathAccentCharacter with correct root key", () => {
            const mathAccentCharacter = createMathAccentCharacter({ accent: "∑" });

            const tree = new Formatter().format(mathAccentCharacter);
            expect(tree).to.deep.equal({
                "m:chr": {
                    _attr: {
                        "m:val": "∑",
                    },
                },
            });
        });
    });
});
