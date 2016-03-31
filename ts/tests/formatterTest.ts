/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />

import {Formatter} from "../export/Formatter";

describe.only('Formatter', () => {
    var formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe('#format()', () => {
        it("should work", () => {
            var newJson = formatter.format({ "p": [{ "t": "test" }] });
        });

        it("should should change 'p' tag into 'w:p' tag", () => {
            var newJson = formatter.format({ "p": "test" });
        });
    });
});