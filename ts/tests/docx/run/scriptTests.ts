import {SubScript, SuperScript} from "../../../docx/run/script";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("SubScript", () => {
    let subScript: SubScript;

    beforeEach(() => {
        subScript = new SubScript();
    });

    describe("#constructor()", () => {
        it("should create a Sub Script with correct attributes", () => {
            let newJson = jsonify(subScript);
            let attributes = {
                val: "subscript"
            };
            assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
        });

        it("should create a Sub Script with correct root key", () => {
            let newJson = jsonify(subScript);
            assert.equal(newJson.rootKey, "w:vertAlign");
        });
    });
});

describe("SuperScript", () => {
    let superScript: SuperScript;

    beforeEach(() => {
        superScript = new SuperScript();
    });

    describe("#constructor()", () => {
        it("should create a Super Script with correct attributes", () => {
            let newJson = jsonify(superScript);
            let attributes = {
                val: "superscript"
            };
            assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
        });

        it("should create a Super Script with correct root key", () => {
            let newJson = jsonify(superScript);
            assert.equal(newJson.rootKey, "w:vertAlign");
        });
    });
});