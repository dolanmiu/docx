import { assert } from "chai";
import * as fs from "fs";

import { Document } from "../../docx/document";
import { Paragraph } from "../../docx/paragraph";
import { LocalPacker } from "../../export/packer/local";
import { Properties } from "../../properties";
import { DefaultStylesFactory } from "../../styles/factory";

describe("Packer", () => {
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
        /* tslint:disable */
        it("should create a standard docx file", function (done) {
            /* tslint:enable */
            this.timeout(99999999);
            packer.pack("build-tests/tests/test.docx");
            const int = setInterval(() => {
                const stats = fs.statSync("build-tests/tests/test.docx");
                if (stats.size > 2000) {
                    clearInterval(int);
                    clearTimeout(out);
                    done();
                }
            }, 1000);
            const out = setTimeout(() => {
                clearInterval(int);
                try {
                    assert(false, "did not create a file within the alloted time");
                } catch (e) {
                    done(e);
                }
            }, 2000);
        });
    });
});
