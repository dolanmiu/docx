import { assert } from "chai";
import { Style } from "../../../docx/paragraph/style";
import { Utility } from "../../utility";

describe("ParagraphStyle", () => {
    let style: Style;

    describe("#constructor()", () => {
        it("should create a style with given value", () => {
            style = new Style("test");
            const newJson = Utility.jsonify(style);
            assert.equal(newJson.root[0].root.val, "test");
        });

        it("should create a style with blank val", () => {
            style = new Style("");
            const newJson = Utility.jsonify(style);
            assert.equal(newJson.root[0].root.val, "");
        });
    });
});
