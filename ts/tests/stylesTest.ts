/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import {Styles} from "../styles";
import {assert} from "chai";

describe("Styles", () => {
    let styles: Styles;

    beforeEach(() => {
        styles = new Styles();
    });

    describe("#constructor()", () => {

        it("should create styles with correct rootKey", () => {
            let styles = new Styles();
            let stringifiedJson = JSON.stringify(styles);
            let newJson = JSON.parse(stringifiedJson);

            assert.equal(newJson.rootKey, "w:styles");
        });
    });
});