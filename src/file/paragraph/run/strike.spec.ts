import { assert } from "chai";

import { Utility } from "tests/utility";

import { DoubleStrike, Strike } from "./formatting";

describe("Strike", () => {
    let strike: Strike;

    beforeEach(() => {
        strike = new Strike();
    });

    describe("#constructor()", () => {
        it("should create a Strike with correct root key", () => {
            const newJson = Utility.jsonify(strike);
            assert.equal(newJson.rootKey, "w:strike");
        });
    });
});

describe("DoubleStrike", () => {
    let strike: DoubleStrike;

    beforeEach(() => {
        strike = new DoubleStrike();
    });

    describe("#constructor()", () => {
        it("should create a Double Strike with correct root key", () => {
            const newJson = Utility.jsonify(strike);
            assert.equal(newJson.rootKey, "w:dstrike");
        });
    });
});
