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

describe("Packer", () => {
    var packer: LocalPacker;

    beforeEach(() => {
        var document = new Document();
        var paragraph = new Paragraph("test text");
        document.addParagraph(paragraph);
        var properties = new Properties({
            creator: "Shan Fu",
            revision: "1",
            lastModifiedBy: "Shan Fu"
        });
        packer = new LocalPacker(document, DefaultStyle(), properties, "build/tests/test.docx");
    });

    describe('#pack()', () => {
        
        it("should create a standard docx file", (done) => {            
            packer.pack();
            setTimeout(done, 1900);
        });
    });
});