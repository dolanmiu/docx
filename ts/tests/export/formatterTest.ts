/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/chai/chai.d.ts" />

import {Formatter} from "../../export/formatter";
import * as docx from "../../docx";
import {Attributes} from "../../docx/xml-components";
import {Properties} from "../../properties";
import {assert} from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Formatter", () => {
    let formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe("#format()", () => {
        it("should format simple paragraph", () => {
            let paragraph = new docx.Paragraph();
            let newJson = formatter.format(paragraph);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["w:p"]);
        });

        it("should remove xmlKeys", () => {
            let paragraph = new docx.Paragraph();
            let newJson = formatter.format(paragraph);
            let stringifiedJson = JSON.stringify(newJson);
            assert(stringifiedJson.indexOf("xmlKeys") < 0);
        });

        it("should format simple paragraph with bold text", () => {
            let paragraph = new docx.Paragraph();
            paragraph.addText(new docx.TextRun("test").bold());
            let newJson = formatter.format(paragraph);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["w:p"][1]["w:r"][0]["w:rPr"][0]["w:b"][0]["_attr"]["w:val"]);
        });

        it("should format attributes (rsidSect)", () => {
            let attributes = new Attributes({
                rsidSect: "test2"
            });
            let newJson = formatter.format(attributes);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["_attr"]["w:rsidSect"]);
        });

        it("should format attributes (val)", () => {
            let attributes = new Attributes({
                val: "test"
            });
            let newJson = formatter.format(attributes);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["_attr"]["w:val"]);
        });

        it("should should change 'p' tag into 'w:p' tag", () => {
            let paragraph = new docx.Paragraph();
            let newJson = formatter.format(paragraph);
            assert.isDefined(newJson["w:p"]);
        });

        it("should format Properties object correctly", () => {
            let properties = new Properties({
                title: "test document",
                creator: "Dolan"
            });
            let newJson = formatter.format(properties);
            newJson = jsonify(newJson);
            assert.isDefined(newJson["cp:coreProperties"]);
        });
    });
});