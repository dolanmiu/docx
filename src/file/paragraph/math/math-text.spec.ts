import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathText } from "./math-text";

describe("MathText", () => {
    describe("#constructor()", () => {
        it("should create a MathText with correct root key", () => {
            const mathText = new MathText("2+2");
            const tree = new Formatter().format(mathText);
            expect(tree).to.deep.equal({
                "m:t": ["2+2"],
            });
        });

        it("keeps spaces at either end, and only then marks them", () => {
            expect(new Formatter().format(new MathText("if "))).to.deep.equal({ "m:t": [{ _attr: { "xml:space": "preserve" } }, "if "] });
            expect(new Formatter().format(new MathText(" x"))).to.deep.equal({ "m:t": [{ _attr: { "xml:space": "preserve" } }, " x"] });
            expect(new Formatter().format(new MathText("\tx"))).to.deep.equal({ "m:t": [{ _attr: { "xml:space": "preserve" } }, "\tx"] });
            expect(new Formatter().format(new MathText("\u200B"))).to.deep.equal({
                "m:t": [{ _attr: { "xml:space": "preserve" } }, "\u200B"],
            });
            expect(new Formatter().format(new MathText("x + y"))).to.deep.equal({ "m:t": ["x + y"] });
            expect(new Formatter().format(new MathText(""))).to.deep.equal({ "m:t": [""] });
        });
    });
});
