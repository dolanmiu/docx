import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { MathAccentCharacter } from "./math-accent-character";

describe("MathAccentCharacter", () => {
    describe("#constructor()", () => {
        it("should create a MathAccentCharacter with correct root key", () => {
            const mathAccentCharacter = new MathAccentCharacter("∑");

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
