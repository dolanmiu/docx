import { expect } from "chai";

import { Formatter } from "export/formatter";

import { Numbering } from "./numbering";

describe("Numbering", () => {
    describe("#constructor", () => {
        it("creates a default numbering with one abstract and one concrete instance", () => {
            const numbering = new Numbering({
                config: [],
            });

            const tree = new Formatter().format(numbering);
            expect(Object.keys(tree)).to.deep.equal(["w:numbering"]);
            const abstractNums = tree["w:numbering"].filter((el) => el["w:abstractNum"]);
            expect(abstractNums).to.have.lengthOf(1);
            expect(abstractNums[0]["w:abstractNum"]).to.deep.include.members([
                { _attr: { "w:abstractNumId": 0, "w15:restartNumberingAfterBreak": 0 } },
                { "w:multiLevelType": { _attr: { "w:val": "hybridMultilevel" } } },
            ]);

            abstractNums
                .filter((el) => el["w:lvl"])
                .forEach((el, ix) => {
                    expect(Object.keys(el)).to.have.lengthOf(1);
                    expect(Object.keys(el["w:lvl"]).sort()).to.deep.equal(["_attr", "w:start", "w:lvlJc", "w:numFmt", "w:pPr", "w:rPr"]);
                    expect(el["w:lvl"]).to.have.deep.members([
                        { _attr: { "w:ilvl": ix, "w15:tentative": 1 } },
                        { "w:start": [{ _attr: { "w:val": 1 } }] },
                        { "w:lvlJc": [{ _attr: { "w:val": "left" } }] },
                        { "w:numFmt": [{ _attr: { "w:val": "bullet" } }] },
                    ]);
                    // Once chai 4.0.0 lands and #644 is resolved, we can add the following to the test:
                    // {"w:lvlText": {"_attr": {"w:val": "•"}}},
                    // {"w:rPr": [{"w:rFonts": {"_attr": {"w:ascii": "Symbol", "w:cs": "Symbol", "w:eastAsia": "Symbol", "w:hAnsi": "Symbol", "w:hint": "default"}}}]},
                    // {"w:pPr": [
                    //            {"w:ind": [{"_attr": {"w:left": 720, "w:hanging": 360}}]}]},
                });
        });
    });
});
