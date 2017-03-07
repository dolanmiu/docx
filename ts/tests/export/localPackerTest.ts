import * as fs from "fs";
import { LocalPacker } from "../../export/packer/local";
import { Document } from "../../docx/document";
import { Properties } from "../../properties";
import { DefaultStyle } from "../../styles/sample";
import { Paragraph } from "../../docx/paragraph";
import { DefaultStylesFactory } from "../../styles/factory";
import { assert } from "chai";

describe("Packer", () => {
    let packer: LocalPacker;
    let stylesFactory: DefaultStylesFactory;

    beforeEach(() => {
        let document = new Document();
        let paragraph = new Paragraph("test text");
        let heading = new Paragraph("Hello world").heading1();
        document.addParagraph(new Paragraph("title").title());
        document.addParagraph(heading);
        document.addParagraph(new Paragraph("heading 2").heading2());
        document.addParagraph(paragraph);
        let properties = new Properties({
            creator: "Dolan Miu",
            revision: "1",
            lastModifiedBy: "Dolan Miu"
        });
        stylesFactory = new DefaultStylesFactory();
        packer = new LocalPacker(document, stylesFactory.newInstance(), properties);
    });

    describe("#pack()", () => {
        it("should create a standard docx file", function (done) {
            this.timeout(99999999);
            packer.pack("build-tests/tests/test.docx");
            let int = setInterval(() => {
                const stats = fs.statSync("build-tests/tests/test.docx");
                if (stats.size > 2000) {
                    clearInterval(int);
                    clearTimeout(out);
                    done();
                }
            }, 1000);
            let out = setTimeout(() => {
                clearInterval(int);
                try {
                    assert(false, 'did not create a file within the alloted time');
                } catch (e) {
                    done(e);
                }
            }, 2000);
        });
    });
});