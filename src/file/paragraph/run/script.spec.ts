import { assert } from "chai";

import { Utility } from "tests/utility";

import { SubScript, SuperScript } from "./script";

describe("SubScript", () => {
    let subScript: SubScript;

    beforeEach(() => {
        subScript = new SubScript();
    });

    describe("#constructor()", () => {
        it("should create a Sub Script with correct attributes", () => {
            const newJson = Utility.jsonify(subScript);
            const attributes = {
                val: "subscript",
            };
            assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
        });

        it("should create a Sub Script with correct root key", () => {
            const newJson = Utility.jsonify(subScript);
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
            const newJson = Utility.jsonify(superScript);
            const attributes = {
                val: "superscript",
            };
            assert.equal(JSON.stringify(newJson.root[0].root), JSON.stringify(attributes));
        });

        it("should create a Super Script with correct root key", () => {
            const newJson = Utility.jsonify(superScript);
            assert.equal(newJson.rootKey, "w:vertAlign");
        });
    });
});
