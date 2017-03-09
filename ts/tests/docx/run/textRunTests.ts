import { assert } from "chai";
import { TextRun } from "../../../docx/run/text-run";
import { Utility } from "../../utility";

describe("TextRun", () => {
    let run: TextRun;

    describe("#constructor()", () => {

        it("should add text into run", () => {
            run = new TextRun("test");
            const newJson = Utility.jsonify(run);
            assert.equal(newJson.root[1].root, "test");
        });
    });
});
