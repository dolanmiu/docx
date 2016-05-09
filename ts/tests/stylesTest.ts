/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Styles} from "../styles";
import {assert} from "chai";

describe("Styles", () => {
    var styles: Styles;

    beforeEach(() => {
        styles = new Styles();
    });

    describe('#constructor()', () => {

        it("should not add val with empty constructor", () => {
            var newAttrs = new Styles();
            var stringifiedJson = JSON.stringify(newAttrs);
            var newJson = JSON.parse(stringifiedJson);
            assert.isUndefined(newJson.root.val);
        });
    });
});