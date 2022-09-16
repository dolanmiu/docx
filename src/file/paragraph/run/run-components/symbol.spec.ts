import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Symbol } from "./symbol";

describe("Symbol", () => {
    describe("#constructor", () => {
        // Note: if no character is given, the output is a MS Windows logo
        it("creates an empty symbol run if no character is given", () => {
            const s = new Symbol();
            const f = new Formatter().format(s);
            expect(f).to.deep.equal({ "w:sym": { _attr: { "w:char": "", "w:font": "Wingdings" } } });
        });

        it("creates the provided symbol with default font", () => {
            const s = new Symbol("F071");
            const f = new Formatter().format(s);
            expect(f).to.deep.equal({ "w:sym": { _attr: { "w:char": "F071", "w:font": "Wingdings" } } });
        });

        it("creates the provided symbol with the provided font", () => {
            const s = new Symbol("F071", "Arial");
            const f = new Formatter().format(s);
            expect(f).to.deep.equal({ "w:sym": { _attr: { "w:char": "F071", "w:font": "Arial" } } });
        });
    });
});
