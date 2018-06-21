import { assert } from "chai";

import { SimplePos } from "./simple-pos";
import { Utility } from "../../../tests/utility";

describe("SimplePos", () => {
    describe("#constructor()", () => {
        it("should create a element with correct root key", () => {
            const newJson = Utility.jsonify(new SimplePos());
            assert.equal(newJson.rootKey, "wp:simplePos");
            assert.include(newJson.root[0].root, {
                x: 0,
                y: 0,
            });
        });
    });
});
