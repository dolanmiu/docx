/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import {assert} from "chai";
import {Numbering} from "../numbering";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("", () => {
    
    let numbering = new Numbering;
    beforeEach(() => {
        numbering = new Numbering();
    });

    describe("#methodName()", () => {
        it("should ", () => {

        });
    });
});