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

describe("measureText with paragraph formatting", () => {
    const line = measureLineHeight();
    const word = measureTextWidth("word");
    const space = measureTextWidth(" ");

    it("should add space before and after each paragraph", () => {
        const size = measureText([
            { spans: [{ text: "a" }], format: { spaceBefore: 6, spaceAfter: 8 } },
            { spans: [{ text: "b" }], format: { spaceAfter: 8 } },
        ]);
        expect(size.height).to.be.closeTo(6 + line + 8 + line + 8, 0.001);
    });

    it("should leave out contextual spacing next to a paragraph of the same style", () => {
        const item = { spans: [{ text: "a" }], style: "List", format: { spaceBefore: 6, spaceAfter: 8, contextualSpacing: true } };
        expect(measureText([item, item]).height).to.be.closeTo(6 + 2 * line + 8, 0.001);
        // Next to another style, the spacing stays
        expect(measureText([item, { ...item, style: "Other" }]).height).to.be.closeTo(2 * (6 + line + 8), 0.001);
    });

    it("should space lines by a multiple, exactly, or at least a height", () => {
        const spans = [{ text: "a\nb" }];
        expect(measureText([{ spans, format: { lineSpacing: { rule: "multiple", multiple: 1.5 } } }]).height).to.be.closeTo(
            3 * line,
            0.001,
        );
        expect(measureText([{ spans, format: { lineSpacing: { rule: "exact", height: 5 } } }]).height).to.equal(10);
        expect(measureText([{ spans, format: { lineSpacing: { rule: "atLeast", height: 5 } } }]).height).to.be.closeTo(2 * line, 0.001);
        expect(measureText([{ spans, format: { lineSpacing: { rule: "atLeast", height: 20 } } }]).height).to.equal(40);
    });

    it("should make an empty paragraph as tall as its mark's font", () => {
        expect(measureText([{ spans: [], font: { size: 20 } }]).height).to.be.closeTo(2 * line, 0.001);
    });

    it("should indent lines, and wrap them at the right indent", () => {
        const format = { indentLeft: 10, indentRight: 5 };
        const unwrapped = measureText([{ spans: [{ text: "word word" }], format }]);
        expect(unwrapped.width).to.be.closeTo(10 + 2 * word + space + 5, 0.001);

        // Two words fit in 2 words and a space, but not once the indents are taken off
        const wrapped = measureText([{ spans: [{ text: "word word" }], format }], 2 * word + space + 1);
        expect(wrapped.height).to.be.closeTo(2 * line, 0.001);
        expect(wrapped.width).to.be.closeTo(10 + word + 5, 0.001);
    });

    it("should indent the first line further, or less for a hanging indent", () => {
        const first = measureText([{ spans: [{ text: "word\nword" }], format: { indentLeft: 10, firstLineIndent: 20 } }]);
        expect(first.width).to.be.closeTo(30 + word, 0.001);
        const hanging = measureText([{ spans: [{ text: "word\nword" }], format: { indentLeft: 10, firstLineIndent: -10 } }]);
        expect(hanging.width).to.be.closeTo(10 + word, 0.001);

        // The first line has room for one word less
        expect(
            measureText([{ spans: [{ text: "word word" }], format: { firstLineIndent: word + space } }], 2 * word + space + 1).height,
        ).to.be.closeTo(2 * line, 0.001);
    });

    it("should break a long word onto indented lines", () => {
        const long = measureTextWidth("abcdefghij");
        const size = measureText([{ spans: [{ text: "abcdefghij" }], format: { indentLeft: 10 } }], 10 + long / 2);
        expect(size.height).to.be.closeTo(2 * line, 0.001);
        expect(size.width).to.be.closeTo(10 + long / 2, 0.001);
    });

    it("should not break words when an indent leaves no room", () => {
        expect(measureText([{ spans: [{ text: "ab cd" }], format: { indentLeft: 50 } }], 40).height).to.be.closeTo(2 * line, 0.001);
    });
});

describe("measureTextWidth with character spacing and scale", () => {
    it("should add the spacing after each character, and scale the characters", () => {
        expect(measureTextWidth("ab", { characterSpacing: 2 })).to.be.closeTo(measureTextWidth("ab") + 4, 0.001);
        expect(measureTextWidth("ab", { scale: 50 })).to.be.closeTo(measureTextWidth("ab") / 2, 0.001);
    });
});
