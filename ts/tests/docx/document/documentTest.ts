import { assert, expect } from "chai";
import * as docx from "../../../docx";
import { Formatter } from "../../../export/formatter";

describe("Document", () => {
    let document: docx.Document;

    beforeEach(() => {
        document = new docx.Document();
    });

    describe("#constructor()", () => {

        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(document);
            let newJson;

            try {
                newJson = JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });
    });

    describe("#createParagraph", () => {
        it("should create a new paragraph and append it to body", () => {
            const para = document.createParagraph();
            expect(para).to.be.an.instanceof(docx.Paragraph);
            const body = new Formatter().format(document)["w:document"][1]["w:body"];
            expect(body).to.be.an("array").which.has.length.at.least(1);
            expect(body[0]).to.have.property("w:p");
        });

        it("should use the text given to create a run in the paragraph", () => {
            const para = document.createParagraph("sample paragraph text");
            expect(para).to.be.an.instanceof(docx.Paragraph);
            const body = new Formatter().format(document)["w:document"][1]["w:body"];
            expect(body).to.be.an("array").which.has.length.at.least(1);
            expect(body[0]).to.have.property("w:p").which.includes({
                "w:r": [
                    {"w:rPr": []},
                    {"w:t": [{_attr: {"xml:space": "preserve"}}, "sample paragraph text"]},
                ],
            });
        });
    });

    describe("#createTable", () => {
        it("should create a new table and append it to body", () => {
            const table = document.createTable(2, 3);
            expect(table).to.be.an.instanceof(docx.Table);
            const body = new Formatter().format(document)["w:document"][1]["w:body"];
            expect(body).to.be.an("array").which.has.length.at.least(1);
            expect(body[0]).to.have.property("w:tbl");
        });

        it("should create a table with the correct dimensions", () => {
            document.createTable(2, 3);
            const body = new Formatter().format(document)["w:document"][1]["w:body"];
            expect(body).to.be.an("array").which.has.length.at.least(1);
            expect(body[0]).to.have.property("w:tbl").which.includes({
                "w:tblGrid": [
                    {"w:gridCol": [{_attr: {"w:w": 1}}]},
                    {"w:gridCol": [{_attr: {"w:w": 1}}]},
                    {"w:gridCol": [{_attr: {"w:w": 1}}]},
                ],
            });
            expect(body[0]["w:tbl"].filter((x) => x["w:tr"])).to.have.length(2);
        });
    });
});
