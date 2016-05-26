/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import * as docx from "../docx";
import {assert} from "chai";

describe("Document", () => {
    let document: docx.Document;

    beforeEach(() => {
        document = new docx.Document();
    });

    describe("#constructor()", () => {

        it("should create valid JSON", () => {
            let stringifiedJson = JSON.stringify(document);
            let newJson;

            try {
                newJson = JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });
    });
});