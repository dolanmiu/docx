/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Style} from "../docx/paragraph/style";
import {assert} from "chai";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("ParagraphStyle", () => {
    var style: Style;

    describe("#constructor()", () => {
        it("should create a style with given value", () => {
            style = new Style("test");
            var newJson = jsonify(style);
            assert(newJson.pStyle[0]._attr.val === "test");
        });

        it("should create a style with blank val", () => {
            style = new Style("");
            var newJson = jsonify(style);
            assert(newJson.pStyle[0]._attr.val === "");
        });
    });

});