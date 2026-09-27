import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { MathRun } from "./math-run";

describe("MathRun", () => {
    describe("#constructor()", () => {
        it("should create a MathRun with correct root key", () => {
            const mathRun = new MathRun("2+2");
            const tree = new Formatter().format(mathRun);
            expect(tree).to.deep.equal({
                "m:r": [
                    {
                        "m:t": ["2+2"],
                    },
                ],
            });
        });

        it("takes its text in options too", () => {
            expect(new Formatter().format(new MathRun({ text: "2+2" }))).to.deep.equal({ "m:r": [{ "m:t": ["2+2"] }] });
            expect(new Formatter().format(new MathRun({ text: "2+2", normalText: false }))).to.deep.equal({ "m:r": [{ "m:t": ["2+2"] }] });
        });

        it("writes normal text with m:nor, keeping its spaces", () => {
            const tree = new Formatter().format(new MathRun({ text: "if ", normalText: true }));
            expect(tree).to.deep.equal({
                "m:r": [{ "m:rPr": [{ "m:nor": { _attr: { "m:val": 1 } } }] }, { "m:t": [{ _attr: { "xml:space": "preserve" } }, "if "] }],
            });
        });
    });
});
