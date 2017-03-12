import { assert, expect } from "chai";
import { Drawing } from "../../../../docx/run/run-components/drawing";
import { Utility } from "../../../utility";

describe.only("Drawing", () => {
    let currentBreak: Drawing;

    beforeEach(() => {
        currentBreak = new Drawing("test.jpg");
    });

    describe("#constructor()", () => {
        it("should create a Drawing with correct root key", () => {
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:drawing");
        });
    });
});
