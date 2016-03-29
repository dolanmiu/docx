/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Attributes} from "../docx/xml-components/p";
import {assert} from "chai";

describe('Attribute', () => {
    var attributes: Attributes;

    beforeEach(() => {
        attributes = new Attributes();
    });

    describe('#constructor()', () => {

        it("should not add val with empty constructor", () => {
            var newAttrs = new Attributes();
            var stringifiedJson = JSON.stringify(newAttrs);
            var newJson = JSON.parse(stringifiedJson);
            assert.isUndefined(newJson._attrs.val);
        });

        it("should have val as defined with populated constructor", () => {
            var newAttrs = new Attributes("test");
            var stringifiedJson = JSON.stringify(newAttrs);
            var newJson = JSON.parse(stringifiedJson);
            assert(newJson._attrs.val === "test");
        });
    });
});