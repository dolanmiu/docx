/* tslint:disable:typedef space-before-function-paren */
import * as fs from "fs";

import { Document } from "../../docx/document";
import { Paragraph } from "../../docx/paragraph";
import { LocalPacker } from "../../export/packer/local";
import { Properties } from "../../properties";
import { DefaultStylesFactory } from "../../styles/factory";

describe("LocalPacker", () => {
    let packer: LocalPacker;
    let stylesFactory: DefaultStylesFactory;

    beforeEach(() => {
        const document = new Document();
        const paragraph = new Paragraph("test text");
        const heading = new Paragraph("Hello world").heading1();
        document.addParagraph(new Paragraph("title").title());
        document.addParagraph(heading);
        document.addParagraph(new Paragraph("heading 2").heading2());
        document.addParagraph(paragraph);
        const properties = new Properties({
            creator: "Dolan Miu",
            revision: "1",
            lastModifiedBy: "Dolan Miu",
        });
        stylesFactory = new DefaultStylesFactory();
        packer = new LocalPacker(document, stylesFactory.newInstance(), properties);
    });

    describe("#pack()", () => {
        it("should create a standard docx file", async function () {
            this.timeout(99999999);
            await packer.pack("build-tests/tests/test");
            fs.statSync("build-tests/tests/test.docx");
        });
    });

    describe("#packPdf", () => {
        it("should create a standard PDF file", async function () {
            this.timeout(99999999);

            await packer.packPdf("build-tests/tests/pdf-test");
            fs.statSync("build-tests/tests/pdf-test.pdf");
        });
    });
});
