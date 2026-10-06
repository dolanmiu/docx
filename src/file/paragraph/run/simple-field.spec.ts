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
