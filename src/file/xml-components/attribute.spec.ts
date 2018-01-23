import { assert } from "chai";

import { Attributes } from "./";

describe("Attribute", () => {
    describe("#constructor()", () => {
        it("should have val as defined with populated constructor", () => {
            const newAttrs = new Attributes({
                val: "test",
            });
            const stringifiedJson = JSON.stringify(newAttrs);
            const newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root.val, "test");
        });

        it("should have space value as defined with populated constructor", () => {
            const newAttrs = new Attributes({
                space: "spaceTest",
            });
            const stringifiedJson = JSON.stringify(newAttrs);
            const newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root.space, "spaceTest");
        });
    });
});
