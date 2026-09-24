import { describe, expect, it } from "vitest";

import { measureLineHeight, measureText, measureTextWidth } from "./text-width";

describe("measureTextWidth", () => {
    it("should measure text in Times New Roman at 10pt when no font or size is given", () => {
        // "Yes": Y is 722, e is 444 and s is 389 thousandths of an em
        expect(measureTextWidth("Yes")).to.be.closeTo(15.55, 0.001);
    });

    it("should scale with the font size and use the font's own widths", () => {
        expect(measureTextWidth("Yes", { size: 20 })).to.be.closeTo(31.1, 0.001);
        // Calibri's "a" is 479 thousandths of an em
        expect(measureTextWidth("a", { font: "Calibri", size: 10 })).to.be.closeTo(4.79, 0.001);
        expect(measureTextWidth("a", { font: "calibri", size: 10 })).to.be.closeTo(4.79, 0.001);
    });

    it("should use bold widths for bold text", () => {
        expect(measureTextWidth("Yes", { font: "Arial", bold: true })).to.be.greaterThan(measureTextWidth("Yes", { font: "Arial" }));
    });

    it("should measure fonts that aren't in the table with the most similar one", () => {
        const width = (font: string): number => measureTextWidth("Hello", { font });
        expect(width("Carlito")).to.equal(width("Calibri"));
        expect(width("Segoe UI")).to.equal(width("Calibri"));
        expect(width("Caladea")).to.equal(width("Cambria"));
        expect(width("Consolas")).to.equal(width("Courier New"));
        expect(width("Georgia")).to.equal(width("Times New Roman"));
        expect(width("Noto Serif")).to.equal(width("Times New Roman"));
        expect(width("Noto Sans Serif")).to.equal(width("Arial"));
        expect(width("Aptos")).to.equal(width("Arial"));
        expect(width("Helvetica")).to.equal(width("Arial"));
    });

    it("should make wide characters an em wide, accents take no space, and others as wide as an average letter", () => {
        expect(measureTextWidth("中文", { size: 10 })).to.equal(20);
        // Hangul, compatibility ideographs, vertical forms, full-width forms and signs, and emoji
        for (const character of ["\u1100", "\uac00", "\uf900", "\ufe30", "\uff01", "\uffe0", "\u{1f600}"]) {
            expect(measureTextWidth(character, { size: 10 })).to.equal(10);
        }
        expect(measureTextWidth("́", { size: 10 })).to.equal(0);
        const average = measureTextWidth("abcdefghijklmnopqrstuvwxyz") / 26;
        expect(measureTextWidth("Ж")).to.be.closeTo(average, 0.001);
    });

    it("should move tabs to the next half inch from where the text starts", () => {
        expect(measureTextWidth("\t")).to.equal(36);
        expect(measureTextWidth("\t", {}, 10)).to.equal(26);
        expect(measureTextWidth("a\tb", { font: "Courier New" })).to.be.closeTo(36 + 6.001, 0.01);
    });
});

describe("measureLineHeight", () => {
    it("should be the font's line height at its size", () => {
        expect(measureLineHeight()).to.be.closeTo(11.5, 0.01);
        expect(measureLineHeight({ font: "Calibri", size: 11 })).to.be.closeTo(13.43, 0.01);
    });
});

describe("measureText", () => {
    const line = measureLineHeight();

    it("should measure each paragraph and line break as a line", () => {
        const size = measureText([[{ text: "Hello " }, { text: "wor", bold: true }, { text: "ld\nnext" }], []]);
        expect(size.width).to.be.closeTo(
            measureTextWidth("Hello ") + measureTextWidth("wor", { bold: true }) + measureTextWidth("ld"),
            0.001,
        );
        expect(size.height).to.be.closeTo(3 * line, 0.001);
    });

    it("should make a line as tall as its tallest font", () => {
        expect(measureText([[{ text: "a" }, { text: "b", size: 20 }]]).height).to.be.closeTo(2 * line, 0.001);
    });

    it("should measure nothing for no paragraphs", () => {
        expect(measureText([])).to.deep.equal({ width: 0, height: 0 });
    });

    it("should wrap words at the width, leaving out spaces at the ends of lines", () => {
        const word = measureTextWidth("word");
        const size = measureText([[{ text: "word word word" }]], word * 2);
        expect(size.width).to.be.closeTo(word, 0.001);
        expect(size.height).to.be.closeTo(3 * line, 0.001);

        const fits = measureText([[{ text: "word  word" }]], 1000);
        expect(fits.height).to.be.closeTo(line, 0.001);
    });

    it("should break a word wider than a line across lines", () => {
        const width = measureTextWidth("abcdefghij");
        const size = measureText([[{ text: "abcdefghij" }]], width / 3);
        expect(size.height).to.be.closeTo(3 * line, 0.001);
        expect(size.width).to.be.closeTo(width / 3, 0.001);

        // After a word that fits, a long word starts on a line of its own
        expect(measureText([[{ text: "a abcdefghij" }]], width / 3).height).to.be.closeTo(4 * line, 0.001);
    });

    it("should put each word on a line of its own at a width of 0, without breaking the words", () => {
        expect(measureText([[{ text: "ab cd" }]], 0).height).to.be.closeTo(2 * line, 0.001);
    });
});
