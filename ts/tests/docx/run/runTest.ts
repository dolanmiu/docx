import { Run } from "../../../docx/run";
import { TextRun } from "../../../docx/run/text-run";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Run", () => {
    let run: Run;

    beforeEach(() => {
        run = new Run();
    });

    describe("#bold()", () => {
        it("it should add bold to the properties", () => {
            run.bold();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:b");
        });
    });

    describe("#italic()", () => {
        it("it should add italics to the properties", () => {
            run.italic();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:i");
        });
    });

    describe("#underline()", () => {
        it("it should add underline to the properties", () => {
            run.underline();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:u");
        });
    });

    describe("#smallCaps()", () => {
        it("it should add smallCaps to the properties", () => {
            run.smallCaps();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:smallCaps");
        });
    });

    describe("#caps()", () => {
        it("it should add caps to the properties", () => {
            run.allCaps();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:caps");
        });
    });

    describe("#strike()", () => {
        it("it should add strike to the properties", () => {
            run.strike();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:strike");
        });
    });

    describe("#doubleStrike()", () => {
        it("it should add caps to the properties", () => {
            run.doubleStrike();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:dstrike");
        });
    });

    describe("#break()", () => {
        it("it should add break to the run", () => {
            let run = new Run();
            run.break();
            let newJson = jsonify(run);
            assert.equal(newJson.root[1].rootKey, "w:br");
        });
    });

    describe("#tab()", () => {
        it("it should add break to the run", () => {
            let run = new Run();
            run.tab();
            let newJson = jsonify(run);
            assert.equal(newJson.root[1].rootKey, "w:tab");
        });
    });
});