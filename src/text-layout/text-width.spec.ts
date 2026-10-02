// cspell:ignore Caladea
import { describe, expect, it } from "vitest";

import { measureLineHeight, measureText, measureTextWidth, unknownCharacter } from "./text-width";

/** How wide text is in twips, a twentieth of a point, which Word's PDFs are read in */
const twips = (text: string, font: string, size: number): number => measureTextWidth(text, { font, size }) * 20;

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

    it("should measure italic and bold italic text in the fonts' own italics, as Word draws them", () => {
        // Word's widths in twips of the alphabet twice, as one word, upright, italic, bold and bold italic, from its PDF of
        // word-watertight-text.ts (TX3). Times New Roman's italics are 2.8% narrower than its upright letters, Cambria's 3.7%,
        // and Arial's are as wide. Word's PDFs put text on a grid, so each is good to about 3 twips
        const alphabet = "abcdefghijklmnopqrstuvwxyz".repeat(2);
        const lines: readonly (readonly [string, number, readonly [number, number, number, number]])[] = [
            ["Times New Roman", 10, [4778.2, 4643.9, 5090.0, 4801.1]],
            ["Calibri", 11, [5215.1, 5185.3, 5365.4, 5352.2]],
            ["Cambria", 11, [5582.4, 5373.8, 6021.3, 5834.2]],
            ["Arial", 11, [5600.2, 5600.2, 6160.1, 6160.1]],
        ];
        for (const [font, size, [upright, italic, bold, boldItalic]] of lines) {
            const width = (face: { readonly bold?: boolean; readonly italic?: boolean }): number =>
                measureTextWidth(alphabet, { font, size, ...face }) * 20;
            expect(width({})).to.be.closeTo(upright, 3);
            expect(width({ italic: true })).to.be.closeTo(italic, 3);
            expect(width({ bold: true })).to.be.closeTo(bold, 3);
            expect(width({ bold: true, italic: true })).to.be.closeTo(boldItalic, 3);
        }
        // Fonts that aren't in the tables are measured in the italics of the one most like them
        expect(measureTextWidth(alphabet, { font: "Georgia", italic: true })).to.equal(
            measureTextWidth(alphabet, { font: "Times New Roman", italic: true }),
        );
    });

    it("should measure italic characters with Word's widths where they aren't the open fonts', or the upright ones'", () => {
        // From Word's PDF of word-italic-widths, in thousandths of an em: Times New Roman's italic superscript 4 is 300, where
        // Liberation Serif's is 348; Calibri's italic т is drawn as an m, 791 where the upright one is 387; and Times New
        // Roman's italic em space is 889, where the upright one is 1000
        const width = (character: string, font: string, bold = false): number =>
            measureTextWidth(character, { font, bold, italic: true, size: 1000 });
        expect(width("\u2074", "Times New Roman")).to.equal(300);
        expect(width("\u0442", "Calibri")).to.equal(791);
        expect(measureTextWidth("\u0442", { font: "Calibri", size: 1000 })).to.equal(387);
        expect(width("\u2003", "Times New Roman")).to.equal(889);
        expect(width("\u2003", "Times New Roman", true)).to.equal(1000);
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
        expect(measureTextWidth("\u0301", { size: 10 })).to.equal(0);
        // Half-width katakana, Thai vowels above the letters, and zero-width spaces
        expect(measureTextWidth("\uff71", { size: 10 })).to.equal(5);
        expect(measureTextWidth("\u0e31\u200b", { size: 10 })).to.equal(0);
        const average = measureTextWidth("abcdefghijklmnopqrstuvwxyz") / 26;
        expect(measureTextWidth("א")).to.be.closeTo(average, 0.001);
        // As are characters the tables have, but whose widths in the font aren't known: Word draws ∀ in Calibri in Cambria Math
        expect(measureTextWidth("\u2200", { font: "Calibri" })).to.be.closeTo(
            measureTextWidth("abcdefghijklmnopqrstuvwxyz", { font: "Calibri" }) / 26,
            0.001,
        );
    });

    // cspell:disable
    it("should measure Latin Extended, Greek, Cyrillic, Vietnamese and symbols with the fonts' own widths, as Word draws them", () => {
        // Word's widths in twips, from its PDF of word-watertight-text.ts (TX17), in Calibri 11 and Times New Roman 10. Word's
        // PDFs put text on a grid, so each is good to about 2 twips
        const lines: readonly (readonly [string, number, number])[] = [
            ["ŁĄĆĘŃÓŚŹŻłąćęńóśźżČŠŽčšžŐŰőűĞŞİğşı", 3537.1, 3610.3],
            ["ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω", 5641.3, 5577.2],
            ["АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯабвгдежзийклмнопрстуфхцчшщэюя", 7303.7, 7250.5],
            ["ẠẢẤẦẨẪẬẮẰẲẴẶạảấầẩẫậắằẳẵặ", 2793.0, 2799.3],
            ["≤≥≠±−∞√∑∏∫≈‰†‡‚„‹›→←↑↓", 2871.0, 2566.1],
        ];
        for (const [text, calibri, timesNewRoman] of lines) {
            expect(twips(text, "Calibri", 11)).to.be.closeTo(calibri, 2);
            expect(twips(text, "Times New Roman", 10)).to.be.closeTo(timesNewRoman, 2);
        }
    });
    // cspell:enable

    it("should measure soft and no-break hyphens as hyphens, as Word draws them", () => {
        // TX10b: each U+00AD is 67.4 twips in Calibri 11, as a hyphen is. TX17: "state-of-the-art" is 1388.3 twips with
        // no-break hyphens and 1388.5 with hyphens
        expect(twips("\u00ad", "Calibri", 11)).to.be.closeTo(67.4, 0.1);
        expect(twips("state\u2011of\u2011the\u2011art", "Calibri", 11)).to.be.closeTo(1388.3, 2);
        expect(measureTextWidth("\u2011", { font: "Arial" })).to.equal(measureTextWidth("-", { font: "Arial" }));
    });

    it("should measure characters with Word's widths where they aren't the open fonts', or the open fonts don't have them", () => {
        // From Word's PDF of word-character-widths.ts, in thousandths of an em: Calibri's ƒ is 305, where Carlito's is 498;
        // Cambria's Ж is 923 and its left arrow 838, where Caladea has no Ж and an arrow of 800; Arial's superscript 4 is 333,
        // where Liberation Sans' is 430
        const width = (character: string, font: string, bold = false): number => measureTextWidth(character, { font, bold, size: 1000 });
        expect(width("\u0192", "Calibri")).to.equal(305);
        expect(width("\u0416", "Cambria")).to.equal(923);
        expect(width("\u2190", "Cambria")).to.equal(838);
        expect(width("\u2074", "Arial")).to.equal(333);
        expect(width("\u0403", "Arial", true)).to.equal(601);
    });

    it("should measure spaces as Word does, and marks and formatting characters as nothing", () => {
        // TX19: the en, em and thin spaces between words, in Calibri 11, are 109.6, 199.2 and 44.1 twips, where Carlito's en
        // and em spaces are 110 and 220
        expect(twips("\u2002", "Calibri", 11)).to.be.closeTo(109.6, 0.1);
        expect(twips("\u2003", "Calibri", 11)).to.be.closeTo(199.2, 0.1);
        expect(twips("\u2009", "Calibri", 11)).to.be.closeTo(44.1, 0.1);
        // word-character-widths S: Calibri's three-per-em space is 301 thousandths, where Carlito's is 335, and Arial's en
        // space 556, where Liberation Sans' is 500
        expect(measureTextWidth("\u2004", { font: "Calibri", size: 1000 })).to.equal(301);
        expect(measureTextWidth("\u2002", { font: "Arial", size: 1000 })).to.equal(556);
        for (const character of ["\u200b", "\u200d", "\u2060", "\u0483"]) {
            expect(measureTextWidth(character, { font: "Calibri" })).to.equal(0);
        }
    });

    it("should move tabs to the next half inch from where the text starts", () => {
        expect(measureTextWidth("\t")).to.equal(36);
        expect(measureTextWidth("\t", {}, 10)).to.equal(26);
        expect(measureTextWidth("a\tb", { font: "Courier New" })).to.be.closeTo(36 + 6.001, 0.01);
    });
});

describe("unknownCharacter", () => {
    it("should find a character the tables have, but which Word draws in another font, or whose width Word's PDF doesn't show", () => {
        // Word draws ∀ in Calibri and Arial in Cambria Math, and in Cambria in Cambria
        expect(unknownCharacter("\u2200x", { font: "Calibri" })).to.equal("\u2200");
        expect(unknownCharacter("\u2200x", { font: "Arial" })).to.equal("\u2200");
        expect(unknownCharacter("\u2200x", { font: "Cambria" })).to.equal(undefined);
        // Word drew Ž and Ё in Courier New on lines it squeezed, so their widths aren't known
        expect(unknownCharacter("\u017d", { font: "Courier New" })).to.equal("\u017d");
        expect(unknownCharacter("\u017d", { font: "Arial" })).to.equal(undefined);
        // Every space's width is known
        expect(unknownCharacter("a\u2000b\u2003c\u2009d\u200ae\u202ff\u205fg", { font: "Cambria", bold: true })).to.equal(undefined);
        expect(unknownCharacter("a\u2000b\u2003c\u2009d\u200ae\u202ff\u205fg", { font: "Cambria", italic: true })).to.equal(undefined);
        // Word's PDF of Cambria's italics doesn't show the widths of most of its arrows and mathematical symbols, which it
        // shows upright, as it drew them with no text
        expect(unknownCharacter("\u2197", { font: "Cambria" })).to.equal(undefined);
        expect(unknownCharacter("\u2197", { font: "Cambria", italic: true })).to.equal("\u2197");
    });

    it("should find a symbol font's own character, and leave the characters the tables don't have as they are measured", () => {
        expect(unknownCharacter("\uf0fc", { font: "Wingdings" })).to.equal("\uf0fc");
        // cspell:disable-next-line
        expect(unknownCharacter("\u05e9\u05dc\u05d5\u05dd \t\u4e2d\u6587", { font: "Arial" })).to.equal(undefined);
        expect(unknownCharacter("plain text")).to.equal(undefined);
    });
});

describe("measureLineHeight", () => {
    it("should be the font's line height at its size", () => {
        expect(measureLineHeight()).to.be.closeTo(11.5, 0.01);
        expect(measureLineHeight({ font: "Calibri", size: 11 })).to.be.closeTo(13.43, 0.01);
    });

    it("should not round the font's line height, as Word doesn't", () => {
        // Calibri's lines are 2500 of its 2048 units: 268.55 twips at 11 points in Word, measured over 50 lines
        expect(measureLineHeight({ font: "Calibri", size: 11 })).to.be.closeTo((2500 / 2048) * 11, 1e-9);
        expect(measureLineHeight({ font: "Times New Roman", size: 10 })).to.be.closeTo((2355 / 2048) * 10, 1e-9);
    });
});

describe("East Asian fonts", () => {
    // cspell:disable
    it("should make their lines as tall as Word does, about 1.3 times the font's height", () => {
        expect(measureLineHeight({ font: "MS Mincho", size: 12 })).to.be.closeTo(15.564, 0.0001);
        expect(measureLineHeight({ font: "ms gothic", size: 10 })).to.be.closeTo(12.97, 0.0001);
        // By the name Office's theme gives it
        expect(measureLineHeight({ font: "游明朝", size: 10 })).to.be.closeTo(14.33, 0.0001);
        expect(measureLineHeight({ font: "Malgun Gothic", size: 10 })).to.be.closeTo(17.3, 0.0001);
    });

    it("should measure East Asian fonts that aren't in the table as MS Mincho or MS Gothic, and not Latin fonts that look like them", () => {
        expect(measureLineHeight({ font: "Hiragino Mincho ProN", size: 10 })).to.be.closeTo(12.97, 0.0001);
        expect(measureTextWidth("ab", { font: "ヒラギノ角ゴシック", size: 10 })).to.equal(10);
        expect(measureLineHeight({ font: "Century Gothic", size: 10 })).to.equal(measureLineHeight({ font: "Arial", size: 10 }));
    });

    it("should make the Latin letters of monospaced ones half an em, and their ideographs and symbols an em", () => {
        expect(measureTextWidth("ab", { font: "MS Mincho", size: 12 })).to.equal(12);
        expect(measureTextWidth("‘永→", { font: "MS Mincho", size: 12 })).to.equal(36);
        expect(measureTextWidth("e\u0301", { font: "SimSun", size: 12 })).to.equal(6);
        // The Latin letters of the others are measured with the most similar font in the table
        expect(measureTextWidth("ab永", { font: "Yu Gothic", size: 12 })).to.equal(
            measureTextWidth("ab", { font: "Arial", size: 12 }) + 12,
        );
    });
    // cspell:enable
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
