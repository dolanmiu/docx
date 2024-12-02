import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { FootnoteReferenceRun } from "@file/footnotes/footnote/run/reference-run";

import { TextRun } from "./text-run";

describe("TextRun", () => {
    let run: TextRun;

    describe("#constructor()", () => {
        it("should add text into run", () => {
            run = new TextRun("test");
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "test"] }],
            });
        });

        it("should add empty text into run", () => {
            run = new TextRun({ text: "" });
            const f = new Formatter().format(run);
            expect(f).to.deep.equal({
                "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, ""] }],
            });
        });
    });

    describe("#referenceFootnote()", () => {
        it("should add a valid footnote reference", () => {
            run = new TextRun({
                children: ["test", new FootnoteReferenceRun(1)],
            });
            const tree = new Formatter().format(run);

            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:t": [{ _attr: { "xml:space": "preserve" } }, "test"] },
                    {
                        "w:r": [
                            { "w:rPr": [{ "w:rStyle": { _attr: { "w:val": "FootnoteReference" } } }] },
                            { "w:footnoteReference": { _attr: { "w:id": 1 } } },
                        ],
                    },
                ],
            });
        });
    });
});
