import { expect } from "chai";
import { Formatter } from "../export/formatter";
import { Numbering } from "../numbering";
import { AbstractNumbering } from "../numbering/abstract-numbering";
import { Num } from "../numbering/num";

function jsonify(obj: object) {
    return JSON.parse(JSON.stringify(obj));
}

describe("Numbering", () => {

    let numbering: Numbering;
    beforeEach(() => {
        numbering = new Numbering();
    });

    describe("#constructor", () => {
        it("creates a default numbering with one abstract and one concrete instance", () => {
            const tree = new Formatter().format(numbering);
            expect(Object.keys(tree)).to.deep.equal(["w:numbering"]);
            const abstractNums = tree["w:numbering"].filter((el) => el["w:abstractNum"]);
            expect(abstractNums).to.have.lengthOf(1);
            expect(abstractNums[0]["w:abstractNum"]).to.deep.include.members([
                {_attr: {"w:abstractNumId": 0, "w15:restartNumberingAfterBreak": 0}},
                {"w:multiLevelType": [{_attr: {"w:val": "hybridMultilevel"}}]},
            ]);

            abstractNums.filter((el) => el["w:lvl"]).forEach((el, ix) => {
                expect(Object.keys(el)).to.have.lengthOf(1);
                expect(Object.keys(el["w:lvl"]).sort()).to.deep.equal([
                    "_attr", "w:start", "w:lvlJc", "w:numFmt", "w:pPr", "w:rPr",
                ]);
                expect(el["w:lvl"]).to.have.deep.members([
                    {_attr: {"w:ilvl": ix, "w15:tentative": 1}},
                    {"w:start": [{_attr: {"w:val": 1}}]},
                    {"w:lvlJc": [{_attr: {"w:val": "left"}}]},
                    {"w:numFmt": [{_attr: {"w:val": "bullet"}}]},
                ]);
                // Once chai 4.0.0 lands and #644 is resolved, we can add the following to the test:
                // {"w:lvlText": [{"_attr": {"w:val": "•"}}]},
                // {"w:rPr": [{"w:rFonts": [{"_attr": {"w:ascii": "Symbol", "w:hAnsi": "Symbol", "w:hint": "default"}}]}]},
                // {"w:pPr": [{"_attr": {}},
                //            {"w:ind": [{"_attr": {"w:left": 720, "w:hanging": 360}}]}]},
            });
        });
    });

    describe("#addAbstractNumbering", () => {
        it("returns a new AbstractNumbering instance", () => {
            const a2 = numbering.addAbstractNumbering();
            expect(a2).to.be.instanceof(AbstractNumbering);
        });

        it("assigns a unique ID to each abstract numbering it creates", () => {
            const a2 = numbering.addAbstractNumbering();
            const a3 = numbering.addAbstractNumbering();
            expect(a2.id).not.to.equal(a3.id);
        });
    });

    describe("#addConcreteNumbering", () => {
        it("returns a new Num instance with its abstract ID set to the AbstractNumbering's ID", () => {
            const a2 = numbering.addAbstractNumbering();
            const n = numbering.addConcreteNumbering(a2);
            expect(n).to.be.instanceof(Num);
            const tree = new Formatter().format(numbering);
            expect(n.id).to.equal(a2.id);
        });

        it("assigns a unique ID to each concrete numbering it creates", () => {
            const a2 = numbering.addAbstractNumbering();
            const n = numbering.addConcreteNumbering(a2);
            const n2 = numbering.addConcreteNumbering(a2);
            expect(n.id).not.to.equal(n2.id);
        });
    });
});

describe("AbstractNumbering", () => {
    it("stores its ID at its .id property", () => {
        const abstractNumbering = new AbstractNumbering(5);
        expect(abstractNumbering.id).to.equal(5);
    });
});
