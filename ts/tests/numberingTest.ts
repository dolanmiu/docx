import { expect } from "chai";
import { Numbering } from "../numbering";
import { AbstractNumbering } from "../numbering/abstract-numbering";
import { Formatter } from '../export/formatter';

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Numbering", () => {

    let numbering = new Numbering;
    beforeEach(() => {
        numbering = new Numbering();
    });

    describe("#constructor", () => {
        it("creates a default numbering with one abstract and one concrete instance", () => {
            const tree = new Formatter().format(numbering);
            expect(Object.keys(tree)).to.deep.equal(['w:numbering']);
            const abstractNums = tree['w:numbering'].filter(el => el['w:abstractNum']);
            expect(abstractNums).to.have.lengthOf(1);
            expect(abstractNums[0]['w:abstractNum']).to.deep.include.members([
                {_attr: {"w:abstractNumId": 0, "w15:restartNumberingAfterBreak": 0}},
                {"w:multiLevelType": [{"_attr": {"w:val": "hybridMultilevel"}}]},
            ]);

            abstractNums.filter(el => el['w:lvl']).forEach((el, ix) => {
                expect(Object.keys(el)).to.have.lengthOf(1);
                expect(Object.keys(el['w:lvl']).sort()).to.deep.equal([
                    "_attr", "w:start", "w:lvlJc", "w:numFmt", "w:pPr", "w:rPr"
                ])
                expect(el['w:lvl']).to.have.deep.members([
                    {"_attr": {"w:ilvl": ix, "w15:tentative": 1}},
                    {"w:start": [{"_attr": {"w:val": 1}}]},
                    {"w:lvlJc": [{"_attr": {"w:val": "left"}}]},
                    {"w:numFmt": [{"_attr": {"w:val": "bullet"}}]},
                ]);
                // Once chai 4.0.0 lands and #644 is resolved, we can add the following to the test:
                // {"w:lvlText": [{"_attr": {"w:val": "•"}}]},
                // {"w:rPr": [{"w:rFonts": [{"_attr": {"w:ascii": "Symbol", "w:hAnsi": "Symbol", "w:hint": "default"}}]}]},
                // {"w:pPr": [{"_attr": {}},
                //            {"w:ind": [{"_attr": {"w:left": 720, "w:hanging": 360}}]}]},
            })
        });
    });
});

describe("AbstractNumbering", () => {
    it("stores its ID at its .id property", () => {
        const abstractNumbering = new AbstractNumbering(5);
        expect(abstractNumbering.id).to.equal(5);
    });
});