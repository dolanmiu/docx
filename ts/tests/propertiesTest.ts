/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Properties} from "../properties";
import {assert} from "chai";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Properties", () => {
    var properties: Properties;

    beforeEach(() => {

    });

    describe("#constructor()", () => {
        it("should create properties with a title", () => {
            properties = new Properties({
                title: "test document"
            });
            var newJson = jsonify(properties);
            assert(newJson.root[1].root === "test document");
        });
    })
});