/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />

import {Formatter} from "../export/Formatter";
import * as docx from "../docx";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe.only('Formatter', () => {
    var formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe('#format()', () => {
        it("should format simple paragraph", () => {
            var paragraph = new docx.Paragraph();
            var newJson = formatter.format(paragraph);
            newJson = jsonify(newJson);
            console.log(newJson);
        });

        it("should should change 'p' tag into 'w:p' tag", () => {
            var newJson = formatter.format({ "p": "test" });
        });
    });
});