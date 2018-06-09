import { assert } from "chai";

import { VerticalPositionAlign } from ".";
import { Utility } from "../../../tests/utility";
import { Align } from "./align";

describe("Align", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const newJson = Utility.jsonify(new Align(VerticalPositionAlign.CENTER));
            assert.equal(newJson.rootKey, "wp:align");
            assert.include(newJson.root[0], VerticalPositionAlign.CENTER);
        });
    });
});
