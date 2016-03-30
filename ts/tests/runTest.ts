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

    describe('#bold()', () => {
        it("it should add bold to the properties", () => {
            run.bold();
            var newJson = jsonify(run);
            assert.isDefined(newJson.r[0].rPr[0].b);
        });
    });

    describe('#italics()', () => {
        it("it should add italics to the properties", () => {
            run.italics();
            var newJson = jsonify(run);
            assert.isDefined(newJson.r[0].rPr[0].i);
        });
    });

    describe('#underline()', () => {
        it("it should add underline to the properties", () => {
            run.underline();
            var newJson = jsonify(run);
            assert.isDefined(newJson.r[0].rPr[0].u);
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