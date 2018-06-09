import { assert } from "chai";

import { Align } from "./align";
import { Utility } from "../../../tests/utility";
import { VerticalPositionAlign } from ".";

describe("Align", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const newJson = Utility.jsonify(new Align(VerticalPositionAlign.CENTER));
            assert.equal(newJson.rootKey, "wp:align");
            assert.include(newJson.root[0], VerticalPositionAlign.CENTER);
        });
    });
});
