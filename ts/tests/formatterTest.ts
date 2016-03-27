/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />

import {Formatter} from "../export/Formatter";

describe('Formatter', () => {
    var formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe('#format()', () => {
        it("should work", () => {
            var newJson = formatter.format('{"p":["stuff"]}');
            console.log(newJson);
        });
    });
});