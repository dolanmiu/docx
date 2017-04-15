import { assert } from "chai";
import * as fs from "fs";
import { Drawing } from "../../../../docx/run/run-components/drawing";
import { Utility } from "../../../utility";

describe("Drawing", () => {
    let currentBreak: Drawing;

    beforeEach(() => {
        const path = "./demo/penguins.jpg";
        currentBreak = new Drawing({
            fileName: "test.jpg",
            referenceId: 1,
            stream: fs.createReadStream(path),
            path: path,
        });
    });

    describe("#constructor()", () => {
        it("should create a Drawing with correct root key", () => {
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:drawing");
            // console.log(JSON.stringify(newJson, null, 2));
        });
    });
});
