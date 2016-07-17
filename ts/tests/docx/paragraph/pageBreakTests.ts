import {PageBreak} from "../../../docx/paragraph/page-break";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("PageBreak", () => {
    let pageBreak: PageBreak;

    beforeEach(() => {
        pageBreak = new PageBreak();
    });

    describe("#constructor()", () => {
        it("should create a Tab Stop with correct attributes", () => {
            let newJson = jsonify(pageBreak);
            let attributes = {
                type: "page"
            };
            assert.equal(JSON.stringify(newJson.root[1].root[0].root), JSON.stringify(attributes));
        });

        it("should create a Page Break with w:r", () => {
            let newJson = jsonify(pageBreak);
            assert.equal(newJson.rootKey, "w:r");
        });
        
        it("should create a Page Break with a Break inside", () => {
            let newJson = jsonify(pageBreak);
            assert.equal(newJson.root[1].rootKey, "w:br");
        });
    });
});