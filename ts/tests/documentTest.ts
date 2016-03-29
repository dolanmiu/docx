/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import * as docx from "../docx";
import {assert} from "chai";

describe('Document', () => {
    var document: docx.Document;

    beforeEach(() => {
        document = new docx.Document();
    });

    describe('#constructor()', () => {
        
        it("should create valid JSON", () => {
            console.log(JSON.stringify(document, null, "    "));
            var stringifiedJson = JSON.stringify(document);
            var newJson;

            try {
                newJson = JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });
    });
});