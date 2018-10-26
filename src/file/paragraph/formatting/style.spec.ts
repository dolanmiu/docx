import { assert } from "chai";

import { Utility } from "tests/utility";

import { Style } from "./style";

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
