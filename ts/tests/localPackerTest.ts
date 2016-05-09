/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
/// <reference path="../typings/archiver/archiver.d.ts" />
/// <reference path="../typings/xml/xml.d.ts" />

import {LocalPacker} from "../export/packer/local";
import {assert} from "chai";
import {Document} from "../docx/document"
import {Properties} from "../properties"
import {DefaultStyle} from "../styles/sample"
import {Paragraph} from "../docx/paragraph"
import {DefaultStylesFactory} from "../styles/factory"

describe("Packer", () => {
    var packer: LocalPacker;
    var stylesFactory: DefaultStylesFactory;

    beforeEach(() => {
        var document = new Document();
        var paragraph = new Paragraph("test text");
        var heading = new Paragraph("Hello world").heading1();
        document.addParagraph(heading);
        document.addParagraph(paragraph);
        var properties = new Properties({
            creator: "Shan Fu",
            revision: "1",
            lastModifiedBy: "Shan Fu"
        });
        stylesFactory = new DefaultStylesFactory();
        packer = new LocalPacker(document, stylesFactory.newInstance(), properties, "build/tests/test.docx");
        //packer = new LocalPacker(document, DefaultStyle(), properties, "build/tests/test.docx");
    });

    describe('#pack()', () => {

        it("should create a standard docx file", (done) => {
            packer.pack();
            setTimeout(done, 1900);
        });
    });
});