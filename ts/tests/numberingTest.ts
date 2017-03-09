import { expect } from "chai";
import { Formatter } from "../export/formatter";
import { Numbering } from "../numbering";
import { AbstractNumbering } from "../numbering/abstract-numbering";
import { Num } from "../numbering/num";

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
                { _attr: { "w:abstractNumId": 0, "w15:restartNumberingAfterBreak": 0 } },
                { "w:multiLevelType": [{ _attr: { "w:val": "hybridMultilevel" } }] },
            ]);

            abstractNums.filter((el) => el["w:lvl"]).forEach((el, ix) => {
                expect(Object.keys(el)).to.have.lengthOf(1);
                expect(Object.keys(el["w:lvl"]).sort()).to.deep.equal([
                    "_attr", "w:start", "w:lvlJc", "w:numFmt", "w:pPr", "w:rPr",
                ]);
                expect(el["w:lvl"]).to.have.deep.members([
                    { _attr: { "w:ilvl": ix, "w15:tentative": 1 } },
                    { "w:start": [{ _attr: { "w:val": 1 } }] },
                    { "w:lvlJc": [{ _attr: { "w:val": "left" } }] },
                    { "w:numFmt": [{ _attr: { "w:val": "bullet" } }] },
                ]);
                // Once chai 4.0.0 lands and #644 is resolved, we can add the following to the test:
                // {"w:lvlText": [{"_attr": {"w:val": "•"}}]},
                // {"w:rPr": [{"w:rFonts": [{"_attr": {"w:ascii": "Symbol", "w:hAnsi": "Symbol", "w:hint": "default"}}]}]},
                // {"w:pPr": [{"_attr": {}},
                //            {"w:ind": [{"_attr": {"w:left": 720, "w:hanging": 360}}]}]},
            });
        });
    });

    describe("#createAbstractNumbering", () => {
        it("returns a new AbstractNumbering instance", () => {
            const a2 = numbering.createAbstractNumbering();
            expect(a2).to.be.instanceof(AbstractNumbering);
        });

        it("assigns a unique ID to each abstract numbering it creates", () => {
            const a2 = numbering.createAbstractNumbering();
            const a3 = numbering.createAbstractNumbering();
            expect(a2.id).not.to.equal(a3.id);
        });
    });

    describe("#createConcreteNumbering", () => {
        it("returns a new Num instance with its abstract ID set to the AbstractNumbering's ID", () => {
            const a2 = numbering.createAbstractNumbering();
            const n = numbering.createConcreteNumbering(a2);
            expect(n).to.be.instanceof(Num);
            const tree = new Formatter().format(numbering);
            const serializedN = tree["w:numbering"].find((obj) =>
                obj["w:num"] && obj["w:num"][0]._attr["w:numId"] === n.id,
            );
            expect(serializedN["w:num"][1]["w:abstractNumId"][0]._attr["w:val"]).to.equal(a2.id);
        });

        it("assigns a unique ID to each concrete numbering it creates", () => {
            const a2 = numbering.createAbstractNumbering();
            const n = numbering.createConcreteNumbering(a2);
            const n2 = numbering.createConcreteNumbering(a2);
            expect(n.id).not.to.equal(n2.id);
        });
    });
});

describe("AbstractNumbering", () => {
    it("stores its ID at its .id property", () => {
        const abstractNumbering = new AbstractNumbering(5);
        expect(abstractNumbering.id).to.equal(5);
    });

    describe("#createLevel", () => {
        it("creates a level with the given characteristics", () => {
            const abstractNumbering = new AbstractNumbering(1);
            const level = abstractNumbering.createLevel(3, "lowerLetter", "%1)", "end");
            const tree = new Formatter().format(level);
            expect(tree["w:lvl"]).to.include({ _attr: { "w:ilvl": 3, "w15:tentative": 1 } });
            expect(tree["w:lvl"]).to.include({ "w:start": [{ _attr: { "w:val": 1 } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlJc": [{ _attr: { "w:val": "end" } }] });
            expect(tree["w:lvl"]).to.include({ "w:numFmt": [{ _attr: { "w:val": "lowerLetter" } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlText": [{ _attr: { "w:val": "%1)" } }] });
        });

        it("uses 'start' as the default alignment", () => {
            const abstractNumbering = new AbstractNumbering(1);
            const level = abstractNumbering.createLevel(3, "lowerLetter", "%1)");
            const tree = new Formatter().format(level);
            expect(tree["w:lvl"]).to.include({ _attr: { "w:ilvl": 3, "w15:tentative": 1 } });
            expect(tree["w:lvl"]).to.include({ "w:start": [{ _attr: { "w:val": 1 } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlJc": [{ _attr: { "w:val": "start" } }] });
            expect(tree["w:lvl"]).to.include({ "w:numFmt": [{ _attr: { "w:val": "lowerLetter" } }] });
            expect(tree["w:lvl"]).to.include({ "w:lvlText": [{ _attr: { "w:val": "%1)" } }] });
        });
    });
});
