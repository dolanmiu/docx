import { assert } from "chai";

import { Utility } from "tests/utility";

import { PositionOffset } from "./position-offset";

describe("PositionOffset", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const newJson = Utility.jsonify(new PositionOffset(50));
            assert.equal(newJson.rootKey, "wp:posOffset");
            assert.equal(newJson.root[0], 50);
        });
    });
});
