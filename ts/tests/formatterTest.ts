/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import {Formatter} from "../export/Formatter";
import * as docx from "../docx";
import {Attributes} from "../docx/xml-components";
import {Properties} from "../properties";

import {assert} from "chai";

function jsonify(obj: Object) {
    var stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Formatter", () => {
    var formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe('#format()', () => {
        it("should format simple paragraph", () => {
            var paragraph = new docx.Paragraph();
            var newJson = formatter.format(paragraph);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["w:p"]);
        });

        it("should remove xmlKeys", () => {
            var paragraph = new docx.Paragraph();
            var newJson = formatter.format(paragraph);
            var stringifiedJson = JSON.stringify(newJson);
            assert(stringifiedJson.indexOf("xmlKeys") < 0);
        });

        it("should format simple paragraph with bold text", () => {
            var paragraph = new docx.Paragraph();
            paragraph.addText(new docx.TextRun("test").bold());
            var newJson = formatter.format(paragraph);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["w:p"][3]["w:r"][0]["w:rPr"][0]["w:b"][0]["_attr"]["w:val"]);
        });

        it("should format attributes (rsidSect)", () => {
            var attributes = new Attributes({
                rsidSect: "test2"
            });
            var newJson = formatter.format(attributes);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["_attr"]["w:rsidSect"]);
        });

        it("should format attributes (val)", () => {
            var attributes = new Attributes({
                val: "test"
            });
            var newJson = formatter.format(attributes);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["_attr"]["w:val"]);
        });

        it("should should change 'p' tag into 'w:p' tag", () => {
            var newJson = formatter.format({ "p": "test", "xmlKeys": { "p": "w:p" } });
            assert.isDefined(newJson["w:p"]);
        });

        it("should format Properties object correctly", () => {
            var properties = new Properties({
                title: "test document",
                creator: "Dolan"
            });
            var newJson = formatter.format(properties);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["cp:coreProperties"]);
        });
    });
});