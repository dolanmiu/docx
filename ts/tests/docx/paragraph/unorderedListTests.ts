import { NumberProperties } from "../../../docx/paragraph/unordered-list";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("NumberProperties", () => {
    let numberProperties: NumberProperties;

    beforeEach(() => {
        numberProperties = new NumberProperties(5, 10);
    });

    describe("#constructor()", () => {
        it("should create a Number Properties with correct root key", () => {
            let newJson = jsonify(numberProperties);
            assert.equal(newJson.rootKey, "w:numPr");
        });

        it("should create a Page Break with a Indent Level inside", () => {
            let newJson = jsonify(numberProperties);
            assert.equal(newJson.root[0].rootKey, "w:ilvl");
            assert.equal(newJson.root[0].root[0].root.val, 10);
        });

        it("should create a Page Break with a Number Id inside", () => {
            let newJson = jsonify(numberProperties);
            assert.equal(newJson.root[1].rootKey, "w:numId");
            assert.equal(newJson.root[1].root[0].root.val, 5);
        });
    });
});