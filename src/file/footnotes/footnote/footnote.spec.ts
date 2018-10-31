import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Footnote, FootnoteType } from "./footnote";

describe("Footnote", () => {
    describe("#constructor", () => {
        it("should create a footnote with a footnote type", () => {
            const footnote = new Footnote(1, FootnoteType.SEPERATOR);
            const tree = new Formatter().format(footnote);

            expect(Object.keys(tree)).to.deep.equal(["w:footnote"]);
            expect(tree["w:footnote"]).to.be.an.instanceof(Array);
            expect(tree["w:footnote"][0]).to.deep.equal({ _attr: { "w:type": "separator", "w:id": 1 } });
        });

        it("should create a footnote without a footnote type", () => {
            const footnote = new Footnote(1);
            const tree = new Formatter().format(footnote);

            expect(Object.keys(tree)).to.deep.equal(["w:footnote"]);
            expect(tree["w:footnote"]).to.be.an.instanceof(Array);
            expect(tree["w:footnote"][0]).to.deep.equal({ _attr: { "w:id": 1 } });
        });
    });
});
