import { assert } from "chai";
import * as docx from "../../../docx";

describe("Document", () => {
    let document: docx.Document;

    beforeEach(() => {
        document = new docx.Document();
    });

    describe("#constructor()", () => {

        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(document);
            let newJson;

            try {
                newJson = JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });
    });
});
