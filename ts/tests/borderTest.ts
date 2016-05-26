/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {ThematicBreak} from "../docx/paragraph/border";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Border", () => {

});

describe("ThematicBreak", () => {
    let thematicBreak: ThematicBreak;

    beforeEach(() => {
        thematicBreak = new ThematicBreak();
    });

    describe("#constructor()", () => {
        it("should create a Thematic Break with correct border properties", () => {
            let newJson = jsonify(thematicBreak);
            let attributes = {
                color: "auto",
                space: "1",
                val: "single",
                sz: "6"
            };
            assert.equal(JSON.stringify(newJson.root[0].root[0].root), JSON.stringify(attributes));
        });
    });
});