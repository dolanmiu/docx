/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
/// <reference path="../typings/archiver/archiver.d.ts" />

import {LocalPacker} from "../export/packer/local";
import {assert} from "chai";
import {Document} from "../docx/document"

describe('Packer', () => {
    var packer: LocalPacker;

    beforeEach(() => {
        var document = new Document();
        packer = new LocalPacker(document, "build/tests/test.zip");
    });

    describe('#pack()', () => {
        
        it("should create a standard docx file", () => {
            packer.pack();
        });
    });
});