import { expect } from "chai";

import { Formatter } from "export/formatter";

import { RunFonts } from "./run-fonts";

describe("RunFonts", () => {
    describe("#constructor()", () => {
        it("uses the font name for both ascii and hAnsi", () => {
            const tree = new Formatter().format(new RunFonts("Times"));
            expect(tree).to.deep.equal({
                "w:rFonts": [{ _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times" } }],
            });
        });

        it("uses hint if given", () => {
            const tree = new Formatter().format(new RunFonts("Times", "default"));
            expect(tree).to.deep.equal({
                "w:rFonts": [
                    { _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times", "w:hint": "default" } },
                ],
            });
        });
    });
});
