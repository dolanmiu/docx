/* tslint:disable:typedef space-before-function-paren */
import { assert } from "chai";
import * as fs from "fs";
import { stub } from "sinon";

import { LocalPacker } from "../../export/packer/local";
import { File, Paragraph } from "../../file";

describe("LocalPacker", () => {
    let packer: LocalPacker;

    beforeEach(() => {
        const file = new File({
            creator: "Dolan Miu",
            revision: "1",
            lastModifiedBy: "Dolan Miu",
        });
        const paragraph = new Paragraph("test text");
        const heading = new Paragraph("Hello world").heading1();
        file.addParagraph(new Paragraph("title").title());
        file.addParagraph(heading);
        file.addParagraph(new Paragraph("heading 2").heading2());
        file.addParagraph(paragraph);

        packer = new LocalPacker(file);
    });

    describe("#pack()", () => {
        it("should create a standard docx file", async function() {
            this.timeout(99999999);
            await packer.pack("build/tests/test");
            fs.statSync("build/tests/test.docx");
        });

        it("should handle exception if it throws any", () => {
            // tslint:disable-next-line:no-any
            const compiler = stub((packer as any).packer, "compile");
            compiler.throwsException();
            return packer.pack("build/tests/test").catch((error) => {
                assert.isDefined(error);
            });
        });
    });

    describe("#packPdf", () => {
        it("should create a standard PDF file", async function() {
            this.timeout(99999999);

            // tslint:disable-next-line:no-any
            const pdfConverterConvert = stub((packer as any).pdfConverter, "convert");
            pdfConverterConvert.returns("Test PDF Contents");

            await packer.packPdf("build/tests/pdf-test");
            fs.statSync("build/tests/pdf-test.pdf");
        });

        it("should handle exception if it throws any", () => {
            // tslint:disable-next-line:no-any
            const compiler = stub((packer as any).packer, "compile");
            compiler.throwsException();
            return packer.packPdf("build/tests/pdf-test").catch((error) => {
                assert.isDefined(error);
            });
        });
    });
});
