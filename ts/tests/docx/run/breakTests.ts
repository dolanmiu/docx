import {Break} from "../../../docx/run/break";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe.only("Break", () => {
    let currentBreak: Break;

    beforeEach(() => {
        currentBreak = new Break();
    });

    describe("#constructor()", () => {
        it("should create a Break with correct root key", () => {
            let newJson = jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:br");
        });
    });
});