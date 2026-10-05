// cspell:ignore Caladea Aptos Carlito Yvonne Ωmega hhea AVANT GPOS Façade
import { describe, expect, it } from "vitest";

import {
    isGridCharacter,
    isMonospacedEastAsianFont,
    measureDescent,
    measureLineHeight,
    measureText,
    measureTextWidth,
    measureTextWidthAsDrawn,
    unknownCharacter,
    unknownFont,
    unknownShaping,
} from "./text-width";

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
        expect(measureTextWidth(alphabet, { font: "Garamond", italic: true })).to.equal(
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
        expect(width("Fira Mono")).to.equal(width("Courier New"));
        expect(width("Garamond")).to.equal(width("Times New Roman"));
        expect(width("Noto Serif")).to.equal(width("Times New Roman"));
        expect(width("Noto Sans Serif")).to.equal(width("Arial"));
        expect(width("Roboto")).to.equal(width("Arial"));
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

describe("unknownFont", () => {
    // The pangram of word-watertight-text.docx's TX18, in each font at 11 points
    const PANGRAM = "Thequickbrownfoxjumpsoverthelazydog";

    it("should find the fonts the tables don't have, which Word draws in themselves, or in Cambria when it doesn't have them", () => {
        // In TX18, Word drew the pangram in Cambria, 3820.8 twips wide, for the two fonts it didn't have, and Segoe UI
        // 3616.5 and Garamond 3457.5 in themselves, where the tables measure them as Calibri (3589.3) and Times New Roman
        // (3580.5)
        expect(twips(PANGRAM, "Segoe UI", 11)).to.be.closeTo(3589.3, 0.1);
        expect(twips(PANGRAM, "Garamond", 11)).to.be.closeTo(3580.5, 0.1);
        for (const font of ["Watertight Missing Sans", "Watertight Missing Serif", "Segoe UI", "Garamond", "Roboto"]) {
            expect(unknownFont({ font }), font).to.equal(true);
            expect(unknownFont({ font }, "a"), font).to.equal(true);
        }
    });

    it("should measure Office's fonts that Word installs with Word's widths (word-watertight-text.docx TX18)", () => {
        // Word drew the pangram 3781.2 twips wide in Aptos, 3905.6 in Georgia, 4384.2 in Verdana, 3839.4 in Tahoma and
        // 3540.2 in Calibri Light, to within the 3 twips or so Word's PDFs put text to
        const drawn = [
            ["Aptos", 3781.2],
            ["Georgia", 3905.6],
            ["Verdana", 4384.2],
            ["Tahoma", 3839.4],
            ["Calibri Light", 3540.2],
        ] as const;
        for (const [font, width] of drawn) {
            expect(twips(PANGRAM, font, 11), font).to.be.closeTo(width, 1.6);
            expect(unknownFont({ font }), font).to.equal(false);
            expect(unknownFont({ font, italic: true }, "a"), font).to.equal(false);
        }
    });

    it("should know the fonts of the tables, and those made with the same widths, which are measured as them", () => {
        const sameWidths = [
            ["Carlito", "Calibri"],
            ["Caladea", "Cambria"],
            ["Liberation Sans", "Arial"],
            ["Arimo", "Arial"],
            ["Helvetica", "Arial"],
            ["Liberation Serif", "Times New Roman"],
            ["Tinos", "Times New Roman"],
            ["Liberation Mono", "Courier New"],
            ["Cousine", "Courier New"],
        ];
        for (const [font, same] of sameWidths) {
            expect(unknownFont({ font }, "a"), font).to.equal(false);
            expect(unknownFont({ font: same }), same).to.equal(false);
            expect(twips(PANGRAM, font, 11)).to.equal(twips(PANGRAM, same, 11));
            expect(measureLineHeight({ font, size: 11 })).to.equal(measureLineHeight({ font: same, size: 11 }));
        }
        expect(unknownFont()).to.equal(false);
        expect(unknownFont({ font: "times new roman" })).to.equal(false);
        // Word drew TX18's pangram in Helvetica 3867.0 twips wide, within 0.1% of Arial's
        expect(twips(PANGRAM, "Helvetica", 11)).to.be.closeTo(3867.0, 3.9);
    });

    // cspell:disable
    it("should know the East Asian fonts of the table, but for the Latin text of those that aren't monospaced", () => {
        expect(unknownFont({ font: "MS Mincho" }, "ab永")).to.equal(false);
        expect(unknownFont({ font: "Yu Gothic" })).to.equal(false);
        // Ideographs and the symbols of Japanese and Chinese an em wide, half-width katakana and marks, but not Latin letters
        expect(unknownFont({ font: "Yu Gothic" }, "永、\u0301ｱ")).to.equal(false);
        expect(unknownFont({ font: "游ゴシック" }, "永a")).to.equal(true);
        // An East Asian font the table doesn't have, which is measured as MS Mincho or MS Gothic
        expect(unknownFont({ font: "Hiragino Mincho ProN" })).to.equal(true);
    });
    // cspell:enable
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

describe("measureDescent", () => {
    it("should be the font's descent for Windows at its size, which Word's lines go below the baseline", () => {
        // 550 of Calibri's 2048 units: a 30-point picture beside Calibri 11 is a line of 659.08 twips in Word
        // (scripts/layout-probes/word-watertight-text.ts TX8b)
        expect(measureDescent({ font: "Calibri", size: 11 })).to.be.closeTo((550 / 2048) * 11, 1e-9);
        // Times New Roman 10 without a font or size: 643.26 beside the picture (TX8g)
        expect(measureDescent()).to.be.closeTo((443 / 2048) * 10, 1e-9);
        expect(measureDescent({ font: "Courier New", size: 11 })).to.be.closeTo((615 / 2048) * 11, 1e-9);
        expect(measureDescent({ font: "Cambria", size: 10 })).to.be.closeTo(2.22, 1e-9);
        // A font not in the tables has the descent of the one most like it
        expect(measureDescent({ font: "Liberation Mono", size: 11 })).to.equal(measureDescent({ font: "Courier New", size: 11 }));
    });

    it("should give East Asian fonts the descent Word gives them, about half the extra of their lines", () => {
        // 289 thousandths of an em, from a picture beside MS Mincho 12 (scripts/layout-probes/word-mixed-heights.ts MH5)
        expect(measureDescent({ font: "MS Mincho", size: 12 })).to.be.closeTo(3.468, 1e-9);
        expect(measureDescent({ font: "Meiryo", size: 10 })).to.be.closeTo(6.65, 1e-9);
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
        expect(measureLineHeight({ font: "Franklin Gothic Medium", size: 10 })).to.equal(measureLineHeight({ font: "Arial", size: 10 }));
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

describe("isMonospacedEastAsianFont", () => {
    it("should say which East Asian fonts have all their characters an em or half an em wide, by any of their names", () => {
        expect(["MS Mincho", "ＭＳ 明朝", "SimSun", "ms gothic"].map(isMonospacedEastAsianFont)).to.deep.equal([true, true, true, true]);
        expect(["Yu Mincho", "MS PMincho", "Calibri"].map(isMonospacedEastAsianFont)).to.deep.equal([false, false, false]);
        // Times New Roman, Word's font when none is given, isn't one
        expect(isMonospacedEastAsianFont(undefined)).to.equal(false);
    });
});

describe("isGridCharacter", () => {
    it("should say which characters a grid that snaps to characters puts in cells of their own", () => {
        expect([..."永あア한，ｱ"].map(isGridCharacter)).to.deep.equal([true, true, true, true, true, true]);
        expect([..."a1 .é"].map(isGridCharacter)).to.deep.equal([false, false, false, false, false]);
    });
});

describe("kerning and ligatures", () => {
    const calibri = (font: object = {}): object => ({ font: "Calibri", size: 11, ...font });

    it("should measure text kerned and joined only as drawn, as shapes' text isn't kerned", () => {
        expect(measureTextWidth("To", { font: "Calibri", size: 12, kerning: 1 })).to.equal(
            measureTextWidth("To", { font: "Calibri", size: 12 }),
        );
        expect(measureTextWidthAsDrawn("To", { font: "Calibri", size: 12 })).to.equal(
            measureTextWidth("To", { font: "Calibri", size: 12 }),
        );
    });

    it("should kern text as Word kerns the fonts of the tables, from the size kerning starts at", () => {
        // word-fonts.docx F5b: ten "To"s in Calibri 12 kerned are 111.09 points in Word's PDF, and 121.68 not kerned
        const pairs = "ToToToToToToToToToTo";
        expect(measureTextWidthAsDrawn(pairs, { font: "Calibri", size: 12, kerning: 1 })).to.be.closeTo(111, 0.01);
        expect(measureTextWidthAsDrawn(pairs, { font: "Calibri", size: 12 })).to.be.closeTo(121.68, 0.01);
        expect(measureTextWidthAsDrawn(pairs, { font: "Calibri", size: 12, kerning: 14 })).to.be.closeTo(121.68, 0.01);
        // word-kerning.docx K: Arial kerns an A with the space after it, 55 thousandths of an em nearer
        expect(measureTextWidthAsDrawn("A ", { font: "Arial", size: 10, kerning: 1 })).to.be.closeTo(
            measureTextWidthAsDrawn("A ", { font: "Arial", size: 10 }) - 0.55,
            0.001,
        );
        // And a tab still moves to the next half inch
        expect(measureTextWidthAsDrawn("To\tTo", { font: "Calibri", size: 12, kerning: 1 })).to.be.closeTo(36 + 11.1, 0.01);
    });

    it("should join letters with ligatures as Word joins Calibri's, with standard and contextual ligatures as with all", () => {
        // word-watertight-text.docx TX14, in twips: six of each word, joined by Word into 3557.8, 4182.5, 2109.7, 4247.6 and
        // 2548.7, from 3602.2, 4227.8, 2148.7, 4304.8 and 2569.8
        const joined = ["official", "affluent", "fifty", "attitude", "fjord"].map((word) =>
            Math.round(measureTextWidthAsDrawn(word.repeat(6), calibri({ ligatures: "standardContextual" })) * 20),
        );
        expect(joined).to.deep.equal([3557, 4184, 2109, 4248, 2548]);
        expect(measureTextWidthAsDrawn("official", calibri({ ligatures: "all" }))).to.equal(
            measureTextWidthAsDrawn("official", calibri({ ligatures: "standard" })),
        );
        expect(measureTextWidthAsDrawn("official", calibri({ ligatures: "none" }))).to.equal(
            measureTextWidthAsDrawn("official", calibri()),
        );
        // Times New Roman joins its letters only with discretional ligatures (word-kerning.docx L)
        const times = { font: "Times New Roman", size: 10 };
        expect(measureTextWidthAsDrawn("fi", { ...times, ligatures: "standardContextual" })).to.equal(measureTextWidthAsDrawn("fi", times));
        expect(measureTextWidthAsDrawn("fi", { ...times, ligatures: "all" })).to.be.closeTo(
            measureTextWidthAsDrawn("fi", times) - 0.55,
            0.01,
        );
        // Nor with space between the characters (word-kerning.docx SP1 and SP2)
        expect(measureTextWidthAsDrawn("official", calibri({ ligatures: "all", characterSpacing: 1 }))).to.equal(
            measureTextWidthAsDrawn("official", calibri({ characterSpacing: 1 })),
        );
    });

    it("should kern the glyphs ligatures put in place of letters as Word does", () => {
        // ff before a comma is kerned 62 thousandths of an em nearer in Calibri (word-kerning.docx LK)
        const comma =
            measureTextWidthAsDrawn("ff,", calibri({ ligatures: "standard", kerning: 1 })) -
            measureTextWidthAsDrawn("ff,", calibri({ ligatures: "standard" }));
        expect(comma).to.be.closeTo(-0.68, 0.02);
    });

    it("should say where Word's kerning or ligatures aren't known, so a layout stops there", () => {
        expect(unknownShaping("To", calibri({ kerning: 1 }))).to.equal(undefined);
        expect(unknownShaping("office", calibri({ ligatures: "standard" }))).to.equal(undefined);
        // Text with no font is in Times New Roman, which Word kerns
        expect(unknownShaping("To", { kerning: 1 })).to.equal(undefined);
        expect(measureTextWidthAsDrawn("AV", { kerning: 1 })).to.be.lessThan(measureTextWidthAsDrawn("AV"));
        expect(unknownShaping("To", calibri())).to.equal(undefined);
        expect(unknownShaping("office", calibri({ ligatures: "standardContextual", kerning: 1 }))).to.equal(undefined);
        // A font made as wide as Calibri kerns and joins its own letters, and an East Asian font that isn't monospaced
        expect(unknownShaping("To", { font: "Carlito", kerning: 1 })).to.equal("kerned text in a font whose kerning isn't known");
        expect(unknownShaping("To", { font: "Yu Gothic", kerning: 1 })).to.equal("kerned text in a font whose kerning isn't known");
        expect(unknownShaping("office", { font: "Carlito", ligatures: "standard" })).to.equal(
            "ligatures in a font whose ligatures aren't known",
        );
        expect(unknownShaping("a", { font: "Carlito", ligatures: "standard" })).to.equal(undefined);
        // A monospaced East Asian font, and Courier New, kern nothing
        expect(unknownShaping("To", { font: "MS Mincho", kerning: 1 })).to.equal(undefined);
        expect(unknownShaping("Ωmega", { font: "Courier New", kerning: 1 })).to.equal(undefined);
        // Characters outside Windows-1252, and settings Word's Font dialog doesn't write, or Word didn't show for the face
        expect(unknownShaping("Ωmega", calibri({ kerning: 1 }))).to.equal("kerned text with a character whose kerning isn't known");
        expect(unknownShaping("office", calibri({ ligatures: "contextual" }))).to.equal("ligatures of a setting not yet followed");
        expect(unknownShaping("office", { font: "Cambria", ligatures: "standard" })).to.equal("ligatures of a setting not yet followed");
        expect(unknownShaping("1", { font: "Cambria", ligatures: "standard" })).to.equal(undefined);
        expect(unknownShaping("fΩ", calibri({ ligatures: "standard" }))).to.equal("ligatures beside a character not yet followed");
        // Characters that take no room, such as a zero-width space or a combining acute accent, which aren't kerned or
        // joined across
        const ZERO_WIDTH = String.fromCharCode(0x200b);
        const ACUTE = String.fromCharCode(0x301);
        expect(unknownShaping(`T${ZERO_WIDTH}o`, calibri({ kerning: 1 }))).to.equal(
            "kerned text with a character whose kerning isn't known",
        );
        expect(unknownShaping(`e${ACUTE}`, calibri({ kerning: 1 }))).to.equal("kerned text with a character whose kerning isn't known");
        expect(unknownShaping(`f${ZERO_WIDTH}i`, calibri({ ligatures: "standard" }))).to.equal(
            "ligatures beside a character not yet followed",
        );
        // Pairs Word's drawing doesn't settle: before a hyphen in Cambria, and beside Times New Roman's discretional ligatures
        expect(unknownShaping("T-", { font: "Cambria", bold: true, kerning: 1 })).to.equal(
            "kerning of a pair of characters not yet followed",
        );
        expect(unknownShaping("fi-", { font: "Times New Roman", ligatures: "all", kerning: 1 })).to.equal(
            "kerning beside a ligature not yet followed",
        );
        // Nothing is kerned or joined across a tab, as the parts either side of it are measured apart
        expect(unknownShaping("T\t-", { font: "Cambria", bold: true, kerning: 1 })).to.equal(undefined);
        expect(unknownShaping("a\tT-", { font: "Cambria", bold: true, kerning: 1 })).to.equal(
            "kerning of a pair of characters not yet followed",
        );
        expect(unknownShaping("f\t\u03a9", calibri({ ligatures: "standard" }))).to.equal(undefined);
    });
});

describe("Office's fonts that Word installs", () => {
    // Word's PDFs of scripts/layout-probes/stops2: word-stops-font-widths, word-stops-font-italic-widths,
    // word-stops-font-heights and word-stops-font-kerning, saved from Word 16 for Mac
    const OFFICE_FONTS = [
        "Calibri Light",
        "Aptos",
        "Aptos Narrow",
        "Trebuchet MS",
        "Georgia",
        "Verdana",
        "Tahoma",
        "Century Gothic",
        "Consolas",
        "Candara",
        "Corbel",
        "Constantia",
        "Book Antiqua",
        "Franklin Gothic Book",
        "Gill Sans MT",
        "Impact",
    ];

    it("should know each of them, plain, bold, italic and bold italic, but for the bold Word makes itself", () => {
        for (const font of OFFICE_FONTS) {
            expect(unknownFont({ font, size: 11 }, "a"), font).to.equal(false);
            expect(unknownFont({ font, italic: true }, "a"), font).to.equal(false);
        }
        // Calibri Light, Franklin Gothic Book and Impact have no bold face, which Word makes itself, each character 18
        // thousandths of an em wider at 10 points (W), which other sizes haven't shown
        for (const font of ["Calibri Light", "Franklin Gothic Book", "Impact"]) {
            expect(unknownFont({ font, bold: true }, "a"), font).to.equal(true);
            expect(unknownFont({ font, bold: true, italic: true }, "a"), font).to.equal(true);
            // Guessing, it is measured as the face Word makes it from
            expect(measureTextWidth("Bold", { font, bold: true, italic: true })).to.equal(measureTextWidth("Bold", { font, italic: true }));
        }
        expect(unknownFont({ font: "Trebuchet MS", bold: true, italic: true }, "a")).to.equal(false);
        expect(unknownFont({ font: "Tahoma", bold: true, italic: true }, "a")).to.equal(false);
    });

    it("should measure an italic Word slants from the upright face as wide as it, as Word draws it", () => {
        // Tahoma and Impact have no italic face, and Word draws Trebuchet MS bold italic as its bold, slanted
        for (const [font, bold] of [
            ["Tahoma", false],
            ["Tahoma", true],
            ["Impact", false],
            ["Trebuchet MS", true],
        ] as const) {
            expect(measureTextWidth("Slanted", { font, bold, italic: true })).to.equal(measureTextWidth("Slanted", { font, bold }));
        }
        // A font with an italic face has its own widths: Georgia's italic a is 573 thousandths of an em, the upright 504
        expect(measureTextWidth("a", { font: "Georgia", italic: true, size: 1000 })).to.equal(573);
        expect(measureTextWidth("a", { font: "Georgia", size: 1000 })).to.equal(504);
    });

    it("should measure the pangram as Word drew it in Aptos, Georgia, Verdana, Tahoma and Calibri Light (word-watertight-text.docx TX18)", () => {
        const pangram = "Thequickbrownfoxjumpsoverthelazydog";
        for (const [font, width] of [
            ["Aptos", 3781.2],
            ["Georgia", 3905.6],
            ["Verdana", 4384.2],
            ["Tahoma", 3839.4],
            ["Calibri Light", 3540.2],
        ] as const) {
            expect(twips(pangram, font, 11), font).to.be.closeTo(width, 1.6);
        }
    });

    it("should measure the spaces as Word works them out, and not know the characters a font doesn't have", () => {
        // S: Word works out the em and three-per-em spaces itself, where Calibri Light's and Tahoma's files have 1000 and
        // 333, and Tahoma's en space is as wide as its digits
        const width = (text: string, font: string): number => measureTextWidth(text, { font, size: 1000 });
        expect(width(" ", "Calibri Light")).to.equal(905);
        expect(width(" ", "Tahoma")).to.equal(909);
        expect(width(" ", "Tahoma")).to.equal(303);
        expect(width(" ", "Tahoma")).to.equal(546);
        // Word draws a character a font doesn't have in another font: Trebuchet MS's ∀ in Cambria Math, Gill Sans MT's
        // Cyrillic in Calibri, and Georgia's en space in Times New Roman
        expect(unknownCharacter("for ∀", { font: "Trebuchet MS" })).to.equal("∀");
        expect(unknownCharacter("Дом", { font: "Gill Sans MT" })).to.equal("Д");
        expect(unknownCharacter("a b", { font: "Georgia" })).to.equal(" ");
        expect(unknownCharacter("Дом", { font: "Verdana" })).to.equal(undefined);
    });

    it("should make their lines as tall as Word does, from each font's hhea table (word-stops-font-heights.docx FH1 to FH16)", () => {
        // In points at 11 points, over 30 lines of each: Corbel's and Book Antiqua's are shorter than their ascent and
        // descent for Windows make them, 13.43 and 13.67 points
        for (const [font, height] of [
            ["Calibri Light", 13.4234],
            ["Georgia", 12.4966],
            ["Corbel", 13.2828],
            ["Book Antiqua", 13.2579],
            ["Franklin Gothic Book", 12.4717],
            ["Impact", 13.4152],
        ] as const) {
            expect(measureLineHeight({ font, size: 11 }), font).to.be.closeTo(height, 0.01);
        }
        expect(measureDescent({ font: "Corbel", size: 2048 })).to.be.closeTo(525, 1e-9);
    });

    it("should kern and join letters as Word does with Normal's settings, and put each word where Word does", () => {
        // P: the first line of prose in each font, 10 points, kerned from 1 point with standard and contextual ligatures,
        // and where Word put its last word, in points from its start: to within the half point Word's PDF puts a word to
        // across lines of 1,100 to 1,400 points, where without kerning it is up to 36 points off
        const prose =
            "“To Wyatt’s office,” Avery wrote — fifty-five affluent officials flew to Tyrone’s fjord at 7:45; Yvonne’s staff offered “efficient” coffee, attitude & difficult afflictions (Vol. VII, p. 14). L’Atelier’s AVANT-GARDE “Façade” kept 98.6% of the WAVY yellow awnings; Tom’s P.T.A. took Ty, Wa and Yo to the “Fjord-Café” for 3½ hours. “To Wyatt’s";
        const lines = [
            ["Calibri Light", 341, 1275.98],
            ["Aptos", 315, 1222.14],
            ["Aptos Narrow", 315, 1124.96],
            ["Georgia", 329, 1392.33],
            ["Trebuchet MS", 315, 1353.84],
            ["Century Gothic", 315, 1397.16],
            ["Consolas", 224, 1187.58],
            ["Candara", 341, 1358.06],
            ["Corbel", 341, 1312.62],
            ["Constantia", 315, 1241.02],
            ["Book Antiqua", 329, 1416.2],
            ["Gill Sans MT", 315, 1216.13],
            ["Franklin Gothic Book", 315, 1215.73],
            ["Tahoma", 315, 1307.45],
            ["Impact", 315, 1149.44],
        ] as const;
        for (const [font, length, last] of lines) {
            const line = [...prose].slice(0, length).join("");
            const normal = { font, size: 10, kerning: 1, ligatures: "standardContextual" } as const;
            expect(unknownShaping(line, normal), font).to.equal(undefined);
            // Where the last word starts: the text before it, and its first character, less that character's width
            const at = line.lastIndexOf(" ") + 1;
            const start = measureTextWidthAsDrawn(line.slice(0, at + 1), normal) - measureTextWidthAsDrawn(line[at], normal);
            expect(start, font).to.be.closeTo(last, 0.45);
        }
    });

    it("should leave text with ligatures without kerning in a face whose kerning is only in its file's kern table, as Word does", () => {
        // K and P: Word kerns Trebuchet MS's To, 125 thousandths of an em nearer, without ligatures, and not with them
        const font = { font: "Trebuchet MS", size: 1000 };
        const plain = measureTextWidth("To", font);
        expect(measureTextWidthAsDrawn("To", { ...font, kerning: 1 })).to.equal(plain - 125);
        expect(measureTextWidthAsDrawn("To", { ...font, kerning: 1, ligatures: "standardContextual" })).to.equal(plain);
        // Word's PDFs showed only Normal's ligatures with it
        expect(unknownShaping("To", { ...font, kerning: 1, ligatures: "all" })).to.equal("ligatures of a setting not yet followed");
        expect(unknownShaping("To", { ...font, ligatures: "all" })).to.equal(undefined);
        // Calibri Light's kerning is in its GPOS table too, so Word kerns it with ligatures, as Calibri's
        const light = { font: "Calibri Light", size: 1000, kerning: 1 };
        expect(measureTextWidthAsDrawn("To", { ...light, ligatures: "standardContextual" })).to.equal(measureTextWidthAsDrawn("To", light));
        expect(measureTextWidthAsDrawn("To", light)).to.be.lessThan(measureTextWidth("To", light));
    });

    it("should kern an italic Word slants as the upright face, and not know the kerning of a bold Word makes", () => {
        const kerned = (font: string, bold: boolean, italic: boolean): number =>
            measureTextWidthAsDrawn("To", { font, bold, italic, size: 1000, kerning: 1 });
        expect(kerned("Tahoma", false, true)).to.equal(kerned("Tahoma", false, false));
        expect(kerned("Trebuchet MS", true, true)).to.equal(kerned("Trebuchet MS", true, false));
        expect(unknownShaping("To", { font: "Calibri Light", bold: true, kerning: 1 })).to.equal(
            "kerned text in a font whose kerning isn't known",
        );
    });
});
