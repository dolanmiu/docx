import { expect } from "chai";

import { Formatter } from "export/formatter";

import { TextRun } from "./text-run";

describe("TextRun", () => {
    let run: TextRun;

    describe("#constructor()", () => {
        it("should add text into run", () => {
            run = new TextRun("test");
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [{ "w:rPr": [] }, { "w:t": [{ _attr: { "xml:space": "preserve" } }, "test"] }],
            });
        });
    });
});
