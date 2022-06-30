import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { SimpleField, SimpleMailMergeField } from "./simple-field";

describe("SimpleField", () => {
    describe("#constructor()", () => {
        it("uses the instruction given", () => {
            const tree = new Formatter().format(new SimpleField("FILENAME"));
            expect(tree).to.deep.equal({ "w:fldSimple": { _attr: { "w:instr": "FILENAME" } } });
        });

        it("accepts a cached value", () => {
            const tree = new Formatter().format(new SimpleField("FILENAME", "ExampleDoc.docx"));
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    { _attr: { "w:instr": "FILENAME" } },
                    { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "ExampleDoc.docx"] }] },
                ],
            });
        });
    });
});

describe("SimpleMailMergeField", () => {
    describe("#constructor()", () => {
        it("creates a simple field", () => {
            const tree = new Formatter().format(new SimpleMailMergeField("Name"));
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    { _attr: { "w:instr": " MERGEFIELD Name " } },
                    { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "«Name»"] }] },
                ],
            });
        });
    });
});
