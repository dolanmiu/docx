import { assert, expect } from "chai";
import { Run } from "../../../docx/run";
import { Formatter } from "../../../export/formatter";
import { Utility } from "../../utility";

describe("Run", () => {
    let run: Run;

    beforeEach(() => {
        run = new Run();
    });

    describe("#bold()", () => {
        it("it should add bold to the properties", () => {
            run.bold();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:b");
        });
    });

    describe("#italic()", () => {
        it("it should add italics to the properties", () => {
            run.italic();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:i");
        });
    });

    describe("#underline()", () => {
        it("it should add underline to the properties", () => {
            run.underline();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:u");
        });
    });

    describe("#smallCaps()", () => {
        it("it should add smallCaps to the properties", () => {
            run.smallCaps();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:smallCaps");
        });
    });

    describe("#caps()", () => {
        it("it should add caps to the properties", () => {
            run.allCaps();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:caps");
        });
    });

    describe("#strike()", () => {
        it("it should add strike to the properties", () => {
            run.strike();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:strike");
        });
    });

    describe("#doubleStrike()", () => {
        it("it should add caps to the properties", () => {
            run.doubleStrike();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:dstrike");
        });
    });

    describe("#break()", () => {
        it("it should add break to the run", () => {
            run.break();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[1].rootKey, "w:br");
        });
    });

    describe("#tab()", () => {
        it("it should add break to the run", () => {
            run.tab();
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[1].rootKey, "w:tab");
        });
    });

    describe("#font()", () => {
        it("should allow chaining calls", () => {
            expect(run.font("Times")).to.equal(run);
        });

        it("should set the font as named", () => {
            run.font("Times");
            const tree = new Formatter().format(run);
            expect(tree).to.deep.equal({
                "w:r": [
                    {"w:rPr": [{"w:rFonts": [{_attr: {"w:ascii": "Times", "w:hAnsi": "Times"}}]}]},
                ],
            });
        });
    });
});
