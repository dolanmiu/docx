/* tslint:disable:typedef space-before-function-paren */
import { assert, expect } from "chai";
import { stub } from "sinon";

import { File, Paragraph } from "../../file";
import { PdfPacker } from "./pdf-packer";

describe("PdfPacker", () => {
    let packer: PdfPacker;
    let file: File;

    beforeEach(() => {
        file = new File({
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

        packer = new PdfPacker();
    });

    describe("#packPdf", () => {
        it("should create a standard PDF file", async function() {
            this.timeout(99999999);
            // tslint:disable-next-line:no-any
            const pdfConverterConvert = stub((packer as any).pdfConverter, "convert");
            pdfConverterConvert.returns(new Buffer(""));
            const buffer = await packer.toBuffer(file);
            expect(buffer).is.an.instanceof(Buffer);
        });

        it("should handle exception if it throws any", () => {
            // tslint:disable-next-line:no-any
            const compiler = stub((packer as any).packer, "toBuffer");
            compiler.throwsException();
            return packer.toBuffer(file).catch((error) => {
                assert.isDefined(error);
            });
        });
    });
});
