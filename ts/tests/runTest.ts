/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Run} from "../docx/run";
import {TextRun} from "../docx//run/text-run"
import {assert} from "chai";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe('Run', () => {
    var run: Run;

    beforeEach(() => {
        run = new Run();
    });

    describe('#constructor()', () => {

        it("", () => {
            
        });
    });
});

describe('TextRun', () => {
    var run: TextRun;

    describe('#constructor()', () => {

        it("should add text into run", () => {
            run = new TextRun("test");
            var newJson = jsonify(run);
            assert(newJson.r[1].t === "test");
        });
    });
});