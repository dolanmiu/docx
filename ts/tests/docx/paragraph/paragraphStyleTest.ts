import { Style } from "../../../docx/paragraph/style";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("ParagraphStyle", () => {
    let style: Style;

    describe("#constructor()", () => {
        it("should create a style with given value", () => {
            style = new Style("test");
            let newJson = jsonify(style);
            assert.equal(newJson.root[0].root.val, "test");
        });

        it("should create a style with blank val", () => {
            style = new Style("");
            let newJson = jsonify(style);
            assert.equal(newJson.root[0].root.val, "");
        });
    });

});