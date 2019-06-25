import { assert, expect } from "chai";

import { Formatter } from "export/formatter";

import { Document } from "./document";

describe("Document", () => {
    let document: Document;

    beforeEach(() => {
        document = new Document();
    });

    describe("#constructor()", () => {
        it("should create valid JSON", () => {
            const stringifiedJson = JSON.stringify(document);

            try {
                JSON.parse(stringifiedJson);
            } catch (e) {
                assert.isTrue(false);
            }
            assert.isTrue(true);
        });

        it("should create default section", () => {
            const body = new Formatter().format(document)["w:document"][1]["w:body"];
            expect(body[0]).to.have.property("w:sectPr");
        });
    });
});
