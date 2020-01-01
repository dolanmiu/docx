import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Footnote, FootnoteType } from "./footnote";

describe("Footnote", () => {
    describe("#constructor", () => {
        it("should create a footnote with a footnote type", () => {
            const footnote = new Footnote({
                id: 1,
                type: FootnoteType.SEPERATOR,
                children: [],
            });
            const tree = new Formatter().format(footnote);

            expect(Object.keys(tree)).to.deep.equal(["w:footnote"]);
            expect(tree["w:footnote"]).to.deep.equal({ _attr: { "w:type": "separator", "w:id": 1 } });
        });

        it("should create a footnote without a footnote type", () => {
            const footnote = new Footnote({
                id: 1,
                children: [],
            });
            const tree = new Formatter().format(footnote);

            expect(Object.keys(tree)).to.deep.equal(["w:footnote"]);
            expect(tree["w:footnote"]).to.deep.equal({ _attr: { "w:id": 1 } });
        });
    });
});
