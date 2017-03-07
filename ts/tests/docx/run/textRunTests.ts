import { TextRun } from "../../../docx/run/text-run";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("TextRun", () => {
    let run: TextRun;

    describe("#constructor()", () => {

        it("should add text into run", () => {
            run = new TextRun("test");
            let newJson = jsonify(run);
            assert.equal(newJson.root[1].root, "test");
        });
    });
});