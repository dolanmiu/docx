/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/chai/chai.d.ts" />
/// <reference path="../../typings/archiver/archiver.d.ts" />
/// <reference path="../../typings/xml/xml.d.ts" />

import {LocalPacker} from "../../export/packer/local";
import {assert} from "chai";
import {Document} from "../../docx/document";
import {Properties} from "../../properties";
import {DefaultStyle} from "../../styles/sample";
import {Paragraph} from "../../docx/paragraph";
import {DefaultStylesFactory} from "../../styles/factory";

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
            creator: "Shan Fu",
            revision: "1",
            lastModifiedBy: "Shan Fu"
        });
        stylesFactory = new DefaultStylesFactory();
        packer = new LocalPacker(document, stylesFactory.newInstance(), properties, "build/tests/test.docx");
        // packer = new LocalPacker(document, DefaultStyle(), properties, "build/tests/test.docx");
    });

    describe("#pack()", () => {
        it("should create a standard docx file", function (done) {
            this.timeout(99999999);
            packer.pack();
            setTimeout(done, 1900);
        });
    });
});