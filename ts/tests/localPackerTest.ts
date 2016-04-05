/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
/// <reference path="../typings/archiver/archiver.d.ts" />
/// <reference path="../typings/xml/xml.d.ts" />

import {LocalPacker} from "../export/packer/local";
import {assert} from "chai";
import {Document} from "../docx/document"
import {Properties} from "../properties"

describe.only("Packer", () => {
    var packer: LocalPacker;

    beforeEach(() => {
        var document = new Document();
        var properties = new Properties({
            title: "test document"
        });
        packer = new LocalPacker(document, undefined, properties, "build/tests/test.zip");
    });

    describe('#pack()', () => {
        
        it("should create a standard docx file", () => {
            packer.pack();
        });
    });
});