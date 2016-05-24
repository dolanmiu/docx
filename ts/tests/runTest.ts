/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {Run} from "../docx/run";
import {TextRun} from "../docx//run/text-run"
import {assert} from "chai";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Run", () => {
    var run: Run;

    beforeEach(() => {
        run = new Run();
    });

    describe('#bold()', () => {
        it("it should add bold to the properties", () => {
            run.bold();
            var newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:b");
        });
    });

    describe('#italic()', () => {
        it("it should add italics to the properties", () => {
            run.italic();
            var newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:i");
        });
    });

    describe('#underline()', () => {
        it("it should add underline to the properties", () => {
            run.underline();
            var newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:u");
        });
    });
});

describe('TextRun', () => {
    var run: TextRun;

    describe('#constructor()', () => {

        it("should add text into run", () => {
            run = new TextRun("test");
            var newJson = jsonify(run);
            assert.equal(newJson.root[1].root, "test");
        });
    });
});