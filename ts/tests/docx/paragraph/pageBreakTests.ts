import { assert } from "chai";
import { PageBreak } from "../../../docx/paragraph/page-break";
import { Utility } from "../../utility";

describe("PageBreak", () => {
    let pageBreak: PageBreak;

    beforeEach(() => {
        pageBreak = new PageBreak();
    });

    describe("#constructor()", () => {
        it("should create a Page Break with correct attributes", () => {
            const newJson = Utility.jsonify(pageBreak);
            const attributes = {
                type: "page",
            };
            assert.equal(JSON.stringify(newJson.root[1].root[0].root), JSON.stringify(attributes));
        });

        it("should create a Page Break with w:r", () => {
            const newJson = Utility.jsonify(pageBreak);
            assert.equal(newJson.rootKey, "w:r");
        });

        it("should create a Page Break with a Break inside", () => {
            const newJson = Utility.jsonify(pageBreak);
            assert.equal(newJson.root[1].rootKey, "w:br");
        });
    });
});
