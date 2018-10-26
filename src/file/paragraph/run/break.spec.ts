import { assert } from "chai";

import { Utility } from "tests/utility";

import { Break } from "./break";

describe("Break", () => {
    let currentBreak: Break;

    beforeEach(() => {
        currentBreak = new Break();
    });

    describe("#constructor()", () => {
        it("should create a Break with correct root key", () => {
            const newJson = Utility.jsonify(currentBreak);
            assert.equal(newJson.rootKey, "w:br");
        });
    });
});
