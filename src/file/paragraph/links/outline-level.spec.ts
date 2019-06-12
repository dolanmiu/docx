import { assert } from "chai";

import { Utility } from "tests/utility";

import { OutlineLevel } from "./outline-level";

describe("ParagraphOutlineLevel", () => {
    let outlineLevel: OutlineLevel;

    describe("#constructor()", () => {
        it("should create an outlineLevel with given value", () => {
            outlineLevel = new OutlineLevel(0);
            const newJson = Utility.jsonify(outlineLevel);
            assert.equal(newJson.root[0].root.val, "0");
        });
    });
});
