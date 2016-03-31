/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
import {LocalPacker} from "../export/packer/local";
import {assert} from "chai";

describe.only('Packer', () => {
    var packer: LocalPacker;

    beforeEach(() => {
        packer = new LocalPacker("test.zip");
    });

    describe('#pack()', () => {
        
        it("should create a standard docx file", () => {
            packer.pack();
        });
    });
});