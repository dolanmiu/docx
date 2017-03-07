import * as docx from "../../../docx";
import { assert } from "chai";

function jsonify(obj: Object) {
    let stringifiedJson = JSON.stringify(obj);
    return JSON.parse(stringifiedJson);
}

describe("Paragraph", () => {
    let paragraph: docx.Paragraph;

    beforeEach(() => {
        paragraph = new docx.Paragraph();
    });

    describe("#constructor()", () => {

        it("should create valid JSON", () => {
            let stringifiedJson = JSON.stringify(paragraph);
            let newJson;

            try {
                newJson = JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });

        it("should create have valid properties", () => {
            let stringifiedJson = JSON.stringify(paragraph);
            let newJson = JSON.parse(stringifiedJson);
            assert.equal(newJson.root[0].rootKey, "w:pPr");
        });
    });

    describe("#heading1()", () => {
        it("should add heading style to JSON", () => {
            paragraph.heading1();
            let newJson = jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[0].root.val, "Heading1");
        });
    });

    describe("#heading2()", () => {
        it("should add heading style to JSON", () => {
            paragraph.heading2();
            let newJson = jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "Heading2");
        });
    });

    describe("#heading3()", () => {
        it("should add heading style to JSON", () => {
            paragraph.heading3();
            let newJson = jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "Heading3");
        });
    });

    describe("#title()", () => {
        it("should add title style to JSON", () => {
            paragraph.title();
            let newJson = jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "Title");
        });
    });

    describe("#center()", () => {
        it("should add center alignment to JSON", () => {
            paragraph.center();
            let newJson = jsonify(paragraph);

            assert.equal(newJson.root[0].root[1].root[0].root.val, "center");
        });
    });

    describe("#thematicBreak()", () => {
        it("should add thematic break to JSON", () => {
            paragraph.thematicBreak();
            let newJson = jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].rootKey, "w:pBdr");
        });
    });

    describe("#pageBreak()", () => {
        it("should add page break to JSON", () => {
            paragraph.pageBreak();
            let newJson = jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[1].rootKey, "w:br");
        });

        it("should add page break with 'page' type", () => {
            paragraph.pageBreak();
            let newJson = jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[1].root[0].root.type, "page");
        });
    });

    describe("#bullet()", () => {
        it("should add list paragraph style to JSON", () => {
            paragraph.bullet();
            let newJson = jsonify(paragraph);
            assert.equal(newJson.root[0].root[1].root[0].root.val, "ListParagraph");
        });

        it("it should add numbered properties", () => {
            paragraph.bullet();
            let newJson = jsonify(paragraph);
            assert.isDefined(newJson.root[0].root[2]);
        });
    });
});