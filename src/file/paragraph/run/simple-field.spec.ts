import { describe, expect, it } from "vitest";

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

        it("writes fldLock when locked", () => {
            const tree = new Formatter().format(new SimpleField("DATE", "2024-01-01", { locked: true }));
            expect(tree).to.deep.equal({
                "w:fldSimple": [
                    { _attr: { "w:instr": "DATE", "w:fldLock": true } },
                    { "w:r": [{ "w:t": [{ _attr: { "xml:space": "preserve" } }, "2024-01-01"] }] },
                ],
            });
        });

        it("omits fldLock when locked is false or not set", () => {
            const unset = new Formatter().format(new SimpleField("DATE", undefined, {}));
            const unlocked = new Formatter().format(new SimpleField("DATE", undefined, { locked: false }));
            expect(unset).to.deep.equal({ "w:fldSimple": { _attr: { "w:instr": "DATE" } } });
            expect(unlocked).to.deep.equal({ "w:fldSimple": { _attr: { "w:instr": "DATE" } } });
        });

        it("writes an index entry as a complex field in a run, because Word moves the text around a w:fldSimple one", () => {
            const tree = new Formatter().format(new SimpleField('XE "test"'));
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, 'XE "test"'] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });

        it.each([
            ["a table of contents entry", 'TC "Apples" \\l 2'],
            ["a table of authorities entry", 'TA \\l "Smith v. Jones"'],
            ["a referenced document", 'RD "chapter-2.docx"'],
            ["private data", "PRIVATE data"],
            ["an index entry in lower case with spaces around it", ' xe "test" '],
        ])("writes %s as a complex field, as it has no result either", (_, instruction) => {
            const tree = new Formatter().format(new SimpleField(instruction));
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin" } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, instruction] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });

        it("doesn't write a cached value for a field with no result, and locks it on its beginning", () => {
            const tree = new Formatter().format(new SimpleField('XE "test"', "ignored", { locked: true }));
            expect(tree).to.deep.equal({
                "w:r": [
                    { "w:fldChar": { _attr: { "w:fldCharType": "begin", "w:fldLock": true } } },
                    { "w:instrText": [{ _attr: { "xml:space": "preserve" } }, 'XE "test"'] },
                    { "w:fldChar": { _attr: { "w:fldCharType": "end" } } },
                ],
            });
        });

        it.each(["TOC \\o", "TIME", "RDX", "SET bookmark text", "ADVANCE \\r 10"])(
            "keeps %s as a w:fldSimple, as only the fields with no result are misread",
            (instruction) => {
                const tree = new Formatter().format(new SimpleField(instruction));
                expect(tree).to.deep.equal({ "w:fldSimple": { _attr: { "w:instr": instruction } } });
            },
        );
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
