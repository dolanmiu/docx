import { Strike, DoubleStrike } from "../../../docx/run/strike";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Strike", () => {
    let strike: Strike;

    beforeEach(() => {
        strike = new Strike();
    });

    describe("#constructor()", () => {
        it("should create a Strike with correct root key", () => {
            let newJson = jsonify(strike);
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
            let newJson = jsonify(strike);
            assert.equal(newJson.rootKey, "w:dstrike");
        });
    });
});