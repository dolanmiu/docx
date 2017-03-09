import { assert } from "chai";
import { Break } from "../../../docx/run/break";
import { Utility } from "../../utility";

describe("Break", () => {
    let currentBreak: Break;

    beforeEach(() => {
        currentBreak = new Break();
    });

    describe("#constructor()", () => {
        it("should create a Break with correct root key", () => {
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:br");
        });
    });
});
