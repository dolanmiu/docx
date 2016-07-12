import * as u from "../../../docx/run/underline";
import {TextRun} from "../../../docx/run/text-run";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe.only("Underline", () => {

    describe("#constructor()", () => {

        it("should create a new Underline object", () => {
            let underline = new u.Underline();
            let newJson = jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });
    });
});

describe.only("Underline", () => {

    describe("#constructor()", () => {
        it("should create a new Underline object", () => {
            let underline = new u.DashDotDotHeavyUnderline();
            let newJson = jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });

                it("should put value in attribute", () => {
            let underline = new u.DashDotDotHeavyUnderline();
            let newJson = jsonify(underline);
            assert.equal(newJson.rootKey, "w:u");
        });
    });
});
