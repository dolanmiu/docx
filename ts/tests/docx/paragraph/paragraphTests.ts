import { assert, expect } from "chai";
import * as docx from "../../../docx";
import { Formatter } from "../../../export/formatter";
import { Numbering } from "../../../numbering";
import { Utility } from "../../utility";

describe("Paragraph", () => {
    let paragraph: docx.Paragraph;

    beforeEach(() => {
        paragraph = new docx.Paragraph();
    });

    describe("#constructor()", () => {

        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(paragraph);
            let newJson;

            try {
                newJson = JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });

        it("should create have valid properties", () => {
            const stringifiedJson = JSON.stringify(paragraph);
            const newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root[0].rootKey, "w:pPr");
        });
    });

    describe("#heading1()", () => {
        it("should add heading style to JSON", () => {
            paragraph.heading1();
            const newJson = Utility.jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[0].root.val, "Heading1");
        });
    });

    describe("#heading2()", () => {
        it("should add heading style to JSON", () => {
            paragraph.heading2();
            const newJson = Utility.jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "Heading2");
        });
    });

    describe("#heading3()", () => {
        it("should add heading style to JSON", () => {
            paragraph.heading3();
            const newJson = Utility.jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "Heading3");
        });
    });

    describe("#title()", () => {
        it("should add title style to JSON", () => {
            paragraph.title();
            const newJson = Utility.jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "Title");
        });
    });

    describe("#center()", () => {
        it("should add center alignment to JSON", () => {
            paragraph.center();
            const newJson = Utility.jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "center");
        });
    });

    describe("#thematicBreak()", () => {
        it("should add thematic break to JSON", () => {
            paragraph.thematicBreak();
            const newJson = Utility.jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].rootKey, "w:pBdr");
        });
    });

    describe("#pageBreak()", () => {
        it("should add page break to JSON", () => {
            paragraph.pageBreak();
            const newJson = Utility.jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[1].rootKey, "w:br");
        });

        it("should add page break with 'page' type", () => {
            paragraph.pageBreak();
            const newJson = Utility.jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[1].root[0].root.type, "page");
        });
    });

    describe("#bullet()", () => {
        it("should add list paragraph style to JSON", () => {
            paragraph.bullet();
            const newJson = Utility.jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[0].root.val, "ListParagraph");
        });

        it("it should add numbered properties", () => {
            paragraph.bullet();
            const newJson = Utility.jsonify(paragraph);
            assert.isDefined(newJson.root[0].root[2]);
        });
    });

    describe("#setNumbering", () => {
        it("should add list paragraph style to JSON", () => {
            const numbering = new Numbering();
            const numberedAbstract = numbering.createAbstractNumbering();
            numberedAbstract.createLevel(0, "lowerLetter", "%1)", "start");
            const letterNumbering = numbering.createConcreteNumbering(numberedAbstract);

            paragraph.setNumbering(letterNumbering, 0);
            const newJson = Utility.jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[0].root.val, "ListParagraph");
        });

        it("it should add numbered properties", () => {
            const numbering = new Numbering();
            const numberedAbstract = numbering.createAbstractNumbering();
            numberedAbstract.createLevel(0, "lowerLetter", "%1)", "start");
            const letterNumbering = numbering.createConcreteNumbering(numberedAbstract);

            paragraph.setNumbering(letterNumbering, 0);
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {_attr: {}},
                            {"w:pStyle": [{_attr: {"w:val": "ListParagraph"}}]},
                            {
                                "w:numPr": [
                                    {"w:ilvl": [{_attr: {"w:val": 0}}]},
                                    {"w:numId": [{_attr: {"w:val": letterNumbering.id}}]},
                                ],
                            },
                        ],
                    },
                ],
            });
        });
    });

    describe("#style", () => {
        it("should set the paragraph style to the given styleId", () => {
            paragraph.style("myFancyStyle");
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {_attr: {}},
                            {"w:pStyle": [{_attr: {"w:val": "myFancyStyle"}}]},
                        ],
                    },
                ],
            });
        });
    });

    describe("#indent", () => {
        it("should set the paragraph indent to the given values", () => {
            paragraph.indent(720);
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {_attr: {}},
                            {"w:ind": [{_attr: {"w:left": 720}}]},
                        ],
                    },
                ],
            });
        });
    });

    describe("#spacing", () => {
        it("should set the paragraph spacing to the given values", () => {
            paragraph.spacing({before: 90, line: 50});
            const tree = new Formatter().format(paragraph);
            expect(tree).to.deep.equal({
                "w:p": [
                    {
                        "w:pPr": [
                            {_attr: {}},
                            {"w:spacing": [{_attr: {"w:before": 90, "w:line": 50}}]},
                        ],
                    },
                ],
            });
        });
    });
});
