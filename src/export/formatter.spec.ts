import { assert, expect } from "chai";
import * as sinon from "sinon";

import { Formatter } from "@export/formatter";
import { CoreProperties } from "@file/core-properties";
import { Paragraph, TextRun } from "@file/paragraph";
import { Attributes } from "@file/xml-components";

describe("Formatter", () => {
    let formatter: Formatter;

    beforeEach(() => {
        formatter = new Formatter();
    });

    describe("#format()", () => {
        it("should format simple paragraph", () => {
            const paragraph = new Paragraph("");
            const newJson = formatter.format(paragraph);
            assert.isDefined(newJson["w:p"]);
        });

        it("should remove xmlKeys", () => {
            const paragraph = new Paragraph("");
            const newJson = formatter.format(paragraph);
            const stringifiedJson = JSON.stringify(newJson);
            assert(stringifiedJson.indexOf("xmlKeys") < 0);
        });

        it("should format simple paragraph with bold text", () => {
            const paragraph = new Paragraph({
                children: [
                    new TextRun({
                        text: "test",
                        bold: true,
                    }),
                ],
            });

            const tree = formatter.format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:r": [
                            {
                                "w:rPr": [
                                    {
                                        "w:b": {},
                                    },
                                    {
                                        "w:bCs": {},
                                    },
                                ],
                            },
                            {
                                "w:t": [
                                    {
                                        _attr: {
                                            "xml:space": "preserve",
                                        },
                                    },
                                    "test",
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should format attributes (rsidSect)", () => {
            const attributes = new Attributes({
                rsidSect: "test2",
            });
            const tree = formatter.format(attributes);
            expect(tree).to.deep.equal({
                _attr: {
                    "w:rsidSect": "test2",
                },
            });
        });

        it("should format attributes (val)", () => {
            const attributes = new Attributes({
                val: "test",
            });
            const tree = formatter.format(attributes);
            expect(tree).to.deep.equal({
                _attr: {
                    "w:val": "test",
                },
            });
        });

        it("should should change 'p' tag into 'w:p' tag", () => {
            const paragraph = new Paragraph("");
            const newJson = formatter.format(paragraph);
            assert.isDefined(newJson["w:p"]);
        });

        it("should format Properties object correctly", () => {
            const properties = new CoreProperties({
                title: "test document",
                creator: "Dolan",
            });
            const newJson = formatter.format(properties);
            assert.isDefined(newJson["cp:coreProperties"]);
        });

        it("should call the prep method only once", () => {
            const paragraph = new Paragraph("");
            const spy = sinon.spy(paragraph, "prepForXml");

            formatter.format(paragraph);
            expect(spy.calledOnce).to.equal(true);
        });
    });
});
