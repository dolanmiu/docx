import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { NumberFormat } from "@file/shared/number-format";

import { EndnotePosition, FootnotePosition, NoteNumberRestart, createEndnoteProperties, createFootnoteProperties } from "./note-properties";

describe("createFootnoteProperties", () => {
    it("should write each footnote position", () => {
        for (const position of Object.values(FootnotePosition)) {
            const tree = new Formatter().format(createFootnoteProperties({ position }));

            expect(tree).to.deep.equal({ "w:footnotePr": [{ "w:pos": { _attr: { "w:val": position } } }] });
        }
    });

    it("should write the number format", () => {
        const tree = new Formatter().format(createFootnoteProperties({ numberFormat: { type: NumberFormat.UPPER_ROMAN } }));

        expect(tree).to.deep.equal({ "w:footnotePr": [{ "w:numFmt": { _attr: { "w:val": "upperRoman" } } }] });
    });

    it("should write a custom number format pattern", () => {
        const tree = new Formatter().format(createFootnoteProperties({ numberFormat: { type: NumberFormat.CUSTOM, format: "001" } }));

        expect(tree).to.deep.equal({ "w:footnotePr": [{ "w:numFmt": { _attr: { "w:val": "custom", "w:format": "001" } } }] });
    });

    it("should write the start number", () => {
        const tree = new Formatter().format(createFootnoteProperties({ start: 5 }));

        expect(tree).to.deep.equal({ "w:footnotePr": [{ "w:numStart": { _attr: { "w:val": 5 } } }] });
    });

    it("should write each restart value", () => {
        for (const restart of Object.values(NoteNumberRestart)) {
            const tree = new Formatter().format(createFootnoteProperties({ restart }));

            expect(tree).to.deep.equal({ "w:footnotePr": [{ "w:numRestart": { _attr: { "w:val": restart } } }] });
        }
    });

    it("should write the children in schema order", () => {
        const tree = new Formatter().format(
            createFootnoteProperties({
                restart: NoteNumberRestart.EACH_PAGE,
                start: 2,
                numberFormat: { type: NumberFormat.DECIMAL },
                position: FootnotePosition.BENEATH_TEXT,
            }),
        );

        expect((tree["w:footnotePr"] as readonly Record<string, unknown>[]).map((child) => Object.keys(child)[0])).to.deep.equal([
            "w:pos",
            "w:numFmt",
            "w:numStart",
            "w:numRestart",
        ]);
    });
});

describe("createEndnoteProperties", () => {
    it("should write the position, number format, start and restart in schema order", () => {
        const tree = new Formatter().format(
            createEndnoteProperties({
                restart: NoteNumberRestart.EACH_SECTION,
                start: 3,
                numberFormat: { type: NumberFormat.LOWER_LETTER },
                position: EndnotePosition.DOCUMENT_END,
            }),
        );

        expect(tree).to.deep.equal({
            "w:endnotePr": [
                { "w:pos": { _attr: { "w:val": "docEnd" } } },
                { "w:numFmt": { _attr: { "w:val": "lowerLetter" } } },
                { "w:numStart": { _attr: { "w:val": 3 } } },
                { "w:numRestart": { _attr: { "w:val": "eachSect" } } },
            ],
        });
    });

    it("should write a custom number format pattern", () => {
        const tree = new Formatter().format(createEndnoteProperties({ numberFormat: { type: NumberFormat.CUSTOM, format: "001" } }));

        expect(tree).to.deep.equal({ "w:endnotePr": [{ "w:numFmt": { _attr: { "w:val": "custom", "w:format": "001" } } }] });
    });
});
