import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createRunFonts } from "./run-fonts";

describe("createRunFonts", () => {
    it("uses the font name for both ascii and hAnsi", () => {
        const tree = new Formatter().format(createRunFonts("Times"));
        expect(tree).to.deep.equal({
            "w:rFonts": { _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times" } },
        });
    });

    it("uses hint if given", () => {
        const tree = new Formatter().format(createRunFonts("Times", "default"));
        expect(tree).to.deep.equal({
            "w:rFonts": {
                _attr: { "w:ascii": "Times", "w:cs": "Times", "w:eastAsia": "Times", "w:hAnsi": "Times", "w:hint": "default" },
            },
        });
    });

    it("uses the font attrs for ascii and eastAsia", () => {
        const tree = new Formatter().format(createRunFonts({ ascii: "Times", eastAsia: "KaiTi" }));
        expect(tree).to.deep.equal({
            "w:rFonts": { _attr: { "w:ascii": "Times", "w:eastAsia": "KaiTi" } },
        });
    });

    it("uses the theme's fonts for headings or body text in every character set, as Word does", () => {
        expect(new Formatter().format(createRunFonts({ theme: "headings" }))).to.deep.equal({
            "w:rFonts": {
                _attr: {
                    "w:asciiTheme": "majorHAnsi",
                    "w:eastAsiaTheme": "majorEastAsia",
                    "w:hAnsiTheme": "majorHAnsi",
                    "w:cstheme": "majorBidi",
                },
            },
        });
        expect(new Formatter().format(createRunFonts({ theme: "body" }))).to.deep.equal({
            "w:rFonts": {
                _attr: {
                    "w:asciiTheme": "minorHAnsi",
                    "w:eastAsiaTheme": "minorEastAsia",
                    "w:hAnsiTheme": "minorHAnsi",
                    "w:cstheme": "minorBidi",
                },
            },
        });
    });
});
