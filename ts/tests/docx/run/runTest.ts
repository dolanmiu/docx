/// <reference path="../../../typings/mocha/mocha.d.ts" />
/// <reference path="../../../typings/chai/chai.d.ts" />

import {Run} from "../../../docx/run";
import {TextRun} from "../../../docx/run/text-run";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Run", () => {
    let run: Run;

    beforeEach(() => {
        run = new Run();
    });

    describe("#bold()", () => {
        it("it should add bold to the properties", () => {
            run.bold();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:b");
        });
    });

    describe("#italic()", () => {
        it("it should add italics to the properties", () => {
            run.italic();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:i");
        });
    });

    describe("#underline()", () => {
        it("it should add underline to the properties", () => {
            run.underline();
            let newJson = jsonify(run);
            assert.equal(newJson.root[0].root[0].rootKey, "w:u");
        });
    });
});

describe("TextRun", () => {
    let run: TextRun;

    describe("#constructor()", () => {

        it("should add text into run", () => {
            run = new TextRun("test");
            let newJson = jsonify(run);
            assert.equal(newJson.root[1].root, "test");
        });
    });
});