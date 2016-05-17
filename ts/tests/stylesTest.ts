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

        it("should create styles with correct rootKey", () => {
            var styles = new Styles();
            var stringifiedJson = JSON.stringify(styles);
            var newJson = JSON.parse(stringifiedJson);
            
            assert.equal(newJson.rootKey, "w:styles");
        });
    });
});