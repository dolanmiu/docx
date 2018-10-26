import { assert } from "chai";

import { Utility } from "tests/utility";

import { NumberProperties } from "./unordered-list";

describe("NumberProperties", () => {
    let numberProperties: NumberProperties;

    beforeEach(() => {
        numberProperties = new NumberProperties(5, 10);
    });

    describe("#constructor()", () => {
        it("should create a Number Properties with correct root key", () => {
            const newJson = Utility.jsonify(numberProperties);
            assert.equal(newJson.rootKey, "w:numPr");
        });

        it("should create a Page Break with a Indent Level inside", () => {
            const newJson = Utility.jsonify(numberProperties);
            assert.equal(newJson.root[0].rootKey, "w:ilvl");
            assert.equal(newJson.root[0].root[0].root.val, 10);
        });

        it("should create a Page Break with a Number Id inside", () => {
            const newJson = Utility.jsonify(numberProperties);
            assert.equal(newJson.root[1].rootKey, "w:numId");
            assert.equal(newJson.root[1].root[0].root.val, 5);
        });
    });
});
