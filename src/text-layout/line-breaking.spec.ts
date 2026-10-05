import { describe, expect, it } from "vitest";

import {
    type ContentWidths,
    DEFAULT_MEASURER,
    type InlineItem,
    type LaidOutLine,
    type LineLayoutOptions,
    type TabStop,
    type TextMeasurer,
    layoutLines,
    measureContentWidths,
} from "./line-breaking";
import { type ParagraphFormat, type TextFont, measureDescent, measureLineHeight, measureTextWidth } from "./text-width";

// Every character is 10 points wide, and a line is as tall as its font's size, all of it above the baseline
const MEASURER: TextMeasurer = {
    measureWidth: (value) => [...value].length * 10,
    measureLineHeight: ({ size = 10 }) => size,
    measureDescent: () => 0,
};

const text = (value: string, size?: number): InlineItem => ({ type: "text", text: value, font: size === undefined ? {} : { size } });

/** The lines' heights */
const heightsOf = (items: readonly InlineItem[], width = 100, options = {}): readonly number[] =>
    layoutLines(items, { width, measurer: MEASURER, ...options }).map(({ height }) => height);

describe("layoutLines", () => {
    it("should wrap words that don't fit on the line, and let spaces at the end of a line go past it", () => {
        // "aaaa bbbb " is 100 points, and the space after bbbb doesn't count
        expect(heightsOf([text("aaaa bbbb cccc")])).to.deep.equal([10, 10]);
        expect(heightsOf([text("aaaa bbbb    ")])).to.deep.equal([10]);
        expect(heightsOf([text("aaaa bbbbb")])).to.deep.equal([10]);
        expect(heightsOf([text("aaaa bbbbbb")])).to.deep.equal([10, 10]);
    });

    it("should break lines after en, em, four-per-em and ideographic spaces, and let them go past the end of a line, as Word does", () => {
        // word-character-widths B and H: "aaaa" and the space after it are 100 points, and the space after bbbb doesn't count
        for (const space of ["\u2002", "\u2003", "\u2005", "\u3000"]) {
            expect(heightsOf([text(`aaaa${space}bbbb${space}cccc`)])).to.deep.equal([10, 10]);
            expect(heightsOf([text(`aaaa${space}bbbbb`)])).to.deep.equal([10]);
        }
        // Word joins the words around the other spaces, such as the thin and figure spaces: the narrowest a line can be is
        // both words
        const options = { measurer: MEASURER };
        expect(measureContentWidths([text("aaaa\u2002bbbb")], options).min).to.equal(40);
        for (const space of ["\u2000", "\u2001", "\u2004", "\u2006", "\u2007", "\u2008", "\u2009", "\u200a", "\u202f", "\u205f"]) {
            expect(measureContentWidths([text(`aaaa${space}bbbb`)], options).min).to.equal(90);
        }
    });

    it("should break 60 words joined by en spaces where Word breaks them", () => {
        // word-watertight-text TX19g, in Calibri 11 in a line of 9026 twips: Word's lines end with "of", "to", "was" and
        // "lighthouse". A bookmark before each word shows the line it starts
        const words = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(
            " ",
        );
        const prose = Array.from({ length: 60 }, (_, index) => words[(index * 7) % words.length]);
        const font = { font: "Calibri", size: 11 };
        const items: readonly InlineItem[] = [
            { type: "text", text: "TX19g ", font },
            ...prose.flatMap((word, index): readonly InlineItem[] => [
                { type: "marker", name: String(index) },
                { type: "text", text: index < prose.length - 1 ? `${word}\u2002` : word, font },
            ]),
        ];
        const lines = layoutLines(items, { width: 9026 / 20 });
        const ends = lines.map(({ markers }) => prose[Number(markers[markers.length - 1])]);
        expect(ends).to.deep.equal(["of", "to", "was", "lighthouse"]);
    });

    it("should make each line as tall as the tallest text on it, whatever the size of the paragraph's mark", () => {
        expect(heightsOf([text("aaaa "), text("bbbb", 20), text(" cccc")])).to.deep.equal([20, 10]);
        expect(heightsOf([text("aaaa bbbb cccc")], 100, { markFont: { size: 14 } })).to.deep.equal([10, 10]);
        expect(heightsOf([text("aaaa bbbb cccc", 8)], 100, { markFont: { size: 11 } })).to.deep.equal([8, 8]);
    });

    it("should give an empty paragraph, or one of only spaces, one line as tall as its mark, as Word does", () => {
        expect(heightsOf([], 100, { markFont: { size: 12 } })).to.deep.equal([12]);
        expect(heightsOf([text("   ", 16)], 100, { markFont: { size: 12 } })).to.deep.equal([12]);
        expect(heightsOf([text(" ", 8)], 100, { markFont: { size: 12 } })).to.deep.equal([12]);
        // Spaces before a break are as tall as the break's text
        expect(heightsOf([text("  ", 16), { type: "break", kind: "line", font: {} }, text("bb")])).to.deep.equal([10, 10]);
        // With text on the line, its spaces take no part in its height either (stops2/word-stops-thai.ts TH1a)
        expect(heightsOf([text("aa"), text(" ", 16), text("bb")])).to.deep.equal([10]);
    });

    it("should make a line as tall as the fonts Word draws its characters in, without its spaces (stops2/word-stops-thai.ts TH1)", () => {
        const heightOf = (value: string): number =>
            layoutLines([{ type: "text", text: value, font: { font: "Calibri", size: 11 } }], { width: 400 })[0].height;
        // Thai in Tahoma, 1207 thousandths of an em, where Calibri's lines are 1220.7, its spaces of Calibri and all
        expect(heightOf("\u0e01\u0e32 \u0e01\u0e32")).to.be.closeTo((1207 * 11) / 1000, 1e-9);
        expect(heightOf("\u0e01 a")).to.be.closeTo(220 / 20 + measureDescent({ font: "Calibri", size: 11 }), 1e-9);
        expect(heightOf("ab")).to.be.closeTo(measureLineHeight({ font: "Calibri", size: 11 }), 1e-9);
    });

    it("should measure the pieces of a word in the same font together when it is kerned, so they are kerned across runs as Word kerns them", () => {
        // cspell:ignore AVAVAVAV ofice
        // "AV" kerned is 15 points, rather than 20
        const kerning: TextMeasurer = {
            measureWidth: (value) => [...value].length * 10 - value.split("AV").length * 5 + 5,
            measureLineHeight: () => 10,
            measureDescent: () => 0,
        };
        const linesOf = (items: readonly InlineItem[]): number => layoutLines(items, { width: 90, measurer: kerning }).length;
        const kerned = { kerning: 1 };
        const piece = (value: string, font: TextFont = kerned): InlineItem => ({ type: "text", text: value, font });
        // "AVAVAVAV" has 4 pairs kerned, 2 of them across the pieces, so it is 60 points, and " aa" fits after it. Measured
        // apart, the pieces are 65 points
        expect(linesOf([piece("AVA"), piece("VAV", { kerning: 1 }), piece("AV aa")])).to.equal(1);
        // Pieces in different fonts aren't, nor pieces of the same font with different formatting, nor pieces not kerned
        expect(linesOf([piece("AVA"), piece("VAV", { ...kerned, bold: true }), piece("AV aa")])).to.equal(2);
        expect(
            linesOf([
                piece("AVA", { ...kerned, size: 10 }),
                piece("VAV", { ...kerned, size: 11 }),
                piece("AV aa", { ...kerned, size: 10 }),
            ]),
        ).to.equal(2);
        expect(linesOf([piece("AVA", {}), piece("VAV", {}), piece("AV aa", {})])).to.equal(2);
        // Formatting written as Word's default is the same as none
        expect(linesOf([piece("AVA"), piece("VAV", { ...kerned, bold: false, italic: false, scale: 100 }), piece("AV aa")])).to.equal(1);
        // A font's name in other capitals is the same font
        expect(
            linesOf([
                piece("AVA", { ...kerned, font: "Probe Sans" }),
                piece("VAV", { ...kerned, font: "probe sans" }),
                piece("AV aa", { ...kerned, font: "Probe Sans" }),
            ]),
        ).to.equal(1);
        // Pieces kerned from different sizes are both kerned
        expect(linesOf([piece("AVA", { kerning: 1 }), piece("VAV", { kerning: 2 }), piece("AV aa", { kerning: 1 })])).to.equal(1);
        // Text smaller than the size kerning starts at isn't kerned. Each piece has a font of its own, as each run does
        const small = { kerning: 12, size: 10 };
        expect(linesOf([piece("AVA", { ...small }), piece("VAV", { ...small }), piece("AV aa", { ...small })])).to.equal(2);
        expect(
            linesOf([piece("AVA", { ...small, size: 12 }), piece("VAV", { ...small, size: 12 }), piece("AV aa", { ...small, size: 12 })]),
        ).to.equal(1);
    });

    it("should measure kerned text either side of a soft hyphen apart, as Word doesn't kern across one", () => {
        // cspell:ignore VAVA VAVAV VAVAVAV AVAVA AVAVAVA
        // word-stops-text2.ts KE9a: "A-V" 12 times, kerned, as wide as its "V" and "A" kerned and not its "A" and "V". Here
        // "AV" kerned is 15 points, rather than 20
        const kerning: TextMeasurer = {
            measureWidth: (value) => [...value].length * 10 - (value.split("AV").length - 1) * 5,
            measureLineHeight: () => 10,
            measureDescent: () => 0,
        };
        const kerned = { kerning: 1 };
        const piece = (value: string): InlineItem => ({ type: "text", text: value, font: kerned });
        const softHyphen: InlineItem = { type: "softHyphen", font: kerned };
        const linesOf = (items: readonly InlineItem[], width: number): readonly (readonly (string | number | undefined)[])[] =>
            layoutLines(items, { width, measurer: kerning }).map(({ text: value, textWidth, unsupported }) => [
                value,
                textWidth,
                unsupported,
            ]);
        // "AVA" and "VAV", 25 each, where "AVAVAV" would be 45
        expect(linesOf([piece("AVA"), softHyphen, piece("VAV")], 200)).to.deep.equal([["AVAVAV", 50, undefined]]);
        // A part of the word before a soft hyphen is measured so too: "AVA" and "VAVA" with a hyphen are 70, so it breaks at
        // the first, whose hyphen Word may kern with the letter before it
        const broken = "a line that breaks at a soft hyphen in kerned text, whose hyphen Word may kern";
        expect(linesOf([piece("AVA"), softHyphen, piece("VAVA"), softHyphen, piece("VAV")], 67)).to.deep.equal([
            ["AVA", 35, broken],
            ["VAVAVAV", 60, undefined],
        ]);
        // And a word longer than its line, broken after the last character that fits: "VA" and "VA", where "VAVAV" would fit
        expect(linesOf([piece("AVAVAVA"), softHyphen, piece("VAVAVAV")], 40).map(([value]) => value)).to.deep.equal([
            "AVAVA",
            "VAVA",
            "VAVAV",
        ]);
        // The hyphen in another font isn't kerned with the text before it
        const plainHyphen: InlineItem = { type: "softHyphen", font: {} };
        expect(linesOf([piece("AVA"), plainHyphen, piece("VAVA")], 40).map(([, , unsupported]) => unsupported)).to.deep.equal([
            undefined,
            undefined,
        ]);
    });

    it("should measure the pieces of a word in the same font together when it has ligatures, so letters are joined across runs", () => {
        // "fi" joined is 15 points, rather than 20
        const joining: TextMeasurer = {
            measureWidth: (value, font) => [...value].length * 10 - (font.ligatures === undefined ? 0 : (value.split("fi").length - 1) * 5),
            measureLineHeight: () => 10,
            measureDescent: () => 0,
        };
        const textWidth = (items: readonly InlineItem[]): number => layoutLines(items, { width: 200, measurer: joining })[0].textWidth;
        const piece = (value: string, font: TextFont = { ligatures: "standard" }): InlineItem => ({ type: "text", text: value, font });
        // "ofice" has a "fi" across its runs
        expect(textWidth([piece("of"), piece("ice")])).to.equal(45);
        expect(textWidth([piece("of", {}), piece("ice", {})])).to.equal(50);
        expect(textWidth([piece("of"), piece("ice", { ligatures: "all" })])).to.equal(50);
    });

    it("should kern a word with the space after it, and the space with the next word, when they are in the same font and kerned", () => {
        // An A and a space next to each other are kerned 5 points nearer, as Arial and Times New Roman kern them
        const kerning: TextMeasurer = {
            measureWidth: (value, font) =>
                [...value].length * 10 - (font.kerning === undefined ? 0 : (value.match(/A | A/g) ?? []).length * 5),
            measureLineHeight: () => 10,
            measureDescent: () => 0,
        };
        const kerned = { kerning: 1 };
        const piece = (value: string, font: TextFont = kerned): InlineItem => ({ type: "text", text: value, font });
        const widths = (items: readonly InlineItem[], width = 200, options: Partial<LineLayoutOptions> = {}): readonly number[] =>
            layoutLines(items, { width, measurer: kerning, ...options }).map(({ textWidth }) => textWidth);
        // "AAA AAA" is 70 points, less 5 for the A before the space and 5 for the A after it
        expect(widths([piece("AAA AAA")])).to.deep.equal([60]);
        expect(widths([piece("AAA AAA", {})])).to.deep.equal([70]);
        // Across runs of the same font, and a bookmark between them, but not runs of other fonts
        expect(widths([piece("AAA"), piece(" "), { type: "marker", name: "here" }, piece("AAA")])).to.deep.equal([60]);
        expect(widths([piece("AAA"), piece(" ", { ...kerned, bold: true }), piece("AAA")])).to.deep.equal([70]);
        // cspell:ignore AVAV
        // A word longer than its line, kerned, is broken where its characters on each line, kerned together, fit
        // (word-stops-kerning.ts KE6a): with an A and a V 2 points nearer, 6 letters of "AVAV" fit in 50, where 5 would
        // measured each on its own
        const avKerning: TextMeasurer = {
            measureWidth: (value, font) =>
                [...value].length * 10 - (font.kerning === undefined ? 0 : (value.match(/(?=AV|VA)/g) ?? []).length * 2),
            measureLineHeight: () => 10,
            measureDescent: () => 0,
        };
        const broken = layoutLines([piece("AVAVAVAVAVAV")], { width: 52, measurer: avKerning });
        expect(broken.map(({ text: value, textWidth }) => [value, textWidth])).to.deep.equal([
            ["AVAVAV", 50],
            ["AVAVAV", 50],
        ]);
        // With ligatures, which Word may break inside, it stops the layout
        const longWord = (font: TextFont): string | undefined =>
            layoutLines([piece("AAAAAAAAAAAA", font)], { width: 50, measurer: kerning })[0].unsupported;
        expect(longWord(kerned)).to.equal(undefined);
        expect(longWord({ ligatures: "standard" })).to.equal("a word longer than its line with ligatures");
        expect(longWord({})).to.equal(undefined);
        // A word broken at a soft hyphen is kerned with the space before it: "AAA A" and the hyphen end at 50 kerned, with
        // room for Word to break there on a line of 52, and at 55 not
        expect(widths([piece("AAA A"), { type: "softHyphen", font: {} }, piece("BB", {})], 52)).to.deep.equal([50, 20]);
        // A word that goes to the next line isn't kerned with the space before it, which is on the line before
        expect(widths([piece("AAA AAA AAA")], 85)).to.deep.equal([60, 30]);
        // Nor one that goes on past a room beside a drawing it doesn't fit in, leaving the space before it there
        expect(
            layoutLines([piece(" AAAAA")], { width: (line) => (line === 0 ? { start: 0, end: 40 } : 100), measurer: kerning }).map(
                ({ textWidth }) => textWidth,
            ),
        ).to.deep.equal([0, 50]);
        // Nor is a word after a tab
        expect(widths([piece("AAA"), { type: "tab", font: kerned }, piece("AAA")])).to.deep.equal([66]);
        // The text after a tab lines up with a right tab stop as wide as it is kerned
        expect(
            widths([{ type: "tab", font: kerned }, piece("AAA AAA")], 200, { tabStops: [{ position: 100, alignment: "right" }] }),
        ).to.deep.equal([100]);
        // And a paragraph is as wide as its widest line kerned, and its narrowest its widest word
        expect(measureContentWidths([piece("AAA AAA")], { measurer: kerning })).to.deep.equal({ min: 30, max: 60 });
    });

    it("should space the lines as the paragraph says", () => {
        const lines = [text("aaaa bbbb cccc")];
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "multiple", multiple: 1.5 } } })).to.deep.equal([15, 15]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "exact", height: 8 } } })).to.deep.equal([8, 8]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "atLeast", height: 12 } } })).to.deep.equal([12, 12]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "atLeast", height: 8 } } })).to.deep.equal([10, 10]);
    });

    it("should space the lines from the one a marker is on as a joined paragraph's, as Word spaces each by the one it ends in", () => {
        // stops2/word-stops-hidden.ts HD1f, word-breaks-and-tabs.ts HM1h, HM1i: the line the next paragraph's text starts on,
        // and those after it, are spaced as the next one is
        const joined = [text("aaaa bbbb "), { type: "marker" as const, name: "joined" }, text("cccc dddd eeee")];
        const double = { rule: "multiple" as const, multiple: 2 };
        expect(heightsOf(joined, 100, { format: { lineSpacingFrom: { marker: "joined", lineSpacing: double } } })).to.deep.equal([
            10, 20, 20,
        ]);
        expect(heightsOf(joined, 100, { format: { lineSpacing: double, lineSpacingFrom: { marker: "joined" } } })).to.deep.equal([
            20, 10, 10,
        ]);
        // From the middle of a line, that line
        const midLine = [text("aaaa "), { type: "marker" as const, name: "joined" }, text("bbbb cccc dddd eeee")];
        expect(heightsOf(midLine, 100, { format: { lineSpacingFrom: { marker: "joined", lineSpacing: double } } })).to.deep.equal([
            20, 20, 20,
        ]);
        // From the start of a line, that line
        const atStart = [text("aaaa bbbb "), { type: "marker" as const, name: "joined" }, text("cccccccccc")];
        expect(heightsOf(atStart, 100, { format: { lineSpacingFrom: { marker: "joined", lineSpacing: double } } })).to.deep.equal([10, 20]);
    });

    it("should keep lines as tall as the font is, unrounded, as Word does, rather than in whole twips as LibreOffice does", () => {
        const twipsOf = (font: { readonly font: string; readonly size: number }, format = {}): number =>
            layoutLines([{ type: "text", text: "Some text", font }], { width: 500, format })[0].height * 20;
        const calibri = { font: "Calibri", size: 11 };
        // Word's lines of Calibri 11 are 268.55 twips, and LibreOffice's 269
        expect(twipsOf(calibri)).to.be.closeTo(268.5547, 0.0001);
        // Times New Roman 10 is neither LibreOffice's 230 nor 231
        expect(twipsOf({ font: "Times New Roman", size: 10 })).to.be.closeTo(229.9805, 0.0001);
        // Multiple spacing of the unrounded height, 289.82 twips at 259, where LibreOffice has 290
        expect(twipsOf(calibri, { lineSpacing: { rule: "multiple", multiple: 259 / 240 } })).to.be.closeTo(289.8153, 0.0001);
        expect(twipsOf(calibri, { lineSpacing: { rule: "multiple", multiple: 1.5 } })).to.be.closeTo(402.832, 0.0001);
        // An exact or at-least height stays as it is written
        expect(twipsOf(calibri, { lineSpacing: { rule: "exact", height: 15 } })).to.equal(300);
        expect(twipsOf(calibri, { lineSpacing: { rule: "atLeast", height: 20 } })).to.equal(400);
        expect(twipsOf(calibri, { lineSpacing: { rule: "atLeast", height: 13 } })).to.be.closeTo(268.5547, 0.0001);
    });

    it("should wrap inside the paragraph's indents", () => {
        const words = [text("aaa bbb ccc ddd")];
        // 80 points wide: two words to a line
        expect(heightsOf(words, 100, { format: { indentLeft: 10, indentRight: 10 } })).to.have.length(2);
        // The first line starts 30 points in, so only one word fits on it
        expect(heightsOf(words, 100, { format: { indentLeft: 10, indentRight: 10, firstLineIndent: 20 } })).to.have.length(3);
    });

    it("should put each bookmark on the line its text starts on", () => {
        const lines = layoutLines(
            [
                { type: "marker", name: "start" },
                text("aaaa bbbb "),
                { type: "marker", name: "wrapped" },
                text("cccc"),
                { type: "marker", name: "end" },
            ],
            { width: 100, measurer: MEASURER },
        );
        expect(lines.map(({ markers }) => markers)).to.deep.equal([["start"], ["wrapped", "end"]]);
    });

    it("should start a new line at a line break, as tall as the break's text", () => {
        expect(heightsOf([text("aa"), { type: "break", kind: "line", font: { size: 20 } }, text("bb")])).to.deep.equal([20, 10]);
        expect(heightsOf([{ type: "break", kind: "line", font: {} }])).to.deep.equal([10, 10]);
    });

    it("should mark the lines that end with a page or column break, with the paragraph's mark on a page break's line at its end", () => {
        const lines = layoutLines(
            [
                text("aa"),
                { type: "break", kind: "column", font: {} },
                text("bb"),
                { type: "break", kind: "page", font: {} },
                { type: "marker", name: "after" },
            ],
            { width: 100, measurer: MEASURER, markFont: { size: 12 } },
        );
        expect(lines).to.deep.equal([
            { height: 10, markers: [], breakAfter: "column", text: "aa", textWidth: 20 },
            { height: 10, markers: ["after"], breakAfter: "page", text: "bb", textWidth: 20 },
        ]);
        // After a column break at its end, the mark is on a line of its own, at the top of the next column
        expect(
            layoutLines([text("aa"), { type: "break", kind: "column", font: {} }, { type: "marker", name: "after" }], {
                width: 100,
                measurer: MEASURER,
                markFont: { size: 12 },
            }),
        ).to.deep.equal([
            { height: 10, markers: [], breakAfter: "column", text: "aa", textWidth: 20 },
            { height: 12, markers: ["after"], text: "", textWidth: 0 },
        ]);
        // With no text on its line, the break's line is as tall as the mark
        expect(
            layoutLines([{ type: "break", kind: "page", font: {} }], { width: 100, measurer: MEASURER, markFont: { size: 12 } }),
        ).to.deep.equal([{ height: 12, markers: [], breakAfter: "page", text: "", textWidth: 0 }]);
    });

    it("should make a line of only spaces before a page break at the end of a paragraph as tall as the mark, as Word does", () => {
        const pageBreak = (size: number): InlineItem => ({ type: "break", kind: "page", font: { size } });
        // word-probes.docx U8a6: 28-point spaces before a break of the paragraph's size
        expect(heightsOf([text("     ", 28), pageBreak(11)], 100, { markFont: { size: 11 } })).to.deep.equal([11]);
        // U8a7: the break 28-point too
        expect(heightsOf([text("     ", 28), pageBreak(28)], 100, { markFont: { size: 11 } })).to.deep.equal([11]);
        expect(heightsOf([pageBreak(28)], 100, { markFont: { size: 11 } })).to.deep.equal([11]);
        // With text after it, the break's line is as tall as the break, and a line break's always is
        expect(heightsOf([text("     ", 28), pageBreak(28), text("bb")], 100, { markFont: { size: 11 } })).to.deep.equal([28, 10]);
        expect(
            heightsOf([text("     ", 28), { type: "break", kind: "line", font: { size: 28 } }], 100, { markFont: { size: 11 } }),
        ).to.deep.equal([28, 11]);
    });

    it("should put the text after a page break at the end of a paragraph, or a line break, on a line of its own", () => {
        const lines = layoutLines([text("aa"), { type: "break", kind: "page", font: {} }, text("bb")], {
            width: 100,
            measurer: MEASURER,
            markFont: { size: 12 },
        });
        expect(lines).to.deep.equal([
            { height: 10, markers: [], breakAfter: "page", text: "aa", textWidth: 20 },
            { height: 10, markers: [], text: "bb", textWidth: 20 },
        ]);
        expect(heightsOf([text("aa"), { type: "break", kind: "line", font: {} }], 100, { markFont: { size: 12 } })).to.deep.equal([10, 12]);
    });

    it("should wrap after a hyphen, but not a minus sign before a number", () => {
        // "aaaa-" fits on the line after "bbb "
        expect(heightsOf([text("bbb aaaa-cccc")])).to.deep.equal([10, 10]);
        expect(heightsOf([text("bbb aaaa-cccc")], 140)).to.deep.equal([10]);
        expect(heightsOf([text("bbbbbbb -1234")])).to.deep.equal([10, 10]);
        // Runs next to each other are one word unless a line can break between them
        expect(heightsOf([text("aaa "), text("bbbb", 20), text("ccc")])).to.deep.equal([10, 20]);
        expect(heightsOf([text("aaa "), text("bbb-", 20), text("ccc")])).to.deep.equal([20, 10]);
    });

    it("should break between Chinese and Japanese characters", () => {
        // cspell:disable
        expect(heightsOf([text("漢字漢字漢字漢字漢字漢字")])).to.deep.equal([10, 10]);
        expect(heightsOf([text("漢字"), text("かな")])).to.deep.equal([10]);
        // cspell:enable
    });

    describe("in Japanese and Chinese", () => {
        // cspell:disable
        /** The lines of ten ideographs and a full stop, with a bookmark before the tenth, and the line the bookmark is on */
        const markedLine = (language?: string, options: Partial<LineLayoutOptions> = {}): number => {
            const lines = layoutLines(
                [
                    { type: "text", text: "永".repeat(9), font: {}, ...(language ? { language } : {}) },
                    { type: "marker", name: "tenth" },
                    { type: "text", text: "永。", font: {}, ...(language ? { language } : {}) },
                ],
                { width: 100, measurer: MEASURER, ...options },
            );
            return lines.findIndex(({ markers }) => markers.includes("tenth"));
        };

        it("should move the character before one that can't start a line to the next line with it, as Word does", () => {
            expect(markedLine("ja-JP")).to.equal(1);
            expect(markedLine("zh-TW")).to.equal(1);
        });

        it("should let any character start a line in text with no East Asian language, or with kinsoku off, as Word does", () => {
            expect(markedLine()).to.equal(0);
            expect(markedLine("ko-KR")).to.equal(0);
            expect(markedLine("ja-JP", { format: { kinsoku: false } })).to.equal(0);
            expect(markedLine("ja-JP", { format: { kinsoku: false }, breakRules: { kinsoku: true } })).to.equal(0);
            expect(markedLine("ja-JP", { breakRules: { kinsoku: false } })).to.equal(0);
        });

        it("should take the document's list of the characters that can't start a line", () => {
            expect(markedLine("ja-JP", { breakRules: { lists: { japanese: { noLineStart: "" } } } })).to.equal(0);
        });
        // cspell:enable
    });

    it("should break the words of East Asian runs anywhere with word wrap off", () => {
        const latin: InlineItem = { type: "text", text: "aaaaaa bbbbbb cccccc", font: {}, eastAsian: true };
        const linesOf = (item: InlineItem, format = {}): number => layoutLines([item], { width: 100, measurer: MEASURER, format }).length;
        // Filled to the end of each line: "aaaaaa bbb" and "bbb cccccc"
        expect(linesOf(latin, { wordWrap: false })).to.equal(2);
        // Broken between its words with word wrap on, and in a run that isn't East Asian
        expect(linesOf(latin)).to.equal(3);
        expect(linesOf({ ...latin, eastAsian: false }, { wordWrap: false })).to.equal(3);
    });

    it("should break a word wider than a line across as many lines as it needs", () => {
        expect(heightsOf([text("a".repeat(25))])).to.deep.equal([10, 10, 10]);
        expect(heightsOf([text("bb "), text("a".repeat(20), 12)])).to.deep.equal([10, 12, 12]);
        expect(heightsOf([text("a".repeat(20))])).to.deep.equal([10, 10]);
    });

    it("should break each line at its own width, when the lines are of different widths", () => {
        const words = ["aaa", "bbb", "ccc", "ddd", "eee"].flatMap((word): readonly InlineItem[] => [
            { type: "marker", name: word },
            text(`${word} `),
        ]);
        const wordsOf = (width: number | ((line: number) => number)): readonly (readonly string[])[] =>
            layoutLines(words, { width, measurer: MEASURER }).map(({ markers }) => markers);
        // The first line is 40 points wide, and the rest 100, as in a paragraph that goes on into a wider column
        expect(wordsOf((line) => (line === 0 ? 40 : 100))).to.deep.equal([["aaa"], ["bbb", "ccc"], ["ddd", "eee"]]);
        expect(wordsOf(100)).to.deep.equal([["aaa", "bbb"], ["ccc", "ddd"], ["eee"]]);
        // A word wider than a line is broken across lines as long as each is
        const long = (width: (line: number) => number): number => layoutLines([text("a".repeat(25))], { width, measurer: MEASURER }).length;
        expect(long((line) => (line === 0 ? 100 : 50))).to.equal(4);
        expect(long(() => 100)).to.equal(3);
        // A tab with no stop left on its line moves to one on the next line only when the next line is long enough for it
        const tabbed = [text("aaaaaaaaa"), { type: "tab", font: {} } as const, text("b")];
        expect(layoutLines(tabbed, { width: (line) => (line === 0 ? 100 : 30), measurer: MEASURER })).to.have.length(1);
        expect(layoutLines(tabbed, { width: 100, measurer: MEASURER })).to.have.length(2);
    });

    it("should break a line in the room given to it, in place of its indents, as beside a drawing that text flows around", () => {
        const words = ["aaa", "bbb", "ccc", "ddd", "eee"].flatMap((word): readonly InlineItem[] => [
            { type: "marker", name: word },
            text(`${word} `),
        ]);
        const format = { indentLeft: 10, firstLineIndent: 10, indentRight: 10 };
        const laidOut = (
            width: (line: number) => number | { readonly start: number; readonly end: number },
        ): readonly (readonly [string, number])[] =>
            layoutLines(words, { width, format, measurer: MEASURER }).map(
                ({ text: lineText, textWidth }) => [lineText, textWidth] as const,
            );
        // The first line has room from 50 to 90, beside a drawing on its left, the second from 0 to 40 and the rest the
        // width less the indents
        expect(laidOut((line) => (line === 0 ? { start: 50, end: 90 } : line === 1 ? { start: 0, end: 40 } : 100))).to.deep.equal([
            ["aaa ", 30],
            ["bbb ", 30],
            ["ccc ddd ", 70],
            ["eee ", 30],
        ]);
        // A tab with no stop left on its line moves to one on the next line, from where that line starts
        const tabbed = [text("aaaaaaaaa"), { type: "tab", font: {} } as const, text("b")];
        expect(
            layoutLines(tabbed, { width: (line) => (line === 0 ? 100 : { start: 50, end: 100 }), measurer: MEASURER }).map(
                ({ text: lineText }) => lineText,
            ),
        ).to.deep.equal(["aaaaaaaaa", "\tb"]);
        // A line in a room of its own that the next word doesn't fit in is left empty, as Word leaves a room beside a drawing,
        // and the word goes on the next line, broken there when it is wider than that line too
        const textsIn = (
            items: readonly InlineItem[],
            width: (line: number) => number | { readonly start: number; readonly end: number },
        ): readonly string[] => layoutLines(items, { width, measurer: MEASURER }).map(({ text: lineText }) => lineText);
        expect(textsIn([text("a".repeat(12))], (line) => (line === 0 ? { start: 40, end: 100 } : 100))).to.deep.equal([
            "",
            "aaaaaaaaaa",
            "aa",
        ]);
        expect(textsIn([text("aaa bbbbbbb cc")], (line) => (line < 3 ? { start: 0, end: 40 } : 100))).to.deep.equal([
            "aaa ",
            "",
            "",
            "bbbbbbb cc",
        ]);
        // A picture likewise, and a word that fits starts the line as on any other
        expect(
            textsIn([{ type: "box", width: 50, height: 10 }, text("a")], (line) => (line === 0 ? { start: 0, end: 40 } : 100)),
        ).to.deep.equal(["", "a"]);
    });

    it("should break a word wider than a line after the last character that fits on each line, as Word does", () => {
        // Each letter is 30 points, so 3 fit on a line of 100, and 10 take 4 lines
        const wide: TextMeasurer = {
            measureWidth: (value) => [...value].length * 30,
            measureLineHeight: () => 10,
            measureDescent: () => 0,
        };
        expect(layoutLines([text("a".repeat(10))], { width: 100, measurer: wide })).to.have.length(4);
        // An accent stays with its letter: "aa" and "a\u0301a"
        expect(layoutLines([text("aaa\u0301a")], { width: 100, measurer: wide })).to.have.length(2);
        // Also when the accent is in a run of its own: "a", "a\u0301" and "a" on lines of 70
        expect(layoutLines([text("aa"), text("\u0301a", 12)], { width: 70, measurer: wide })).to.have.length(3);
        // And a character joined to the one before it by a zero-width joiner stays with it: "a\u200db" and "aa"
        expect(layoutLines([text("a\u200dbaa")], { width: 70, measurer: wide })).to.have.length(2);
    });

    it("should lay out pictures in the line, and wrap them as a word", () => {
        expect(heightsOf([text("aaaa "), { type: "box", width: 30, height: 50 }, text(" bbbb")])).to.deep.equal([50, 10]);
        expect(heightsOf([text("aaaaaaaa "), { type: "box", width: 30, height: 50 }])).to.deep.equal([10, 50]);
    });

    it("should give a picture in a border the room of its box below the baseline, as Word does", () => {
        // word-stops-text2.ts RF32b: a picture of 20 points in a border of 1.5 points 2 points away stands on the baseline,
        // 23.5 points with the room above it, and the room below it, 3.5, is deeper than the text's descent of 2
        const descending: TextMeasurer = { ...MEASURER, measureDescent: () => 2 };
        const border = { room: 3.5, key: "picture" };
        const picture: InlineItem = { type: "box", width: 27, height: 23.5, below: 3.5, font: { border } };
        const lines = (
            items: readonly InlineItem[],
            options: Partial<LineLayoutOptions> = {},
        ): readonly (readonly (number | string | undefined)[])[] =>
            layoutLines(items, { width: 100, measurer: descending, ...options }).map(({ height, unsupported }) => [height, unsupported]);
        expect(lines([text("a "), picture, text(" b")])).to.deep.equal([[27, undefined]]);
        // Multiple spacing beside it, which may count its box, and text beside it in the same border, haven't been seen
        expect(lines([text("a "), picture], { format: { lineSpacing: { rule: "multiple", multiple: 1.5 } } })[0][1]).to.equal(
            "a picture in a border in a line with multiple line spacing",
        );
        const sameBorder = (value: string): InlineItem => ({ type: "text", text: value, font: { border } });
        const beside = "a picture in a border beside text in the same border";
        expect(lines([sameBorder("a"), picture])[0][1]).to.equal(beside);
        expect(lines([picture, { type: "marker", name: "m" }, sameBorder("b")])[0][1]).to.equal(beside);
        expect(lines([picture, { type: "text", text: "b", font: { border: { room: 3.5, key: "other" } } }])[0][1]).to.equal(undefined);
    });

    it("should lay out text fitted to a width as a box of that width, as tall as its text, and move it on whole", () => {
        // word-stops-text2.ts RF29b to RF29d: text fitted to 25, 100 and 150 points takes that much room on its line, and goes
        // on to the next line whole where it doesn't fit
        const fitted = (width: number, size = 10): InlineItem => ({ type: "box", width, height: 0, font: { size }, text: "fitted text" });
        const lines = (items: readonly InlineItem[], width = 100): readonly (readonly (number | string | undefined)[])[] =>
            layoutLines(items, { width, measurer: MEASURER }).map(({ text: value, textWidth, height, unsupported }) => [
                value,
                textWidth,
                height,
                unsupported,
            ]);
        expect(lines([text("aa "), fitted(25, 20)])).to.deep.equal([["aa fitted text", 55, 20, undefined]]);
        expect(lines([text("aaaa "), fitted(60), text(" b")])).to.deep.equal([
            ["aaaa ", 40, 10, undefined],
            ["fitted text b", 80, 10, undefined],
        ]);
        // One wider than its line hasn't been seen, at its start or after text
        expect(lines([fitted(120)])[0][3]).to.equal("text fitted to a width wider than its line");
        expect(lines([text("aa "), fitted(120)]).map((line) => line[3])).to.deep.equal([
            undefined,
            "text fitted to a width wider than its line",
        ]);
    });

    it("should move tabs to the default tab stops", () => {
        // Stops every 36 points: aaa ends at 30, the tab moves to 36, and "bbbbbbb" doesn't fit after it in 100, so the tab
        // goes on to the next line with it, which breaks there after "bbbbbb" (word-stops-text2.ts TA11a)
        expect(heightsOf([text("aaa"), { type: "tab", font: {} }, text("bbbbbbb")])).to.deep.equal([10, 10, 10]);
        expect(heightsOf([text("aaa"), { type: "tab", font: {} }, text("bbbbbb")])).to.deep.equal([10]);
        expect(heightsOf([text("aaa"), { type: "tab", font: {} }, text("bbbbbbb")], 100, { defaultTabStop: 30 })).to.deep.equal([10, 10]);
        expect(heightsOf([text("aa"), { type: "tab", font: {} }, text("bbbbbbb")], 100, { defaultTabStop: 30 })).to.deep.equal([10]);
    });

    it("should line up the text after a tab with the paragraph's own tab stops", () => {
        const tab: InlineItem = { type: "tab", font: {} };
        // A left stop at 70 leaves room for three characters, and four go on to the next line with the tab, which breaks them
        // after three there
        expect(heightsOf([text("a"), tab, text("bbb")], 100, { tabStops: [{ position: 70, alignment: "left" }] })).to.deep.equal([10]);
        expect(heightsOf([text("a"), tab, text("bbbb")], 100, { tabStops: [{ position: 70, alignment: "left" }] })).to.deep.equal([
            10, 10, 10,
        ]);
        // A right stop at the end of the line, as a table of contents has, puts the page number at the end
        expect(heightsOf([text("aaaaaa"), tab, text("12")], 100, { tabStops: [{ position: 100, alignment: "right" }] })).to.deep.equal([
            10,
        ]);
        expect(heightsOf([text("aaaaaaaaa"), tab, text("12")], 100, { tabStops: [{ position: 100, alignment: "right" }] })).to.deep.equal([
            10, 10,
        ]);
        // A centered stop at 50 puts "bbbb" from 30 to 70, and "cc" fits after it
        expect(
            heightsOf([text("a"), tab, text("bbbb"), tab, text("cc")], 100, {
                tabStops: [
                    { position: 50, alignment: "center" },
                    { position: 80, alignment: "decimal" },
                ],
            }),
        ).to.deep.equal([10]);
    });

    it("should line up pictures and bookmarks after a tab with its stop, and use the paragraph's stops on every line", () => {
        const tab: InlineItem = { type: "tab", font: {} };
        const right = { tabStops: [{ position: 100, alignment: "right" as const }] };
        // "a", then a 50 point picture and "b", which end at 100
        expect(
            heightsOf([text("a"), tab, { type: "box", width: 50, height: 20 }, { type: "marker", name: "m" }, text("b")], 100, right),
        ).to.deep.equal([20]);
        // Too wide to end at the stop, the picture starts after "a", and "b" wraps
        expect(heightsOf([text("a"), tab, { type: "box", width: 90, height: 20 }, text("b")], 100, right)).to.deep.equal([20, 10]);
        // The second line's tab moves to the stop at 100, where "c" ends
        expect(heightsOf([text("aaaaaaaaa bbbbbbbb"), tab, text("c")], 100, right)).to.deep.equal([10, 10]);
    });

    it("should move a tab past the end of the line to a stop on the next line", () => {
        const tab: InlineItem = { type: "tab", font: {} };
        expect(heightsOf([text("aaaaaaaa"), tab, text("b")], 100, { tabStops: [{ position: 20, alignment: "left" }] })).to.deep.equal([
            10, 10,
        ]);
        // At the start of a line, with no stop before the end of it, the text starts where it is
        expect(heightsOf([tab, text("b")], 100, { tabStops: [], defaultTabStop: 200 })).to.deep.equal([10]);
        // After text, with no stop at all before the end of a line, the text after the tab carries on
        expect(heightsOf([text("a"), tab, text("b")], 100, { tabStops: [], defaultTabStop: 200 })).to.deep.equal([10]);
    });

    it("should put a list number aligned right before the start of its first line, and a centred one around it, with the text after it from its end", () => {
        // The number "1234." is 50 points wide, the first line starts at 30, and the hanging indent's stop is at 40
        // (word-watertight-text.docx TX21)
        const format = { indentLeft: 40, firstLineIndent: -10 };
        const items: readonly InlineItem[] = [text("1234."), { type: "tab", font: { listNumber: "separator" } }, text("bbbbbbbbbb")];
        const linesOf = (numberAlignment?: "center" | "right"): readonly Pick<LaidOutLine, "text" | "textWidth">[] =>
            layoutLines(items, { width: 200, format, measurer: MEASURER, numberAlignment }).map(({ text: lineText, textWidth }) => ({
                text: lineText,
                textWidth,
            }));
        // Right-aligned, it ends at 30, so the text goes from the stop at 40 to 140
        expect(linesOf("right")).to.deep.equal([{ text: "1234.\tbbbbbbbbbb", textWidth: 110 }]);
        // Centred, it ends at 55, past the stop, so the text goes from the next default stop, 72, to 172
        expect(linesOf("center")).to.deep.equal([{ text: "1234.\tbbbbbbbbbb", textWidth: 142 }]);
        // Left-aligned, it ends at 80, and the text from the default stop at 108 doesn't fit
        expect(linesOf().map(({ text: lineText }) => lineText)).to.deep.equal(["1234.\t", "bbbbbbbbbb"]);
        // A paragraph whose first item isn't text has no number to align
        expect(
            layoutLines([{ type: "tab", font: {} }, text("b")], { width: 200, format, measurer: MEASURER, numberAlignment: "right" })[0]
                .textWidth,
        ).to.equal(20);
    });

    it("should put the text after a right-aligned number and its space where the number would end without it", () => {
        // word-lists.docx LJ4: "Paragraph1. " ends at the start of the line, so the text starts there. The space is 15 points
        // here, as Word measures it in Arial
        const format = { indentLeft: 40, firstLineIndent: -10 };
        const separator = { listNumber: "separator" as const, size: 15 };
        const items: readonly InlineItem[] = [text("1234."), { type: "text", text: " ", font: separator }, text("bbbbbbbbbbbbbbbbb")];
        const widthOfSpace = (value: string, font: TextFont): number => [...value].length * (font.size ?? 10);
        const [line] = layoutLines(items, {
            width: 200,
            format,
            measurer: { ...MEASURER, measureWidth: widthOfSpace },
            numberAlignment: "right",
        });
        // From 30, the line has room for the 170 points of b's
        expect(line.text).to.equal("1234. bbbbbbbbbbbbbbbbb");
        expect(line.textWidth).to.equal(170);
    });

    it("should centre a centred number and its space together around the start of the first line", () => {
        // stops2/word-stops-lists.ts LI3a: "1." and its space centred at 360 twips start at 246, rather than "1." alone. Here
        // "1234." and its space of 15 points, 65 together, are centred at 30, so the text after them goes from 62.5 to 162.5
        const format = { indentLeft: 40, firstLineIndent: -10 };
        const separator = { listNumber: "separator" as const, size: 15 };
        const items: readonly InlineItem[] = [text("1234."), { type: "text", text: " ", font: separator }, text("bbbbbbbbbb")];
        const widthOfSpace = (value: string, font: TextFont): number => [...value].length * (font.size ?? 10);
        const [line] = layoutLines(items, {
            width: 200,
            format,
            measurer: { ...MEASURER, measureWidth: widthOfSpace },
            numberAlignment: "center",
        });
        expect(line.textWidth).to.equal(132.5);
    });

    it("should move the tab after a right-aligned number to the first stop past its end, or to the left indent without one", () => {
        const items: readonly InlineItem[] = [text("1234."), { type: "tab", font: { listNumber: "separator" } }, text("b")];
        const laidOut = (format: ParagraphFormat, tabStops: readonly { readonly position: number; readonly alignment: "left" }[] = []) =>
            layoutLines(items, { width: 300, format, tabStops, defaultTabStop: 36, measurer: MEASURER, numberAlignment: "right" })[0];
        // word-lists.docx LJ6, stops2/word-stops-lists.ts LI6b: the number ends at the left indent, on a default stop or not,
        // and the text starts there
        expect(laidOut({ indentLeft: 72 })).to.deep.include({ textWidth: 10 });
        expect(laidOut({ indentLeft: 80 })).to.deep.include({ textWidth: 10 });
        // LJ1, LJ7: with a hanging indent, at its stop past the default one the number ends at, and past a stop of the
        // paragraph's own there
        expect(laidOut({ indentLeft: 108, firstLineIndent: -36 })).to.deep.include({ textWidth: 46 });
        expect(laidOut({ indentLeft: 108, firstLineIndent: -36 }, [{ position: 72, alignment: "left" }])).to.deep.include({
            textWidth: 46,
        });
        // LI6c: after a first line indent, at the next default stop past the one the number ends at
        expect(laidOut({ indentLeft: 36, firstLineIndent: 36 })).to.deep.include({ textWidth: 46 });
        expect(laidOut({ indentLeft: 36, firstLineIndent: 40 })).to.deep.include({ textWidth: 42 });
        expect([{ indentLeft: 80 }, { indentLeft: 36, firstLineIndent: 36 }].map((format) => laidOut(format).unsupported)).to.deep.equal([
            undefined,
            undefined,
        ]);
        // A number too wide for its line has no stop to go to
        expect(
            layoutLines(items, { width: 60, format: { indentLeft: 72 }, measurer: MEASURER, numberAlignment: "right" })[0].unsupported,
        ).to.equal(undefined);
    });

    it("should take a hanging indent as a tab stop on the first line", () => {
        const format = { indentLeft: 50, firstLineIndent: -50 };
        const tab: InlineItem = { type: "tab", font: { size: 14 } };
        // "1." then a tab to 50, where the text starts. A default stop would be at 36
        expect(heightsOf([text("1."), tab, text("bbbbb")], 100, { format })).to.deep.equal([14]);
        expect(heightsOf([text("1."), tab, text("bbbbb bbbbb")], 100, { format })).to.deep.equal([14, 10]);
        // A stop of the paragraph's own before the indent comes first
        expect(
            heightsOf([text("1."), tab, text("bbbbbb")], 100, {
                format,
                tabStops: [
                    { position: 40, alignment: "left" },
                    { position: 90, alignment: "left" },
                ],
            }),
        ).to.deep.equal([14]);
    });

    it("should give each line its text, with the spaces where it wraps, and how far its text goes from its start", () => {
        const textsOf = (items: readonly InlineItem[], options = {}): readonly (readonly [string, number])[] =>
            layoutLines(items, { width: 100, measurer: MEASURER, ...options }).map((line) => [line.text, line.textWidth] as const);
        // The space after bbbb wraps with it, and takes no room
        expect(textsOf([text("aaaa bbbb cccc")])).to.deep.equal([
            ["aaaa bbbb ", 90],
            ["cccc", 40],
        ]);
        // From where each line starts: the first 20 points in, and the rest 10
        expect(textsOf([text("aaaa bbbb")], { format: { indentLeft: 10, firstLineIndent: 10 } })).to.deep.equal([
            ["aaaa ", 40],
            ["bbbb", 40],
        ]);
        // A picture, a bookmark and a break add nothing to the text, and a picture's width counts
        expect(
            textsOf([
                { type: "marker", name: "m" },
                text("aa "),
                { type: "box", width: 30, height: 10 },
                { type: "break", kind: "line", font: {} },
                text("bb"),
            ]),
        ).to.deep.equal([
            ["aa ", 60],
            ["bb", 20],
        ]);
        // An empty line has no text
        expect(textsOf([])).to.deep.equal([["", 0]]);
    });

    it("should give a line with tabs its text up to its last stop, with each tab as \\t", () => {
        const tab: InlineItem = { type: "tab", font: {} };
        // "12" ends at the right stop at 100
        expect(
            layoutLines([text("aa"), tab, text("12")], {
                width: 100,
                measurer: MEASURER,
                tabStops: [{ position: 100, alignment: "right" }],
            }),
        ).to.deep.include({ height: 10, markers: [], text: "aa\t12", textWidth: 100 });
        // With no stop before the end of the line, the text after the tab carries on where it is
        expect(layoutLines([text("a"), tab], { width: 100, measurer: MEASURER, defaultTabStop: 200 })).to.deep.equal([
            { height: 10, markers: [], text: "a\t", textWidth: 10 },
        ]);
    });

    it("should split the text of a word wider than a line between the lines it is broken across", () => {
        // cspell:disable
        const textsOf = (items: readonly InlineItem[], options = {}): readonly string[] =>
            layoutLines(items, { width: 100, measurer: MEASURER, ...options }).map((line) => line.text);
        expect(textsOf([text("abcdefghijklmnopqrstuvwxy")])).to.deep.equal(["abcdefghij", "klmnopqrst", "uvwxy"]);
        expect(
            layoutLines([text("abcdefghijklmnopqrstuvwxy")], { width: 100, measurer: MEASURER }).map((line) => line.textWidth),
        ).to.deep.equal([100, 100, 50]);
        // After a first line indent of 20, and from 20 points left of the other lines with a hanging indent
        expect(textsOf([text("abcdefghijklmnopqrstuvwxy")], { format: { firstLineIndent: 20 } })).to.deep.equal([
            "abcdefgh",
            "ijklmnopqr",
            "stuvwxy",
        ]);
        expect(textsOf([text("abcdefghijklmnopqrstuvwxy")], { format: { indentLeft: 20, firstLineIndent: -20 } })).to.deep.equal([
            "abcdefghij",
            "klmnopqr",
            "stuvwxy",
        ]);
        // cspell:enable
    });

    it("should measure with the widths of the fonts by default", () => {
        const [line] = layoutLines([text("Some text", 11)], { width: 500 });
        expect(line.height).to.equal(measureLineHeight({ size: 11 }));
        expect(DEFAULT_MEASURER.measureWidth("Some text", { size: 11 })).to.equal(measureTextWidth("Some text", { size: 11 }));
        expect(layoutLines([text("Some text", 11)], { width: measureTextWidth("Some", { size: 11 }) + 1 })).to.have.length(2);
    });

    describe("justified lines", () => {
        // Each character is 10 points wide, so is each space
        const justified = { alignment: "justified" } as const;
        const countOf = (items: readonly InlineItem[], width: number, format: ParagraphFormat = justified): number =>
            layoutLines(items, { width, measurer: MEASURER, format }).length;

        it("should squeeze one more word onto a justified line when its spaces would stretch more than twice as much without it", () => {
            // 10 words of 2 letters and their 9 spaces end at 290, and "bbbb" after a space at 340. On a line of 325 its 10
            // spaces are squeezed by 15%, against the 9 between the words stretching by 35 / 90, 39%: more than twice. A
            // line of 300 follows it, which "bbbb" doesn't fit on
            const items = [text(`aa aa aa aa aa aa aa aa aa aa bbbb ${"c".repeat(30)}`)];
            expect(countOf(items, 325)).to.equal(2);
            // On a line of 320 they'd be squeezed by 20%, against 33%
            expect(countOf(items, 320)).to.equal(3);
            // Word squeezes them when they'd stretch 2.022 times as much, and not 2.008: on a line of 322.3, 17.7 squeezed
            // against 32.3 stretched is 2.028 times, and on one of 322.1, 1.998
            expect(countOf(items, 322.3)).to.equal(2);
            expect(countOf(items, 322.1)).to.equal(3);
            // Lines justified for Thai or with a kashida are squeezed as justified ones are
            expect(countOf(items, 322.3, { alignment: "thaiDistributed" })).to.equal(2);
            expect(countOf(items, 322.1, { alignment: "lowKashida" })).to.equal(3);
            // A left-aligned, centred or right-aligned line isn't squeezed
            expect(countOf(items, 325, {})).to.equal(3);
            expect(countOf(items, 325, { alignment: "center" })).to.equal(3);
            expect(countOf(items, 325, { alignment: "right" })).to.equal(3);
            // A distributed line could stretch its 20 letters too, which Word weighs as 20 / 7.2 more spaces, so its spaces
            // would stretch by 35 / 11.8 against 1.5 squeezed, less than twice as much. By 1, against 40 / 11.8, it is
            expect(countOf(items, 325, { alignment: "distributed" })).to.equal(3);
            expect(countOf(items, 330, { alignment: "distributed" })).to.equal(2);
            expect(countOf(items, 330, {})).to.equal(3);
            // A picture is squeezed in as a word is
            expect(countOf([text("aa aa aa aa aa aa aa aa aa aa "), { type: "box", width: 40, height: 10 }], 325)).to.equal(1);
            // So is a line with text in a border, whether the border is on the word squeezed in or on a word before it
            const box = (value: string): InlineItem => ({ type: "text", text: value, font: { border: { room: 1, key: "a" } } });
            const linesWith = (boxed: readonly InlineItem[]): readonly LaidOutLine[] =>
                layoutLines(boxed, { width: 330, measurer: MEASURER, format: justified });
            expect(
                linesWith([text("aa aa aa aa aa aa aa aa aa aa "), box("bbbb"), text(` ${"c".repeat(30)}`)]).map(({ text: one }) => one),
            ).to.deep.equal(["aa aa aa aa aa aa aa aa aa aa bbbb ", "c".repeat(30)]);
            const [line] = linesWith([box("aa"), text(" aa aa aa aa aa aa aa aa aa bbbb"), text(` ${"c".repeat(30)}`)]);
            expect([line.text, line.unsupported]).to.deep.equal(["aa aa aa aa aa aa aa aa aa aa bbbb ", undefined]);
        });

        it("should squeeze the lines of Word's probes where Word squeezed them", () => {
            // word-justify2.docx K07_06 and K07_07, distributed, and K08_11 and K08_12, justified for Thai: Calibri 11 on lines
            // of 9026 twips less their right indents. Word squeezed "from" onto K07_06's second line, and "coast" onto
            // K08_11's first, where the spaces would stretch 2.034 and 2.022 times as much as they're squeezed, and not onto
            // K07_07's and K08_12's, at 1.69 and 1.86
            const font = { font: "Calibri", size: 11 };
            const tail =
                "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth the survey of the coast was made in";
            const linesOf = (
                label: string,
                first: string,
                right: number,
                alignment: "distributed" | "thaiDistributed",
            ): readonly string[] =>
                layoutLines([{ type: "text", text: `${label} ${first} ${tail}`, font }], {
                    width: (9026 - right) / 20,
                    format: { alignment },
                }).map(({ text: value }) => value.trim().split(" ").at(-1)!);
            const short = "of the by in to and on of the by in to and on of the by in lighthouse";
            expect(linesOf("K07_06", short, 2503, "distributed").slice(0, 2)).to.deep.equal(["lighthouse", "from"]);
            expect(linesOf("K07_07", short, 2521, "distributed").slice(0, 2)).to.deep.equal(["lighthouse", "foot"]);
            const long = "the survey of the coast was made in the summer by boat and on foot from the to coast";
            expect(linesOf("K08_11", long, 726, "thaiDistributed")[0]).to.equal("coast");
            expect(linesOf("K08_12", long, 736, "thaiDistributed")[0]).to.equal("to");
        });

        it("should squeeze the spaces by no more than a quarter of their width", () => {
            // Words of 200 and 100 end at 310, with one space between them that could stretch a long way, and "zzzzzzzzzz"
            // after another goes to 420
            const items = [text(`${"x".repeat(20)} ${"y".repeat(10)} ${"z".repeat(10)}`)];
            expect(countOf(items, 415)).to.equal(1);
            expect(countOf(items, 414)).to.equal(2);
        });

        it("should squeeze the last line of a paragraph, and one that ends with a line break, as Word does", () => {
            const items = [text("aa aa aa aa aa aa aa aa aa aa bbbb")];
            expect(countOf(items, 325)).to.equal(1);
            expect(countOf([...items, { type: "break", kind: "line", font: {} }, text("cc")], 325)).to.equal(2);
        });

        it("should squeeze only the spaces after a line's first word and its last tab, as Word does", () => {
            // 4 spaces before the words aren't squeezed, so "zzzzzzzzzz" goes past the end by 15, which the 2 spaces after
            // them would have to give 75% of their width for
            const indented = [text(`    ${"x".repeat(20)} ${"y".repeat(10)} ${"z".repeat(10)}`)];
            expect(countOf(indented, 455)).to.equal(1);
            expect(countOf(indented, 445)).to.equal(2);
            // The text after a tab starts at its stop, so the spaces before it can't make room
            const tabbed = [text("aa aa aa"), { type: "tab", font: {} } as const, text(`${"y".repeat(10)} ${"z".repeat(5)}`)];
            expect(layoutLines(tabbed, { width: 258, measurer: MEASURER, format: justified, defaultTabStop: 100 })).to.have.length(1);
            expect(layoutLines(tabbed, { width: 255, measurer: MEASURER, format: justified, defaultTabStop: 100 })).to.have.length(2);
        });

        it("should not squeeze en, em or ideographic spaces, and mark a line that only fits squeezed beside them", () => {
            // "bbbb" is 15 past the end of a line of 325, which its spaces could take, were they ordinary spaces: Word doesn't
            // squeeze a line whose spaces are all en, em or ideographic spaces (word-stops-tabs.ts JU1a to JU1c)
            const only = (space: number): readonly string[] =>
                layoutLines(
                    [text(["aa", "aa", "aa", "aa", "aa", "aa", "aa", "aa", "aa", "aa", "bbbb"].join(String.fromCodePoint(space)))],
                    {
                        width: 325,
                        measurer: MEASURER,
                        format: justified,
                    },
                ).map(({ text: one, unsupported }) => `${one.length} ${unsupported}`);
            expect(only(0x2002)).to.deep.equal(["30 undefined", "4 undefined"]);
            expect(only(0x2003)).to.deep.equal(["30 undefined", "4 undefined"]);
            expect(only(0x3000)).to.deep.equal(["30 undefined", "4 undefined"]);
            // Nor a four-per-em space, which Word hasn't been seen with
            expect(only(0x2005)[0]).to.equal(
                "30 a justified line that only fits squeezed at a four-per-em space, or at an en, em or ideographic space beside ordinary spaces",
            );
            // With the 5th space an en space, beside ordinary ones, whether Word squeezes them isn't known
            const items = [text(`aa aa aa aa aa${String.fromCodePoint(0x2002)}aa aa aa aa aa bbbb`)];
            const reasonsOf = (width: number, format: ParagraphFormat): readonly (string | undefined)[] =>
                layoutLines(items, { width, measurer: MEASURER, format }).map(({ unsupported }) => unsupported);
            const beside =
                "a justified line that only fits squeezed at a four-per-em space, or at an en, em or ideographic space beside ordinary spaces";
            expect(reasonsOf(325, justified)).to.deep.equal([beside, undefined]);
            expect(reasonsOf(325, { alignment: "distributed" })[0]).to.equal(beside);
            // 40 past the end of a line of 300, more than a quarter of all its spaces, it goes on the next line in any case, and
            // 24 past one of 316, more than a quarter of its ordinary spaces' 90 but not of all of them (word-stops-text2.ts JU4)
            expect(reasonsOf(300, justified)).to.deep.equal([undefined, undefined]);
            expect(reasonsOf(316, justified)).to.deep.equal([undefined, undefined]);
            // A left-aligned line isn't squeezed
            expect(reasonsOf(325, {})).to.deep.equal([undefined, undefined]);
            // Nor is an en space at the start of a line, before its first word
            expect(
                layoutLines([text(`${String.fromCodePoint(0x2002)}aa aa aa aa aa aa aa aa aa aa bbbb`)], {
                    width: 335,
                    measurer: MEASURER,
                    format: justified,
                }).map(({ unsupported }) => unsupported),
            ).to.deep.equal([undefined]);
        });

        it("should not break a word squeezed onto a line across lines", () => {
            // "bbbb" goes past the end of the line, but isn't longer than a line, so it is squeezed in whole
            expect(heightsOf([text("aa aa aa aa aa aa aa aa aa aa bbbb")], 325, { format: justified })).to.deep.equal([10]);
        });
    });

    describe("justified lines, in Word's paragraphs", () => {
        // Calibri 11, on lines 9026 twips wide, as `word-watertight-text.docx`, `word-watertight-stops.docx` and
        // `word-justify.docx` have them
        const CALIBRI = { font: "Calibri", size: 11 };
        const COURIER = { font: "Courier New", size: 11 };
        const WIDTH = 9026 / 20;
        const WORDS = "the survey of the coast was made in the summer by boat and on foot from the lighthouse to the river mouth".split(
            " ",
        );
        const prose = (count: number): string => Array.from({ length: count }, (_, index) => WORDS[(index * 7) % WORDS.length]).join(" ");

        /**
         * The last word of each line of a paragraph of runs, each of text in a font, in which a tab is "\t" and a line break
         * "\n"
         */
        const endingsOf = (runs: readonly (readonly [string, TextFont])[], format: ParagraphFormat = {}): readonly string[] => {
            const parts = runs.flatMap(([value, font]) =>
                value
                    .split(/( +|\t|\n)/)
                    .filter((part) => part.length > 0)
                    .map((part) => ({ part, font })),
            );
            const isWord = ({ part }: { readonly part: string }): boolean => !/^( +|\t|\n)$/.test(part);
            const words = parts.filter(isWord).map(({ part }) => part);
            const items = parts.flatMap(({ part, font }, index): readonly InlineItem[] => {
                if (part === "\t") {
                    return [{ type: "tab", font }];
                }
                if (part === "\n") {
                    return [{ type: "break", kind: "line", font }];
                }
                if (part.startsWith(" ")) {
                    return [{ type: "text", text: part, font }];
                }
                // A bookmark before each word, numbered, to find the line it is on
                return [
                    { type: "marker", name: String(parts.slice(0, index).filter(isWord).length) },
                    { type: "text", text: part, font },
                ];
            });
            const starts = layoutLines(items, { width: WIDTH, format }).map(({ markers }) => Math.min(...markers.map(Number)));
            return starts.map((_, index) => words[(starts[index + 1] ?? words.length) - 1]);
        };

        it("should squeeze one more word onto a justified or distributed line where Word does, and not where it doesn't (TX20)", () => {
            // Word's lines of TX20a and TX20b: the 4th squeezes "to" in, and the 6th doesn't squeeze "the", which would take
            // its spaces 13% narrower, against 11 points they'd stretch without it
            const squeezed = ["the", "of", "by", "to", "coast", "and", "river", "made", "on"];
            expect(endingsOf([[`TX20a ${prose(160)}`, CALIBRI]], { alignment: "justified" })).to.deep.equal(squeezed);
            expect(endingsOf([[`TX20b ${prose(160)}`, CALIBRI]], { alignment: "distributed" })).to.deep.equal(squeezed);
            // TX20c, left-aligned
            const left = ["the", "of", "by", "boat", "the", "was", "on", "mouth", "on"];
            expect(endingsOf([[`TX20c ${prose(160)}`, CALIBRI]])).to.deep.equal(left);
            expect(endingsOf([[`TX20c ${prose(160)}`, CALIBRI]], { alignment: "center" })).to.deep.equal(left);
        });

        it("should squeeze in a word whose line's spaces it takes 20% narrower, and not 24%, as Word does (SP18)", () => {
            // SP18's paragraphs: the character spacing of "survey" sets how far past the end of the line "coast" goes
            const filler = "the the made summer and from to mouth of was the boat foot lighthouse river";
            const paragraph = (share: number, spacing: number): readonly string[] =>
                endingsOf(
                    [
                        [`SP18 ${share} ${filler} `, CALIBRI],
                        ["survey", { ...CALIBRI, characterSpacing: spacing / 20 }],
                        [` coast ${prose(30)}`, CALIBRI],
                    ],
                    { alignment: "justified" },
                );
            for (const [share, spacing] of [
                [3, 30],
                [6, 35],
                [10, 22],
                [15, 29],
                [20, 36],
            ]) {
                expect(paragraph(share, spacing)).to.deep.equal(["coast", "survey", "was"]);
            }
            expect(paragraph(25, 43)).to.deep.equal(["survey", "the", "was"]);
            expect(paragraph(33, 54)).to.deep.equal(["survey", "the", "was"]);
        });

        it("should squeeze in the last word of a line where Word does in word-justify.docx", () => {
            const tail = " and on foot from the river";
            const line = "the survey of the coast was made in the summer by boat and on foot from the to";
            /** The first line's last word, of a justified paragraph with a right indent, in twips */
            const firstLineOf = (runs: readonly (readonly [string, TextFont])[], right: number): string =>
                endingsOf(runs, { alignment: "justified", indentRight: right / 20 })[0];
            const plain = (label: string, words: string, right: number): string =>
                firstLineOf([[`${label} ${words}${tail}`, CALIBRI]], right);
            // J01: 19 spaces and "a", which Word squeezes in by 5.3% of the spaces, when they'd stretch 2.22 times as
            // much without it, and not by 5.7%, against 1.99
            expect(plain("J01_08", `${line} a`, 1010)).to.equal("a");
            expect(plain("J01_09", `${line} a`, 1014)).to.equal("to");
            // J04: "coast", by 18.0% against 2.20, and not 19.9% against 1.89
            expect(plain("J04_05", `${line} coast`, 761)).to.equal("coast");
            expect(plain("J04_07", `${line} coast`, 780)).to.equal("to");
            // J03 and J07: by no more than a quarter, though the spaces would stretch far more without it
            const long = `${"lighthousekeeper".repeat(4)}lighthouse`;
            expect(plain("J03_04", `${long} a`, 1051)).to.equal("a");
            expect(plain("J03_05", `${long} a`, 1056)).to.equal(long);
            const short = "of the by in to and on of the by in to and on of the by in";
            expect(plain("J07_07", `${short} lighthouse`, 2641)).to.equal("lighthouse");
            expect(plain("J07_08", `${short} lighthouse`, 2669)).to.equal("in");
            // J09: 4 of the spaces in Courier New, which are squeezed in proportion to their widths
            const courier = (label: string, right: number): string =>
                firstLineOf(
                    [
                        [`${label} the survey of the coast`, CALIBRI],
                        [" was made in ", COURIER],
                        [`the summer by boat and on foot from the to coast${tail}`, CALIBRI],
                    ],
                    right,
                );
            expect(courier("J09_05", 265)).to.equal("coast");
            expect(courier("J09_07", 284)).to.equal("to");
            // J10, J11: the last line of a paragraph, and one before a line break
            expect(firstLineOf([[`J10_02 ${line} coast`, CALIBRI]], 709)).to.equal("coast");
            expect(firstLineOf([[`J11_02 ${line} coast\nand on foot`, CALIBRI]], 709)).to.equal("coast");
            // J15: only the 3 spaces after the tab are squeezed, so "coast" goes in by 5% of its width, and not 10%
            const tabbed = "J15_01 the survey of the coast was made in the summer by boat and\tlighthouse river mouth coast";
            expect(firstLineOf([[`${tabbed}${tail}`, CALIBRI]], 1)).to.equal("coast");
            expect(firstLineOf([[`${tabbed.replace("J15_01", "J15_02")}${tail}`, CALIBRI]], 25)).to.equal("mouth");
            // J18: the 8 spaces at the start aren't squeezed
            expect(plain("        J18_01", "the survey of the coast was made in the summer coast", 3128)).to.equal("coast");
        });

        it("should squeeze in the last word of a line where Word does in word-justify2.docx", () => {
            const tail = " the survey of the coast";
            const line = "the survey of the coast was made in the summer by boat and on foot from the to";
            const long = `${"lighthousekeeper".repeat(4)}lighthouse`;
            /** The first line's last word, of a paragraph with a right indent, in twips */
            const firstLineOf = (label: string, words: string, right: number, alignment: ParagraphFormat["alignment"]): string =>
                endingsOf([[`${label} ${words}${tail}`, CALIBRI]], { alignment, indentRight: right / 20 })[0];
            const distributed = (label: string, words: string, right: number): string => firstLineOf(label, words, right, "distributed");
            // K01 to K04 and K07: distributed lines squeeze in less than justified ones, as their letters could stretch too
            expect(distributed("K01_06", `${line} a`, 947)).to.equal("a");
            expect(distributed("K01_09", `${line} a`, 959)).to.equal("to");
            const longWords = "lighthousekeepers circumnavigation hydrographically cartographers surveyorship";
            expect(distributed("K02_03", `${longWords} a`, 898)).to.equal("a");
            expect(distributed("K02_06", `${longWords} a`, 910)).to.equal("surveyorship");
            expect(distributed("K03_01", `${long} a`, 991)).to.equal("a");
            expect(distributed("K03_04", `${long} a`, 1006)).to.equal(long);
            expect(distributed("K04_05", `${line} coast`, 670)).to.equal("coast");
            expect(distributed("K04_08", `${line} coast`, 698)).to.equal("to");
            const short = "of the by in to and on of the by in to and on of the by in";
            expect(distributed("K07_10", `${short} lighthouse`, 2578)).to.equal("lighthouse");
            expect(distributed("K07_12", `${short} lighthouse`, 2615)).to.equal("in");
            // K08, K09: Latin text justified for Thai or with a low kashida is squeezed as justified text is
            expect(firstLineOf("K08_10", `${line} coast`, 717, "thaiDistributed")).to.equal("coast");
            expect(firstLineOf("K08_13", `${line} coast`, 745, "thaiDistributed")).to.equal("to");
            expect(firstLineOf("K09_10", `${line} coast`, 717, "lowKashida")).to.equal("coast");
            expect(firstLineOf("K09_13", `${line} coast`, 745, "lowKashida")).to.equal("to");
            // K10 to K12: a word and a space, then the next word. The justified line is squeezed by up to a quarter of the
            // space, and the distributed one less, as its first word's letters could stretch
            const one = (label: string): string => `${label}${"lighthousekeeper".repeat(5)}`;
            expect(endingsOf([[`${one("K10_05")} a${tail}`, CALIBRI]], { alignment: "justified", indentRight: 425 / 20 })[0]).to.equal("a");
            expect(endingsOf([[`${one("K10_08")} a${tail}`, CALIBRI]], { alignment: "justified", indentRight: 431 / 20 })[0]).to.equal(
                one("K10_08"),
            );
            expect(endingsOf([[`${one("K12_02")} a${tail}`, CALIBRI]], { alignment: "distributed", indentRight: 419 / 20 })[0]).to.equal(
                "a",
            );
            expect(endingsOf([[`${one("K12_05")} a${tail}`, CALIBRI]], { alignment: "distributed", indentRight: 425 / 20 })[0]).to.equal(
                one("K12_05"),
            );
        });
    });
});

describe("layoutLines with automatic hyphenation", () => {
    // cspell:ignore extraordinar bbbbcccc meerrrrrii meerrriiii mrrrrri merrrriiiiii eeeerrriii unbeliev mmmii mmeer mmmeeiii unbelieva mmmerr mmmme meeeeiii mmeerrrr
    const HYPHENATED = "a word Word may hyphenate, whose parts the layout can't know";

    /** Each line's text, and why the layout stops there, when it does */
    const linesOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): readonly string[] =>
        layoutLines(items, { width: 100, measurer: MEASURER, hyphenation: {}, ...options }).map(({ text: line, unsupported }) =>
            unsupported === undefined ? line : `${line}| ${unsupported}`,
        );

    it("should stop at a line Word may end with a part of the next word and a hyphen, as which parts its dictionary has isn't known", () => {
        // "bb-" fits in the 50 points left after "aaaa "
        expect(linesOf([text("aaaa bbbbbbbb")])).to.deep.equal([`aaaa | ${HYPHENATED}`, "bbbbbbbb"]);
        // Without hyphenation, the word goes to the next line whole
        expect(linesOf([text("aaaa bbbbbbbb")], { hyphenation: undefined })).to.deep.equal(["aaaa ", "bbbbbbbb"]);
    });

    it("should leave a word whole where its first two letters and a hyphen don't fit on the line, as Word leaves two at least", () => {
        // 20 points are left after "aaaaaaa ", and "bb-" is 30
        expect(linesOf([text("aaaaaaa bbbbbbbb")])).to.deep.equal(["aaaaaaa ", "bbbbbbbb"]);
        expect(linesOf([text("aaaaaa bbbbbbbb")])).to.deep.equal([`aaaaaa | ${HYPHENATED}`, "bbbbbbbb"]);
    });

    it("should leave words of fewer than five letters whole, and numbers, which have none", () => {
        expect(linesOf([text("aaaaaa bbbb")])).to.deep.equal(["aaaaaa ", "bbbb"]);
        expect(linesOf([text("aaaaaa bbbbb")])).to.deep.equal([`aaaaaa | ${HYPHENATED}`, "bbbbb"]);
        expect(linesOf([text("aaaaaa 1234567890")])).to.deep.equal(["aaaaaa ", "1234567890"]);
        expect(linesOf([text("aaaaaa (1234.56)")])).to.deep.equal(["aaaaaa ", "(1234.56)"]);
        expect(linesOf([text("aaaaaa ab12345cd")])).to.deep.equal(["aaaaaa ", "ab12345cd"]);
    });

    it("should leave text Word doesn't hyphenate whole, and take any word in a language Word hasn't shown as one it may hyphenate", () => {
        const whole: InlineItem = { type: "text", text: "bbbbbbbb", font: {}, hyphenation: "none" };
        expect(linesOf([text("aaaaaa "), whole])).to.deep.equal(["aaaaaa ", "bbbbbbbb"]);
        // In part, by the part Word may hyphenate
        expect(linesOf([text("aaaaaa "), { ...whole, text: "bbbb" }, text("cccc")])).to.deep.equal([`aaaaaa | ${HYPHENATED}`, "bbbbcccc"]);
        // Another language's dictionary may break a word of two letters or more after its first, with room for "b-"
        const other: InlineItem = { type: "text", text: "bbb", font: {}, hyphenation: "unknown" };
        expect(linesOf([text("aaaaaaa "), other])).to.deep.equal([`aaaaaaa | ${HYPHENATED}`, "bbb"]);
        expect(linesOf([text("aaaaaaa "), { ...other, text: "b12" }])).to.deep.equal(["aaaaaaa ", "b12"]);
        expect(linesOf([text("aaaaaaaa "), other])).to.deep.equal(["aaaaaaaa ", "bbb"]);
    });

    it("should leave words in capitals whole when the document says so, but not those in small capitals", () => {
        expect(linesOf([text("aaaaaa BBBBBBB")], { hyphenation: { capitalsWhole: true } })).to.deep.equal(["aaaaaa ", "BBBBBBB"]);
        expect(linesOf([text("aaaaaa BB-12")], { hyphenation: { capitalsWhole: true } })).to.deep.equal(["aaaaaa ", "BB-12"]);
        expect(linesOf([text("aaaaaa Bbbbbbb")], { hyphenation: { capitalsWhole: true } })).to.deep.equal([
            `aaaaaa | ${HYPHENATED}`,
            "Bbbbbbb",
        ]);
        expect(linesOf([text("aaaaaa BBBBBBB")])).to.deep.equal([`aaaaaa | ${HYPHENATED}`, "BBBBBBB"]);
        const small: InlineItem = { type: "text", text: "BBBBBB", font: { size: 8, lineSize: 10 } };
        expect(linesOf([text("aaaaaa B"), small], { hyphenation: { capitalsWhole: true } })).to.deep.equal([
            `aaaaaa | ${HYPHENATED}`,
            "BBBBBBB",
        ]);
    });

    it("should stop at a word with soft hyphens Word may break where its dictionary does, and break one it leaves whole at them", () => {
        // word-hyphenation.docx HY8a and HY8b: Word broke "extra¬ordinarily" as "extraordinar-" and "ex-", past and before
        // its soft hyphen, with automatic hyphenation
        const soft = (hyphenation?: "none"): readonly InlineItem[] => [
            text("aaaa "),
            { type: "text", text: "bbb", font: {}, ...(hyphenation ? { hyphenation } : {}) },
            { type: "softHyphen", font: {} },
            { type: "text", text: "bbbbbbb", font: {}, ...(hyphenation ? { hyphenation } : {}) },
        ];
        expect(linesOf(soft())).to.deep.equal([`aaaa bbb| ${HYPHENATED}`, "bbbbbbb"]);
        expect(linesOf(soft("none"))).to.deep.equal(["aaaa bbb", "bbbbbbb"]);
        expect(linesOf(soft(), { hyphenation: undefined })).to.deep.equal(["aaaa bbb", "bbbbbbb"]);
    });

    it("should lay out a paragraph that suppresses hyphenation as without it", () => {
        expect(linesOf([text("aaaa bbbbbbbb")], { format: { suppressAutoHyphens: true } })).to.deep.equal(["aaaa ", "bbbbbbbb"]);
        expect(linesOf([text("aaaa bbbbbbbb")], { format: { suppressAutoHyphens: false } })).to.deep.equal([
            `aaaa | ${HYPHENATED}`,
            "bbbbbbbb",
        ]);
    });

    it("should stop at a word longer than its line, which Word may hyphenate rather than break after the last character that fits", () => {
        expect(linesOf([text("bbbbbbbbbbbbbbb")])).to.deep.equal([`bbbbbbbbbb| ${HYPHENATED}`, "bbbbb"]);
        expect(linesOf([text("bbbbbbbbbbbbbbb")], { format: { suppressAutoHyphens: true } })).to.deep.equal(["bbbbbbbbbb", "bbbbb"]);
    });

    describe("in Word's probes", () => {
        // scripts/layout-probes/word-hyphenation.ts, in Calibri 11 in lines of 9026 twips, with the parts each line ends
        // with in Word's PDF
        const font = { font: "Calibri", size: 11 };
        const HEAD = "the sea was calm and we set out at dawn to see the old fort on the hill by";
        const probe = (
            start: string,
            word: string,
            wordFont: TextFont = font,
            alignment?: ParagraphFormat["alignment"],
        ): readonly string[] =>
            layoutLines(
                [
                    { type: "text", text: `${start} `, font },
                    { type: "text", text: word, font: wordFont },
                    { type: "text", text: " and so on to the end", font },
                ],
                { width: 9026 / 20, format: alignment === undefined ? {} : { alignment }, hyphenation: { capitalsWhole: true } },
            ).map(({ text: line, unsupported }) => `${line.trim().split(" ").at(-1)}${unsupported === undefined ? "" : " | stops"}`);

        it("should lay out the lines Word leaves the word after whole, and stop at those it may hyphenate", () => {
            // HY3a: 13.9 points left, too few for "un-", which Word leaves "unbelievably" whole in, as it does with room for "u-"
            expect(probe(`HY3a ${HEAD} the bay meerrrrrii`, "unbelievably")).to.deep.equal(["meerrrrrii", "end"]);
            // HY3b: 16 points, which Word ends with "un-", short of the default hyphenation zone, which it doesn't keep
            expect(probe(`HY3b ${HEAD} the bay meerrriiii`, "unbelievably")).to.deep.equal(["meerrriiii | stops", "end"]);
            // HY3f: 10 points, room for "a-" but not "ab-"
            expect(probe(`HY3f ${HEAD} the bay and mrrrrri`, "abandonment")).to.deep.equal(["mrrrrri", "end"]);
            // HY5a and HY5d: room for "in-" and "un-": Word leaves "into" whole, and ends with "un-" of "under"
            expect(probe(`HY5a ${HEAD} the bay merrrriiiiii`, "into")).to.deep.equal(["merrrriiiiii", "end"]);
            expect(probe(`HY5d ${HEAD} the bay eeeerrriii`, "under")).to.deep.equal(["eeeerrriii | stops", "end"]);
            // HY6a and HY7a: room for half the number, and for "unbeliev-" in text not checked for spelling
            expect(probe(`HY6a ${HEAD} the mmmii`, "1234567890123")).to.deep.equal(["mmmii", "end"]);
            expect(probe(`HY7a ${HEAD} the mmeer`, "unbelievably", font)).to.deep.equal(["mmeer | stops", "end"]);
        });

        it("should leave a word whole on a justified line that only fits its part squeezed, and squeeze one in rather than hyphenate it", () => {
            // HY4a: 13 points left, which Word doesn't squeeze the spaces to fit "un-" in
            expect(probe(`HY4a ${HEAD} the bay mmmeeiii`, "unbelievably", font, "justified")).to.deep.equal(["mmmeeiii", "end"]);
            // HY4b: "unbelievably" squeezed in, where "unbelieva-" fits without squeezing; left-aligned, Word ends with that
            // (HY4c)
            expect(probe(`HY4b ${HEAD} mmmerr`, "unbelievably", font, "justified")).to.deep.equal(["unbelievably", "end"]);
            expect(probe(`HY4c ${HEAD} mmmme`, "unbelievably")).to.deep.equal(["mmmme | stops", "end"]);
            // Word hasn't been seen choosing between squeezing and hyphenating on a distributed line
            expect(probe(`HY4b ${HEAD} mmmerr`, "unbelievably", font, "distributed")).to.deep.equal(["unbelievably | stops", "end"]);
        });

        it("should leave words in capitals whole, typed so or shown so, but not those with only their first letter a capital", () => {
            // HY10a and HY10b, with doNotHyphenateCaps: room for "UNBELIEV-"; and HY10c, without it, which Word ends with
            // "Unbeliev-"
            expect(probe(`HY10a ${HEAD} meeeeiii`, "UNBELIEVABLY")).to.deep.equal(["meeeeiii", "end"]);
            expect(probe(`HY10c ${HEAD} mmeerrrr`, "Unbelievably")).to.deep.equal(["mmeerrrr | stops", "end"]);
        });
    });
});

describe("measureContentWidths with automatic hyphenation", () => {
    const widthsOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): ContentWidths =>
        measureContentWidths(items, { measurer: MEASURER, hyphenation: {}, ...options });

    it("should say when Word may hyphenate a word as wide as the narrowest the paragraph can be, as Word sizes columns to its parts", () => {
        expect(widthsOf([text("aa bbbbbbbb")])).to.deep.equal({ min: 80, max: 110, hyphenated: true });
        // A word Word leaves whole as wide, or wider
        expect(widthsOf([text("aa bbbbbbbb 12345678")])).to.deep.equal({ min: 80, max: 200 });
        expect(widthsOf([text("bbbbbbbb"), { type: "box", width: 80, height: 10 }])).to.deep.equal({ min: 80, max: 160 });
        expect(widthsOf([text("bbbbbbbb 123456789")])).to.deep.equal({ min: 90, max: 180 });
        // Words Word leaves whole, and without hyphenation
        expect(widthsOf([text("aa bbbb")])).to.deep.equal({ min: 40, max: 70 });
        expect(widthsOf([text("aa bbbbbbbb")], { format: { suppressAutoHyphens: true } })).to.deep.equal({ min: 80, max: 110 });
        expect(widthsOf([text("aa bbbbbbbb")], { hyphenation: undefined })).to.deep.equal({ min: 80, max: 110 });
    });
});

describe("a box that Word may break where it doesn't fit", () => {
    const box = (width: number): InlineItem => ({ type: "box", width, height: 10, unbroken: "an equation that doesn't fit on its line" });
    const unsupportedOf = (items: readonly InlineItem[], width = 100): readonly (string | undefined)[] =>
        layoutLines(items, { width, measurer: MEASURER }).map(({ unsupported }) => unsupported);

    it("should lay out one that fits in the room left on its line", () => {
        expect(unsupportedOf([text("aaaa "), box(50)])).to.deep.equal([undefined]);
    });

    it("should stop where one doesn't fit in the room left on its line, or on a line of its own", () => {
        expect(unsupportedOf([text("aaaa "), box(60)])).to.deep.equal(["an equation that doesn't fit on its line", undefined]);
        expect(unsupportedOf([box(110)])).to.deep.equal(["an equation that doesn't fit on its line"]);
    });
});

describe("the height of a line of fonts and pictures of different heights", () => {
    // In twips, laid out with the width tables, as Word's PDFs of scripts/layout-probes/word-watertight-text.ts (TX) and
    // word-mixed-heights.ts (MH) measure them, which give each to within about 0.1 twips over a page of lines
    const linesOf = (items: readonly InlineItem[], options: Omit<LineLayoutOptions, "width"> = {}): readonly LaidOutLine[] =>
        layoutLines(items, { width: 500, markFont: CALIBRI, ...options });
    const twipsOf = (items: readonly InlineItem[], options: Omit<LineLayoutOptions, "width"> = {}): readonly number[] =>
        linesOf(items, options).map(({ height }) => height * 20);
    const CALIBRI = { font: "Calibri", size: 11 };
    const word = (value: string, font: TextFont = CALIBRI): InlineItem => ({ type: "text", text: value, font });
    /** A picture this many points tall, in a run of Calibri 11 unless another font is given */
    const picture = (points: number, font: TextFont = CALIBRI): InlineItem => ({ type: "box", width: 20, height: points, font });
    const multiple = (lines: number): Omit<LineLayoutOptions, "width"> => ({
        format: { lineSpacing: { rule: "multiple", multiple: lines } },
    });
    const courier = { font: "Courier New", size: 11 };

    it("should make a line with a box that takes room as text does as tall as its ascent and descent with the text's", () => {
        // An equation of Cambria Math at 11 points: 1946 and 455 of its 2048 units above and below its baseline
        // (`word-equations.docx` EQ2)
        const equation: InlineItem = { type: "box", width: 20, height: (1946 / 2048) * 11, descent: (455 / 2048) * 11 };
        // Alone, it is a line of Cambria Math, 257.92 twips, without its paragraph mark's Calibri (EQ2c)
        expect(twipsOf([equation])[0]).to.be.closeTo(257.92, 0.01);
        // Beside Calibri, whose ascent and descent are deeper, it leaves the line as Calibri's (EQ2a)
        expect(twipsOf([word("a "), equation])[0]).to.be.closeTo(268.55, 0.01);
        // Beside Courier New, whose ascent is less, its ascent and Courier New's descent make the line
        const descent = DEFAULT_MEASURER.measureDescent!(courier);
        expect(twipsOf([word("a ", courier), equation])[0]).to.be.closeTo(((1946 / 2048) * 11 + descent) * 20, 0.01);
        // A box's descent is deepest where it is deeper than the text's: a box 5 points below a line of 10 makes it 15
        expect(heightsOf([text("a "), { type: "box", width: 10, height: 2, descent: 5 }])).to.deep.equal([15]);
    });

    it("should make a line of two fonts as tall as the tallest ascent and the deepest descent, as Word does", () => {
        // Calibri's ascent and Courier New's descent: 275.52 to 275.56 in Word, where each alone is 268.55 and 249.2 (TX9a)
        expect(twipsOf([word("TX9a 1 "), word("mono", courier)])[0]).to.be.closeTo(275.54, 0.02);
        // Times New Roman and Arial have shorter ascents and descents than Calibri (TX9b, TX9c)
        expect(twipsOf([word("TX9b 1 "), word("serif", { font: "Times New Roman", size: 11 })])[0]).to.be.closeTo(268.55, 0.01);
        expect(twipsOf([word("TX9c 1 "), word("arial", { font: "Arial", size: 11 })])[0]).to.be.closeTo(268.55, 0.01);
        // The line gap of Arial and Times New Roman is above their text: 272.37 to 272.42, and 493.53 to 493.6 at 20 points
        // (MH2a, MH2b)
        expect(twipsOf([word("MH2a 1 ", { font: "Arial", size: 11 }), word("mono", courier)])[0]).to.be.closeTo(272.4, 0.03);
        expect(
            twipsOf([word("MH2b 1 ", { font: "Times New Roman", size: 20 }), word("mono", { font: "Courier New", size: 20 })])[0],
        ).to.be.closeTo(493.57, 0.04);
        // East Asian fonts too, with their own descents: 313.92 to 314, and 300.94 to 300.98 (MH6a, MH6c)
        // cspell:disable-next-line
        expect(
            twipsOf([word("MH6a 1 ", { font: "MS Mincho", size: 12 }), word("mono", { font: "Courier New", size: 12 })])[0],
        ).to.be.closeTo(313.96, 0.05);
        expect(
            twipsOf([word("MH6c 1 ", { font: "Yu Mincho", size: 10.5 }), word("sans", { font: "Calibri", size: 10.5 })])[0],
        ).to.be.closeTo(300.96, 0.05);
    });

    it("should stand a picture on the baseline, with the text's descent below it, as Word does", () => {
        // 30 points and Calibri 11's descent: 659.04 to 659.2 in Word, where docx/layout had the picture's 600 (TX8b)
        expect(twipsOf([word("TX8b 1 "), picture(30)])[0]).to.be.closeTo(659.08, 0.05);
        // And Times New Roman 10's: 642.96 to 643.44 (TX8g)
        expect(twipsOf([word("TX8g 1 ", { font: "Times New Roman", size: 10 }), picture(30)])[0]).to.be.closeTo(643.26, 0.01);
        // Alone, it is the picture: 23 lines of 600 on a page (TX8a, and 599.65 to 600.25 in MH3e)
        expect(twipsOf([picture(30)])[0]).to.be.closeTo(600, 0.01);
        // A picture shorter than the text's ascent leaves the line as it is (TX8f)
        expect(twipsOf([word("TX8f 1 "), picture(6)])[0]).to.be.closeTo(268.55, 0.01);
        // Alone, a picture shorter than its run's line is as tall as that line: 268.54 to 268.59 (MH7a, MH7b)
        expect(twipsOf([picture(6)])[0]).to.be.closeTo(268.55, 0.01);
        expect(twipsOf([picture(12)])[0]).to.be.closeTo(268.55, 0.01);
        // East Asian text's descent: 69.26 to 69.86 below a picture beside MS Mincho 12 (MH5)
        expect(twipsOf([word("MH5 1-1 ", { font: "MS Mincho", size: 12 }), picture(30)])[0]).to.be.closeTo(669.36, 0.3);
    });

    it("should space a line by the tallest of its fonts' own lines, as Word does", () => {
        // Exactly 12 points, and at least 12 points (TX8d, TX8e)
        expect(twipsOf([word("TX8d 1 "), picture(30)], { format: { lineSpacing: { rule: "exact", height: 12 } } })).to.deep.equal([240]);
        expect(twipsOf([word("TX8e 1 "), picture(30)], { format: { lineSpacing: { rule: "atLeast", height: 12 } } })[0]).to.be.closeTo(
            659.08,
            0.01,
        );
        // At least 13.5 points over a line of two fonts taller than either: 275.52 to 275.56 (MH1e)
        expect(
            twipsOf([word("MH1e 1 "), word("mono", courier)], { format: { lineSpacing: { rule: "atLeast", height: 13.5 } } })[0],
        ).to.be.closeTo(275.54, 0.02);
        // 1.15 lines over a picture add 0.15 of Calibri's 268.55, below the text: 699.32 to 699.42 (TX8c)
        const [tx8c] = linesOf([word("TX8c 1 "), picture(30)], multiple(1.15));
        expect(tx8c.height * 20).to.be.closeTo(699.37, 0.05);
        expect(tx8c.spacingBelow! * 20).to.be.closeTo(40.28, 0.01);
        // 1.5 lines of Calibri with Courier New add half of Calibri's line, not of theirs: 409.78 to 409.82, and 0.8 lines take
        // a fifth of it away: 221.82 to 221.83 (MH1b, MH1d)
        expect(twipsOf([word("MH1b 1 "), word("mono", courier)], multiple(1.5))[0]).to.be.closeTo(409.81, 0.02);
        const [mh1d] = linesOf([word("MH1d 1 "), word("mono", courier)], multiple(0.8));
        expect(mh1d.height * 20).to.be.closeTo(221.83, 0.01);
        expect(mh1d.spacingBelow).to.equal(undefined);
        // Times New Roman 10 with Courier New 10 add half of Times New Roman's 230: 361.76 to 361.8 (MH2c)
        const times = { font: "Times New Roman", size: 10 };
        expect(twipsOf([word("MH2c 1 ", times), word("mono", { ...courier, size: 10 })], multiple(1.5))[0]).to.be.closeTo(361.78, 0.02);
        // A picture's run counts its font: alone at 1.15 and 0.8 lines, 640.13 to 640.39 and 546.14 to 546.34, and beside
        // Calibri 8, 777.12 to 777.6, from the run's Calibri 11, though the mark is Times New Roman 10 (MH3a, MH3c, MH4e, MH3d)
        expect(twipsOf([picture(30)], multiple(1.15))[0]).to.be.closeTo(640.28, 0.05);
        expect(twipsOf([picture(30)], multiple(0.8))[0]).to.be.closeTo(546.29, 0.05);
        expect(twipsOf([word("MH4e 1 ", { font: "Calibri", size: 8 }), picture(30)], multiple(1.5))[0]).to.be.closeTo(777.25, 0.2);
        expect(twipsOf([picture(30)], { ...multiple(1.5), markFont: times })[0]).to.be.closeTo(734.28, 0.4);
        // Tabs and breaks are text in their fonts
        expect(twipsOf([word("a"), { type: "tab", font: courier }, word("b")])[0]).to.be.closeTo(275.54, 0.02);
        expect(twipsOf([word("a"), { type: "break", kind: "line", font: courier }, word("b")])).to.have.length(2);
        expect(twipsOf([word("a"), { type: "break", kind: "line", font: courier }, word("b")])[0]).to.be.closeTo(275.54, 0.02);
    });

    it("should not count a larger mark in a line of only pictures, single spaced, and stop at one with multiple spacing", () => {
        const larger = { font: "Calibri", size: 16 };
        // As tall as the picture's run, not the mark (word-stops-text.ts PB8)
        const [single] = linesOf([picture(12)], { markFont: larger });
        expect([single.unsupported, single.height]).to.deep.equal([undefined, linesOf([picture(12)])[0].height]);
        // The share of the mark's line or of the run's that the spacing adds hasn't been seen
        expect(linesOf([picture(30)], { ...multiple(1.5), markFont: larger })[0].unsupported).to.equal(
            "a picture alone in a line of a paragraph whose mark is larger, with multiple line spacing",
        );
        // A picture taller than the mark's line, single spaced, is itself either way, and beside text the mark doesn't count
        expect(linesOf([picture(30)], { markFont: larger })[0].unsupported).to.equal(undefined);
        expect(linesOf([word("a"), picture(6)], { markFont: larger })[0].unsupported).to.equal(undefined);
    });
});

describe("the height of a line with a list number, as Word lays it out", () => {
    // A line is 1.2 times its font's size, a fifth of which is below the baseline
    const measurer: TextMeasurer = {
        measureWidth: (value) => [...value].length * 10,
        measureLineHeight: ({ size = 10 }) => size * 1.2,
        measureDescent: ({ size = 10, font }) => size * (font === "Deep" ? 0.4 : 0.2),
    };
    const listNumber = (size: number, font?: string): InlineItem => ({
        type: "text",
        text: "1.",
        font: { size, listNumber: "number", ...(font ? { font } : {}) },
    });
    const tab = (size: number): InlineItem => ({ type: "tab", font: { size, listNumber: "separator" } });
    const heightOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): LaidOutLine =>
        layoutLines(items, { width: 500, measurer, markFont: { size: 20 }, ...options })[0];

    it("should count a number's ascent but not its descent, nor its line, nor the tab after it (word-lists.docx LF1, LF2)", () => {
        // A 20-point number beside 10-point text: its ascent, 20, and the text's descent, 2
        expect(heightOf([listNumber(20), tab(20), text("b")]).height).to.be.closeTo(22, 1e-9);
        // A number of a font deeper below its baseline than the text's leaves the line as it is
        expect(heightOf([listNumber(10, "Deep"), tab(10), text("b")]).height).to.be.closeTo(12, 1e-9);
    });

    it("should make a line of only a number as tall as its mark, with the number's ascent where it is taller (stops2 LI7a, LI7b)", () => {
        expect(heightOf([listNumber(20), tab(20)])).to.deep.include({ height: 24 });
        // A number of 20 points over a mark of 10, its ascent and the mark's descent; and of 10 points over a mark of 20, the
        // mark's line
        expect(heightOf([listNumber(20), tab(20)], { markFont: { size: 10 } })).to.deep.include({ height: 22 });
        expect(heightOf([listNumber(10), tab(10)])).to.deep.include({ height: 24 });
        // A number of a font deeper below its baseline than the mark's, over a mark of 10 points, is the mark's descent
        expect(heightOf([listNumber(20, "Deep"), tab(20)], { markFont: { size: 10 } })).to.deep.include({ height: 18 });
        expect(heightOf([listNumber(20), tab(20)], { markFont: { size: 10 } }).unsupported).to.equal(undefined);
        // Its emphasis marks take their room over it, a quarter of the line
        const marked: InlineItem = { type: "text", text: "1.", font: { size: 20, listNumber: "number", emphasis: "above" } };
        expect(heightOf([marked, tab(20)])).to.deep.include({ height: 30 });
        // With the paragraph's text on the lines after it, whether the mark counts isn't known where it differs
        const before = (markSize: number): string | undefined =>
            heightOf([listNumber(20), tab(20), text("bbbbbbbbb")], { width: 100, markFont: { size: markSize } }).unsupported;
        expect(before(10)).to.equal(
            "a line of only a list number of another size or font than its paragraph's mark, before the paragraph's text",
        );
        expect(before(20)).to.equal(undefined);
    });

    it("should add multiple line spacing's share of the text's line below a number taller than the text (stops2 LI5a, LI5b)", () => {
        const spacing = (multiple: number): Partial<LineLayoutOptions> => ({
            format: { lineSpacing: { rule: "multiple", multiple } },
        });
        // The number's ascent, 20, the text's descent, 2, and half of the text's line, 6
        expect(heightOf([listNumber(20), tab(20), text("b")], spacing(1.5)).height).to.be.closeTo(28, 1e-9);
        expect(heightOf([listNumber(20), tab(20), text("b")], spacing(2)).height).to.be.closeTo(34, 1e-9);
        expect(heightOf([listNumber(20), tab(20), text("b")], spacing(1.5)).unsupported).to.equal(undefined);
        // A line of only a number is as tall as text of its mark's font
        expect(heightOf([listNumber(20), tab(20)], spacing(1.5))).to.deep.include({ height: 36 });
        // A number beside a picture is text beside it, and its line as tall as the number above the baseline and the picture
        expect(heightOf([listNumber(10), tab(10), { type: "box", width: 5, height: 5, font: { size: 10 } }])).to.deep.include({
            height: 12,
        });
    });
});

describe("layoutLines with run formatting, as Word lays it out", () => {
    // Lines in twips, from scripts/layout-probes/word-run-formatting.ts unless another probe is named: Word's are the
    // range of heights that put a page of its lines where they are on its grid
    const CALIBRI = { font: "Calibri", size: 11 };
    const linesOf = (items: readonly InlineItem[], options: Omit<LineLayoutOptions, "width"> = {}): readonly LaidOutLine[] =>
        layoutLines(items, { width: 451.3, markFont: CALIBRI, ...options });
    const twipsOf = (items: readonly InlineItem[], options: Omit<LineLayoutOptions, "width"> = {}): number =>
        linesOf(items, options)[0].height * 20;
    const word = (value: string, font: TextFont = CALIBRI): InlineItem => ({ type: "text", text: value, font });
    /** A line of Calibri 11 with a word in this formatting after its label */
    const lineWith = (font: TextFont, label = "RF 1 x "): readonly InlineItem[] => [word(label), word("word", { ...CALIBRI, ...font })];
    const multiple = (lines: number): Omit<LineLayoutOptions, "width"> => ({
        format: { lineSpacing: { rule: "multiple", multiple: lines } },
    });
    const boxed = (room: number, key = "single"): TextFont => ({ border: { room, key } });

    it("should make superscript and subscript take up the line of their run's size", () => {
        // Calibri 11 with a digit in superscript, drawn at 7 points: 268.55 (TX1a), and Calibri 20 with one at 13: 488.0 to
        // 488.64 (RF2k)
        expect(twipsOf(lineWith({ size: 7, lineSize: 11 }))).to.be.closeTo(268.55, 0.01);
        expect(
            twipsOf([word("RF2k 1 x ", { font: "Calibri", size: 20 }), word("2", { font: "Calibri", size: 13, lineSize: 20 })]),
        ).to.be.closeTo(488.28, 0.01);
        // Alone, and a 20-point superscript in a line of Calibri 11, which is Calibri 20's line: 268.11 to 268.8, and 488.23
        // to 488.64 (RF3a, RF3c)
        expect(twipsOf([word("RF3a 1 superscript only", { ...CALIBRI, size: 7, lineSize: 11 })])).to.be.closeTo(268.55, 0.01);
        expect(twipsOf(lineWith({ size: 13, lineSize: 20 }))).to.be.closeTo(488.28, 0.01);
    });

    it("should raise and lower text's ascent and descent with it", () => {
        // 7 points raised 3 in a line of Calibri 11: 268.11 to 268.8 (RF5a)
        expect(twipsOf(lineWith({ size: 7, raise: 3 }))).to.be.closeTo(268.55, 0.01);
        // Courier New 11 raised 2: 282.0 to 282.4 (RF5b); 7 points lowered 3: 306.67 to 307.73 (RF5c)
        expect(twipsOf(lineWith({ font: "Courier New", raise: 2 }))).to.be.closeTo(282.2, 0.2);
        expect(twipsOf(lineWith({ size: 7, raise: -3 }))).to.be.closeTo(307.2, 0.53);
        // Times New Roman 10 raised 6, its line gap too: 365.76 to 366.4 (RF5e)
        expect(twipsOf(lineWith({ font: "Times New Roman", size: 10, raise: 6 }))).to.be.closeTo(366.08, 0.32);
        // Raised 6 and lowered 6: 388.11 to 388.8 and 388.27 to 389.33 (RF5f, RF5g), and a superscript digit raised 6 (RF5l)
        expect(twipsOf(lineWith({ raise: 6 }))).to.be.closeTo(388.55, 0.01);
        expect(twipsOf(lineWith({ raise: -6 }))).to.be.closeTo(388.55, 0.01);
        expect(twipsOf(lineWith({ size: 7, lineSize: 11, raise: 6 }))).to.be.closeTo(388.55, 0.01);
        // At 1.5 lines, half of Calibri's own line below the text: 522.24 to 523.2 (RF5d); at least 18 points, the line as it
        // is (RF5m)
        const [rf5d] = linesOf(lineWith({ raise: 6 }), multiple(1.5));
        expect(rf5d.height * 20).to.be.closeTo(522.83, 0.01);
        expect(rf5d.spacingBelow! * 20).to.be.closeTo(134.28, 0.01);
        expect(twipsOf(lineWith({ raise: 6 }), { format: { lineSpacing: { rule: "atLeast", height: 18 } } })).to.be.closeTo(388.55, 0.01);
        // An empty paragraph whose mark is raised 6 is Calibri's ascent and the raise, with nothing below: 329.3 (RF8a)
        expect(twipsOf([], { markFont: { ...CALIBRI, raise: 6 } })).to.be.closeTo(329.5, 0.5);
    });

    it("should give emphasis marks a quarter of their line, over the text or under it", () => {
        // 67.14 more in a line of Calibri 11: 335.69 (TX15), and of Calibri 10, 12 and 20: 305.07 to 305.28, 366.0 to 366.4 and
        // 609.6 to 610.66 (RF6a, RF6b, RF6c)
        expect(twipsOf(lineWith({ emphasis: "above" }))).to.be.closeTo(335.69, 0.01);
        const calibri = (size: number): number =>
            twipsOf([word("RF6 1 x ", { font: "Calibri", size }), word("dotted", { font: "Calibri", size, emphasis: "above" })]);
        expect(calibri(10)).to.be.closeTo(305.18, 0.11);
        expect(calibri(12)).to.be.closeTo(366.2, 0.2);
        expect(calibri(20)).to.be.closeTo(610.13, 0.53);
        // Times New Roman 10, Arial 11 and Cambria 11: 287.2 to 288.0, 316.11 to 316.26 and 321.6 to 322.56 (RF6d, RF6e, RF6f)
        const font = (name: string, size: number): number =>
            twipsOf([word("RF6 1 x ", { font: name, size }), word("dotted", { font: name, size, emphasis: "above" })]);
        expect(font("Times New Roman", 10)).to.be.closeTo(287.6, 0.4);
        expect(font("Arial", 11)).to.be.closeTo(316.19, 0.08);
        expect(font("Cambria", 11)).to.be.closeTo(322.08, 0.48);
        // Under the text, a word of 7 points, a space, and an empty paragraph's mark: all 335.5 or so (RF6i, RF6j, RF6n, RF8c)
        expect(twipsOf(lineWith({ emphasis: "below" }))).to.be.closeTo(335.69, 0.01);
        expect(twipsOf(lineWith({ size: 7, emphasis: "above" }))).to.be.closeTo(335.69, 0.01);
        expect(twipsOf([word("RF6n 1 x"), word(" ", { ...CALIBRI, emphasis: "above" }), word("y")])).to.be.closeTo(335.69, 0.01);
        expect(twipsOf([], { markFont: { ...CALIBRI, emphasis: "above" } })).to.be.closeTo(335.54, 0.5);
        // On a list's number, before text without them (stops2/word-stops-lists.ts LI4b)
        const tab: InlineItem = { type: "tab", font: { ...CALIBRI, listNumber: "separator" } };
        expect(
            twipsOf([word("1.", { ...CALIBRI, emphasis: "above", listNumber: "number" }), tab, word("LI4b")], {
                format: { indentLeft: 36, firstLineIndent: -18 },
            }),
        ).to.be.closeTo(335.69, 0.01);
        // Exactly 12 points is 12 points still
        expect(twipsOf(lineWith({ emphasis: "above" }), { format: { lineSpacing: { rule: "exact", height: 12 } } })).to.equal(240);
    });

    it("should give emphasis marks a quarter of a line taller than its fonts' own lines", () => {
        // Courier New 20 with marks in a line of Times New Roman 20: 616.8 to 617.4; a word with marks raised 6 points, and
        // one beside a raised word: 485.49 to 486.0; a word with marks and a border: 560.4 to 560.8 (RF10)
        const times = { font: "Times New Roman", size: 20 };
        expect(twipsOf([word("RF10a 1 x ", times), word("dotted", { font: "Courier New", size: 20, emphasis: "above" })])).to.be.closeTo(
            617.1,
            0.3,
        );
        expect(twipsOf(lineWith({ emphasis: "above", raise: 6 }))).to.be.closeTo(485.69, 0.2);
        expect(twipsOf([...lineWith({ emphasis: "above" }), word(" "), word("raised", { ...CALIBRI, raise: 6 })])).to.be.closeTo(
            485.69,
            0.2,
        );
        expect(twipsOf(lineWith({ emphasis: "above", ...boxed(4.5) }))).to.be.closeTo(560.69, 0.2);
    });

    it("should add line spacing that gives a little room below the marks' room, and fit the marks in spacing that gives enough", () => {
        // 1.08 and 1.15 lines add their room below the marks': 356.8 to 357.25, and 375.77 to 376.2 (RF9a, RF9b)
        const [rf9a] = linesOf(lineWith({ emphasis: "above" }), multiple(259 / 240));
        expect(rf9a.height * 20).to.be.closeTo(356.96, 0.23);
        expect(rf9a.spacingBelow! * 20).to.be.closeTo(21.27, 0.01);
        expect(twipsOf(lineWith({ emphasis: "above" }), multiple(1.15))).to.be.closeTo(375.97, 0.22);
        // 1.5 and 2 lines hold the marks: 402.83 (RF6k) and 536.53 to 537.6, with the rest of their room below the text (RF9c)
        const [rf9c] = linesOf(lineWith({ emphasis: "above" }), multiple(2));
        expect(rf9c.height * 20).to.be.closeTo(537.1, 0.01);
        expect(rf9c.spacingBelow! * 20).to.be.closeTo(201.41, 0.01);
        expect(twipsOf(lineWith({ emphasis: "above" }), multiple(1.5))).to.be.closeTo(402.83, 0.01);
        // At least 12 and 16 points add the marks' room: 335.47 to 336.53, and 386.88 to 387.2; at least 18 holds them:
        // 359.47 to 360.53 (RF9e, RF9f, RF9g)
        const atLeast = (points: number): Omit<LineLayoutOptions, "width"> => ({
            format: { lineSpacing: { rule: "atLeast", height: points } },
        });
        expect(twipsOf(lineWith({ emphasis: "above" }), atLeast(12))).to.be.closeTo(335.69, 0.01);
        expect(twipsOf(lineWith({ emphasis: "above" }), atLeast(16))).to.be.closeTo(387.14, 0.15);
        const [rf9g] = linesOf(lineWith({ emphasis: "above" }), atLeast(18));
        expect(rf9g.height).to.equal(18);
        expect(rf9g.spacingBelow).to.equal(undefined);
        // Marks under the text the same: 402.67 to 403.73 at 1.5 lines, and 375.77 to 376.32 at 1.15 (RF9h, RF9i)
        expect(twipsOf(lineWith({ emphasis: "below" }), multiple(1.5))).to.be.closeTo(402.83, 0.01);
        expect(twipsOf(lineWith({ emphasis: "below" }), multiple(1.15))).to.be.closeTo(375.97, 0.22);
    });

    it("should give emphasis marks their room beside a picture, over and under one line, and with line spacing, as Word does", () => {
        // word-stops-text.ts RF21: a quarter of the line with a picture of 20 points, 459.08 and 114.77 twips
        const pictured = linesOf([word("x", { ...CALIBRI, emphasis: "above" }), { type: "box", width: 20, height: 20, font: CALIBRI }])[0];
        expect(pictured.height * 20).to.be.closeTo(573.85, 0.01);
        // RF20a: marks over and under one line, a quarter of it over and another under
        expect(twipsOf([word("x ", { ...CALIBRI, emphasis: "below" }), word("y", { ...CALIBRI, emphasis: "above" })])).to.be.closeTo(
            402.83,
            0.01,
        );
        // RF22a, RF22b: below single spacing, the line and its marks both that share: 268.55 at 0.8 lines, 302.12 at 0.9
        expect(twipsOf(lineWith({ emphasis: "above" }), multiple(0.8))).to.be.closeTo(268.55, 0.01);
        expect(twipsOf(lineWith({ emphasis: "above" }), multiple(0.9))).to.be.closeTo(302.12, 0.01);
        // RF22c to RF22e: 1.2 lines add the marks' room to the spacing's, and from 1.25 the spacing holds them
        expect(twipsOf(lineWith({ emphasis: "above" }), multiple(1.2))).to.be.closeTo(389.4, 0.01);
        const [rf22d] = linesOf(lineWith({ emphasis: "above" }), multiple(1.25));
        expect(rf22d.height * 20).to.be.closeTo(335.69, 0.01);
        expect(rf22d.spacingBelow).to.equal(undefined);
        expect(twipsOf(lineWith({ emphasis: "above" }), multiple(1.3))).to.be.closeTo(349.12, 0.01);
        // RF22h: at 1.15 lines over a word raised 6 points, the marks' quarter of 388.55 adds to the spacing's 40.28
        expect(twipsOf(lineWith({ emphasis: "above", raise: 6 }), multiple(1.15))).to.be.closeTo(525.97, 0.05);
    });

    it("should stop at emphasis marks where how much room Word gives them isn't known", () => {
        const unsupported = (items: readonly InlineItem[], options: Omit<LineLayoutOptions, "width"> = {}): string | undefined =>
            linesOf(items, options)[0].unsupported;
        const spacing = "emphasis marks on a line whose line spacing Word hasn't shown with them";
        // Less than a line on a line taller than its fonts' own, and at least a height there
        expect(unsupported(lineWith({ emphasis: "above", raise: 6 }), multiple(0.8))).to.equal(spacing);
        expect(
            unsupported(lineWith({ emphasis: "above", raise: 6 }), { format: { lineSpacing: { rule: "atLeast", height: 30 } } }),
        ).to.equal(spacing);
        expect(unsupported(lineWith({ emphasis: "above", raise: 6 }), multiple(1))).to.equal(undefined);
        // Beside a picture, and over and under one line, with spacing
        const pictured = [word("x", { ...CALIBRI, emphasis: "above" }), { type: "box", width: 20, height: 30, font: CALIBRI }] as const;
        expect(unsupported([...pictured], multiple(1.5))).to.equal("emphasis marks on a line with a picture and line spacing");
        expect(
            unsupported([word("x ", { ...CALIBRI, emphasis: "below" }), word("y", { ...CALIBRI, emphasis: "above" })], multiple(1.5)),
        ).to.equal("emphasis marks over and under text on one line with line spacing");
    });

    it("should give a border its room above and below the text, and to its own line", () => {
        // A border of half a point 4 points away: 448.46 to 449.06; touching: 288.0 to 288.68; of 3 points: 388.27 to 389.33
        // (RF7a, RF7b, RF7c)
        expect(twipsOf(lineWith(boxed(4.5)))).to.be.closeTo(448.55, 0.01);
        expect(twipsOf(lineWith(boxed(0.5)))).to.be.closeTo(288.55, 0.01);
        expect(twipsOf(lineWith(boxed(3)))).to.be.closeTo(388.55, 0.01);
        // Double, triple and of no style 4 points away: 358.4 to 358.8, 368.4 to 368.8 and 428.4 to 428.8 (RF7d, RF7e, RF7h)
        expect(twipsOf(lineWith(boxed(2.25)))).to.be.closeTo(358.55, 0.01);
        expect(twipsOf(lineWith(boxed(2.5)))).to.be.closeTo(368.55, 0.01);
        expect(twipsOf(lineWith(boxed(4)))).to.be.closeTo(428.55, 0.01);
        // Around a word of 7 points: 349.87 to 350.93 (RF7f)
        expect(twipsOf(lineWith({ size: 7, ...boxed(4.5) }))).to.be.closeTo(350.4, 0.53);
        // Raised 6 points, round the raised text and down to the baseline: 508.8 to 509.76; lowered 6: 478.4 to 478.8
        // (RF13a, RF13b)
        expect(twipsOf(lineWith({ raise: 6, ...boxed(4.5) }))).to.be.closeTo(509.5, 0.26);
        expect(twipsOf(lineWith({ raise: -6, ...boxed(4.5) }))).to.be.closeTo(478.58, 0.22);
        // Round superscript, and small capitals, it is round the run's own line: 448.46 to 449.06, and 448.32 to 448.8 (RF14)
        expect(twipsOf(lineWith({ size: 7, lineSize: 11, ...boxed(4.5) }))).to.be.closeTo(448.55, 0.01);
        // At 1.5 lines, half of the bordered line below it: 672.8 to 673.2 (RF7g)
        const [rf7g] = linesOf(lineWith(boxed(4.5)), multiple(1.5));
        expect(rf7g.height * 20).to.be.closeTo(672.83, 0.01);
        expect(rf7g.spacingBelow! * 20).to.be.closeTo(224.28, 0.01);
        // A border on an empty paragraph's mark takes no room: 268.34 (RF8d)
        expect(twipsOf([], { markFont: { ...CALIBRI, ...boxed(4.5) } })).to.be.closeTo(268.55, 0.01);
        // Nor on the line of a page break that ends an empty paragraph, which is as tall as the mark too
        expect(twipsOf([{ type: "break", kind: "page", font: CALIBRI }], { markFont: { ...CALIBRI, ...boxed(4.5) } })).to.be.closeTo(
            268.55,
            0.01,
        );
    });

    it("should give a border its room beside its box, which goes on round text next to it with the same border", () => {
        // Every character is 10 points wide, and each border's room is 5 points
        const box = (value: string, key = "a"): InlineItem => ({ type: "text", text: value, font: boxed(5, key) });
        const plain = (value: string): InlineItem => ({ type: "text", text: value, font: {} });
        const widths = (items: readonly InlineItem[]): { readonly min: number; readonly max: number } =>
            measureContentWidths(items, { measurer: { ...MEASURER } });
        // Room before and after its run (RF7a), once round runs next to each other with the same border, and round each of
        // two with other borders (RF7i, RF7k)
        expect(widths([plain("x "), box("bb"), plain(" c")])).to.deep.equal({ min: 30, max: 70 });
        expect(widths([box("bb"), box("cc")]).max).to.equal(50);
        expect(widths([box("bb"), box("cc", "b")]).max).to.equal(60);
        // Spaces in the box are in it, and a word that starts a line starts its box again, with the room after it too
        expect(widths([box("bb cc")])).to.deep.equal({ min: 30, max: 60 });
        expect(widths([box("bb "), plain("c")]).max).to.equal(50);
        // A picture after a box ends it, and starts a line where it is
        expect(widths([box("bb"), { type: "box", width: 30, height: 10 }])).to.deep.equal({ min: 30, max: 60 });
        // A tab after a box ends it, but for one with its border, round which the box goes on, as it is laid out
        // (word-stops-tabs TA7a): "bb" ends at 25, and "cc" goes from the stop at 36 to 56, with the box's end after it
        expect(widths([box("bb"), { type: "tab", font: {} }, plain("c")]).max).to.equal(46);
        expect(widths([box("bb"), { type: "tab", font: boxed(5, "a") }, box("cc")]).max).to.equal(61);
    });

    it("should wrap text in a border with its box's room, and start the box again on the next line", () => {
        const box = (value: string): InlineItem => ({ type: "text", text: value, font: boxed(5) });
        const marker = (name: string): InlineItem => ({ type: "marker", name });
        const markersOf = (items: readonly InlineItem[], width: number): readonly (readonly string[])[] =>
            layoutLines(items, { width, measurer: MEASURER }).map(({ markers }) => markers);
        // "aaaa bbbb" in the box is 5, 90 and 5 wide, and "cccc" goes on to the next line, where the box starts again 5 in
        // (RF7n)
        expect(markersOf([box("aaaa bbbb "), marker("c"), box("cccc")], 100)).to.deep.equal([[], ["c"]]);
        // A line has room for the box's end after its last word, whether the box goes on or not (word-run-formatting2.ts
        // RF11): 98 points fit "aaaa" and no more, on each line
        expect(markersOf([box("aaaa "), marker("b"), box("bbbb "), marker("c"), box("cccc")], 98)).to.deep.equal([[], ["b"], ["c"]]);
        expect(markersOf([box("aaaa "), marker("b"), box("bbbb"), { type: "text", text: " c", font: {} }], 98)).to.deep.equal([[], ["b"]]);
        // Before a box, the room it starts with moves its first word on with it: "aaaa " is 50, and the box 5, 40 and 5
        expect(markersOf([{ type: "text", text: "aaaa ", font: {} }, marker("b"), box("bbbb")], 99)).to.deep.equal([[], ["b"]]);
        expect(markersOf([{ type: "text", text: "aaaa ", font: {} }, marker("b"), box("bbbb")], 100)).to.deep.equal([["b"]]);
        // A word longer than its line, broken across lines, has room for the box's end on each, and starts it again on the
        // next (word-stops-text.ts RF23): 5 and 8 letters of 10 on the first, and the box 5 in on the second
        const broken = layoutLines([box("aaaaaaaaaaaaaaa")], { width: 100, measurer: MEASURER });
        expect(broken.map(({ text: value, textWidth, unsupported }) => [value, textWidth, unsupported])).to.deep.equal([
            ["aaaaaaaaa", 95, undefined],
            ["aaaaaa", 65, undefined],
        ]);
    });

    it("should line text in a border up with a tab stop by its box, and go on round a tab in it, as Word does", () => {
        // word-stops-tabs TA7b to TA7d: "aa" in a box of 5 either side ends 5 before a right stop at 90, is centred on a
        // centred one, and lines up its full stop with a decimal one
        const box = (value: string): InlineItem => ({ type: "text", text: value, font: boxed(5) });
        const lineAt = (alignment: "right" | "center" | "decimal", items: readonly InlineItem[]): LaidOutLine =>
            layoutLines([{ type: "tab", font: {} }, ...items], {
                width: 200,
                measurer: MEASURER,
                tabStops: [{ position: 90, alignment }],
            })[0];
        expect([lineAt("right", [box("aa")]).textWidth, lineAt("right", [box("aa")]).unsupported]).to.deep.equal([85, undefined]);
        expect(lineAt("center", [box("aa")]).textWidth).to.equal(100);
        expect(lineAt("decimal", [box("1.5")]).textWidth).to.equal(110);
        // With nothing but a picture after the tab, it lines up as without a border, and a picture after the box, which
        // closes it, ends at the stop
        expect(lineAt("right", [{ type: "box", width: 20, height: 10 }]).textWidth).to.equal(90);
        expect(lineAt("right", [box("aa"), { type: "box", width: 20, height: 10 }]).textWidth).to.equal(90);
        // TA7a: a tab in the box, with its border, keeps the box open, so the text after it starts at its stop
        const tabbed = layoutLines([box("aa"), { type: "tab", font: boxed(5) }, box("bb")], {
            width: 200,
            measurer: MEASURER,
            defaultTabStop: 50,
        });
        expect(tabbed[0].textWidth).to.equal(70);
        // A tab without the border closes it, and the text after it opens another
        const closed = layoutLines([box("aa"), { type: "tab", font: {} }, box("bb")], {
            width: 200,
            measurer: MEASURER,
            defaultTabStop: 50,
        });
        expect(closed[0].textWidth).to.equal(75);
    });
});

describe("layoutLines on a document grid, as Word lays it out (scripts/layout-probes/word-grid.ts)", () => {
    // A4 with inch margins: 9026 twips across
    const WIDTH = 451.3;
    const IDEOGRAPH = "永";
    const run = (value: string, font: string, size = 10.5, more: TextFont = {}): InlineItem => ({
        type: "text",
        text: value,
        font: { font, size, ...more },
    });
    const mincho = (value: string, size = 10.5, more: TextFont = {}): InlineItem => run(value, "MS Mincho", size, more);
    const linesOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): readonly LaidOutLine[] =>
        layoutLines(items, { width: WIDTH, ...options });
    /** How many characters each line has, leaving out spaces */
    const countsOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): readonly number[] =>
        linesOf(items, options).map((line) => [...line.text.replace(/ /g, "")].length);
    const unsupportedOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): string | undefined =>
        linesOf(items, options).find((line) => line.unsupported !== undefined)?.unsupported;

    describe("a grid of lines", () => {
        const LINES = { grid: { linePitch: 18 } };
        /** How many of a grid's lines of 360 twips a line of a font at a size takes */
        const takes = (font: string, value: string, size: number): number => {
            const [line] = linesOf([run(value, font, size)], { ...LINES, markFont: { font, size } });
            return Math.round((line.height / 18) * 1000) / 1000;
        };

        it("should give each line as many of the grid's lines as its own height needs, from the sizes Word gives it one more (G1)", () => {
            const sizes: readonly (readonly [string, string, readonly (readonly [number, number])[]])[] = [
                [
                    "Times New Roman",
                    "Hxg",
                    [
                        [15.5, 1],
                        [16, 2],
                        [31, 2],
                        [31.5, 3],
                    ],
                ],
                [
                    "Calibri",
                    "Hxg",
                    [
                        [14.5, 1],
                        [15, 2],
                        [29, 2],
                        [29.5, 3],
                    ],
                ],
                [
                    "MS Mincho",
                    IDEOGRAPH,
                    [
                        [13.5, 1],
                        [14, 2],
                        [27.5, 2],
                        [28.5, 3],
                    ],
                ],
                [
                    "Yu Mincho",
                    IDEOGRAPH,
                    [
                        [12.5, 1],
                        [13, 2],
                        [25, 2],
                        [25.5, 3],
                        [37.5, 3],
                        [38, 4],
                    ],
                ],
                [
                    "SimSun",
                    IDEOGRAPH,
                    [
                        [13.5, 1],
                        [14, 2],
                        [27.5, 2],
                        [28.5, 3],
                    ],
                ],
                [
                    "Microsoft YaHei",
                    IDEOGRAPH,
                    [
                        [10, 1],
                        [10.5, 2],
                        [20.5, 2],
                        [21, 3],
                        [31, 3],
                        [31.5, 4],
                    ],
                ],
                [
                    "Malgun Gothic",
                    "가나다",
                    [
                        [10, 1],
                        [10.5, 2],
                        [20.5, 2],
                        [21, 3],
                        [31, 3],
                        [31.5, 4],
                    ],
                ],
            ];
            for (const [font, value, expected] of sizes) {
                expect(expected.map(([size]) => [size, takes(font, value, size)])).to.deep.equal(expected);
            }
        });

        it("should give a line with multiple spacing the grid's lines times the spacing, unless its own height needs more (G3)", () => {
            const heightOf = (font: string, size: number, multiple: number): number =>
                linesOf([run("Hxg", font, size)], { ...LINES, format: { lineSpacing: { rule: "multiple", multiple } } })[0].height;
            const rounded = (multiple: number): number => Math.round(heightOf("Times New Roman", 12, multiple) * 1000) / 1000;
            expect([0.5, 0.8, 1, 1.08, 1.15, 1.5, 2, 2.5, 3].map(rounded)).to.deep.equal([18, 18, 18, 19.44, 20.7, 27, 36, 45, 54]);
            expect(heightOf("Times New Roman", 20, 1.5)).to.equal(36);
            expect(heightOf("Times New Roman", 20, 0.8)).to.equal(36);
            expect(heightOf("Calibri", 11, 1.08)).to.be.closeTo(19.44, 1e-9);
            expect(
                linesOf([mincho(IDEOGRAPH)], { ...LINES, format: { lineSpacing: { rule: "multiple", multiple: 2 } } })[0].height,
            ).to.equal(36);
        });

        it("should give a line exactly its height, and at least a height at least its grid's lines (G4)", () => {
            const heightOf = (rule: "exact" | "atLeast", height: number, size = 12): number =>
                linesOf([run("Hxg", "Times New Roman", size)], { ...LINES, format: { lineSpacing: { rule, height } } })[0].height;
            expect([10, 12, 20, 30].map((height) => heightOf("exact", height))).to.deep.equal([10, 12, 20, 30]);
            expect([10, 12, 20, 30, 40].map((height) => heightOf("atLeast", height))).to.deep.equal([18, 18, 20, 30, 40]);
            expect(heightOf("atLeast", 20, 20)).to.equal(36);
        });

        it("should leave the room below a line's text, in the middle of its room, to go below the bottom of the page (G1, G14)", () => {
            const [single] = linesOf([run("Hxg", "Times New Roman", 12)], LINES);
            const natural = measureLineHeight({ font: "Times New Roman", size: 12 });
            expect(single.spacingBelow).to.be.closeTo((18 - natural) / 2, 1e-9);
            const [spaced] = linesOf([run("Hxg", "Times New Roman", 12)], {
                ...LINES,
                format: { lineSpacing: { rule: "multiple", multiple: 1.5 } },
            });
            expect(spaced.spacingBelow).to.be.closeTo((27 - natural) / 2, 1e-9);
            // At least a height has its text in the middle of the grid's lines it takes, below the rest of the room
            const [atLeast] = linesOf([run("Hxg", "Times New Roman", 12)], {
                ...LINES,
                format: { lineSpacing: { rule: "atLeast", height: 30 } },
            });
            expect(atLeast.spacingBelow).to.be.closeTo((18 - natural) / 2, 1e-9);
            const [exact] = linesOf([run("Hxg", "Times New Roman", 12)], {
                ...LINES,
                format: { lineSpacing: { rule: "exact", height: 30 } },
            });
            expect(exact).to.not.have.property("spacingBelow");
            // A line as tall as the grid's lines has none
            const [full] = linesOf([run("Hxg", "Times New Roman", 12)], { grid: { linePitch: natural } });
            expect(full).to.not.have.property("spacingBelow");
        });

        it("should put emphasis marks' room in a line before it is put on the grid, with multiple line spacing and at least a height too (G11d, GR3, GR16d)", () => {
            const marked = [mincho("ab"), mincho(IDEOGRAPH.repeat(4), 10.5, { emphasis: "above" })];
            expect(linesOf(marked, LINES)[0].height).to.equal(18);
            expect(linesOf(marked, { ...LINES, format: { lineSpacing: { rule: "multiple", multiple: 1 } } })[0].height).to.equal(18);
            // 1.5 lines are 540 twips, as without marks (stops2/word-stops-east-asian.ts GR3)
            const spaced = linesOf(marked, { ...LINES, format: { lineSpacing: { rule: "multiple", multiple: 1.5 } } })[0];
            expect(spaced.height).to.equal(27);
            expect(spaced.unsupported).to.equal(undefined);
            // At least 20 points are 400 twips (stops2/word-stops-east-asian2.ts GR16d)
            const atLeast = linesOf(marked, { ...LINES, format: { lineSpacing: { rule: "atLeast", height: 20 } } })[0];
            expect(atLeast.height).to.equal(20);
            expect(atLeast.unsupported).to.equal(undefined);
            // But not marks over and under text on one line, with line spacing, as without the grid
            expect(
                unsupportedOf([...marked, mincho(IDEOGRAPH, 10.5, { emphasis: "below" })], {
                    ...LINES,
                    format: { lineSpacing: { rule: "atLeast", height: 20 } },
                }),
            ).to.equal("emphasis marks over and under text on one line with line spacing");
        });
    });

    describe("a grid of lines and characters", () => {
        const spaced = (characterSpace: number): Partial<LineLayoutOptions> => ({ grid: { linePitch: 18, characterSpace } });
        const ONE = spaced(1);
        const MIXED = Array.from({ length: 10 }, () => `${IDEOGRAPH.repeat(5)}abc de`).join("");

        it("should add the grid's space after each character, Chinese, Japanese, Korean, Latin or half-width (CA1 to CA3, CA9, CB1, CB3)", () => {
            expect(countsOf([mincho(IDEOGRAPH.repeat(100))], ONE)).to.deep.equal([39, 39, 22]);
            expect(countsOf([mincho(IDEOGRAPH.repeat(100), 12)], ONE)).to.deep.equal([34, 34, 32]);
            const latin = Array.from({ length: 24 }, (_, index) => (index % 2 === 0 ? "iiiiiiiiii" : "mmmmmmmmmm")).join(" ");
            expect(countsOf([run(latin, "Times New Roman")], ONE)).to.deep.equal([60, 60, 60, 60]);
            expect(countsOf([mincho("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ".repeat(8))], ONE)).to.deep.equal([72, 72, 16]);
            expect(countsOf([mincho(IDEOGRAPH.repeat(100))], spaced(-1365 / 4096))).to.deep.equal([44, 44, 12]);
            expect(countsOf([run(latin, "Times New Roman")], spaced(-1365 / 4096))).to.deep.equal([80, 80, 80]);
        });

        it("should leave a run that doesn't snap to the grid as it is (CA5)", () => {
            expect(countsOf([mincho(IDEOGRAPH.repeat(100), 10.5, { snapToGrid: false })], ONE)).to.deep.equal([42, 42, 16]);
        });

        it("should space text of Word's default size, 10 points, as text of that size", () => {
            const plain: InlineItem = { type: "text", text: `${IDEOGRAPH.repeat(99)}a`, font: { font: "MS Mincho" } };
            expect(countsOf([plain], ONE)).to.deep.equal([41, 41, 18]);
        });

        it("should add a quarter of a character between Chinese, Japanese or Korean characters and Latin letters (CA4, CA7, CB4, CB7)", () => {
            expect(countsOf([mincho(MIXED)], ONE)).to.deep.equal([44, 44, 12]);
            expect(countsOf([mincho(MIXED)], { ...ONE, format: { alignment: "justified" } })).to.deep.equal([44, 46, 10]);
            expect(countsOf([mincho(MIXED)], spaced(-1365 / 4096))).to.deep.equal([52, 48]);
            expect(countsOf([mincho(MIXED)], { ...spaced(-1365 / 4096), format: { alignment: "justified" } })).to.deep.equal([52, 48]);
            // Across runs, and a bookmark between them
            const runs: readonly InlineItem[] = MIXED.split(/(?<=c)/).flatMap((part): readonly InlineItem[] => [
                mincho(part),
                { type: "marker", name: "between" },
            ]);
            expect(countsOf(runs, ONE)).to.deep.equal([44, 44, 12]);
        });

        it("should stop at numbers, punctuation and text of another size in an East Asian font next to East Asian characters, but not spaces", () => {
            const UNKNOWN =
                "a number, punctuation or text of another size in an East Asian font next to an East Asian character on a grid of characters";
            for (const value of [`${IDEOGRAPH}1`, `1${IDEOGRAPH}`, `${IDEOGRAPH}.`]) {
                expect(unsupportedOf([mincho(value)], ONE)).to.equal(UNKNOWN);
            }
            // A space after a Latin word and before an ideograph takes no more room, as after "H4 body" (word-grid3.ts H4)
            expect(unsupportedOf([mincho(`ab ${IDEOGRAPH} a`)], ONE)).to.equal(undefined);
            // "ab " in half-width letters of 5.25 points and the ideograph of 10.5, each a point wider, and no more
            expect(linesOf([mincho(`ab ${IDEOGRAPH}`)], ONE)[0].textWidth).to.be.closeTo(3 * 6.25 + 11.5, 1e-9);
            expect(unsupportedOf([mincho(IDEOGRAPH), mincho("a", 12)], ONE)).to.equal(UNKNOWN);
            // But for marks, which go on the character before them, and text off the grid between them
            expect(unsupportedOf([mincho(`${IDEOGRAPH}\u0301a`)], ONE)).to.equal(undefined);
            expect(unsupportedOf([mincho(IDEOGRAPH), mincho("1", 10.5, { snapToGrid: false }), mincho(IDEOGRAPH)], ONE)).to.equal(
                undefined,
            );
            expect(unsupportedOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, mincho("1")], ONE)).to.equal(undefined);
        });

        it("should add nothing between East Asian characters and text in another font, of any kind or size (GR4a, GR4c)", () => {
            const between = (value: string, size: number): readonly InlineItem[] => [
                mincho(IDEOGRAPH),
                run(value, "Calibri", size),
                mincho(IDEOGRAPH),
            ];
            for (const items of [between("12", 10.5), between("Latin words", 16)]) {
                const [line] = linesOf(items, ONE);
                expect(line.unsupported).to.equal(undefined);
                const [, other] = items as readonly Extract<InlineItem, { readonly type: "text" }>[];
                // Each character a point wider, and no more
                const width = measureTextWidth(other.text, other.font) + [...other.text].length;
                expect(line.textWidth).to.be.closeTo(2 * 11.5 + width, 1e-9);
            }
        });
    });

    describe("a grid that snaps to characters", () => {
        const snapping = (cells: number): Partial<LineLayoutOptions> => ({ grid: { linePitch: 18, characterPitch: WIDTH / cells } });
        const CC = snapping(39);
        const CD = snapping(42);

        it("should put each Chinese, Japanese or Korean character in as many of the grid's cells as it needs (CC1, CC2, CC8, CC9, CD1, CD2)", () => {
            expect(countsOf([mincho(IDEOGRAPH.repeat(100))], CC)).to.deep.equal([39, 39, 22]);
            expect(countsOf([mincho(IDEOGRAPH.repeat(100), 12)], CC)).to.deep.equal([19, 19, 19, 19, 19, 5]);
            expect(countsOf([run("あいうえおかきくけこさしすせそたちつてと".repeat(5), "MS PMincho")], CC)).to.deep.equal([39, 39, 22]);
            expect(countsOf([mincho("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ".repeat(8))], CC)).to.deep.equal([39, 39, 39, 39, 4]);
            expect(countsOf([mincho(IDEOGRAPH.repeat(100))], CD)).to.deep.equal([42, 42, 16]);
            expect(countsOf([mincho(IDEOGRAPH.repeat(100), 12)], CD)).to.deep.equal([21, 21, 21, 21, 16]);
        });

        it("should put the other text between them on a line in as many cells as it needs together (CC3, CC4, CC7, CD3, CD4)", () => {
            const latin = Array.from({ length: 24 }, (_, index) => (index % 2 === 0 ? "iiiiiiiiii" : "mmmmmmmmmm")).join(" ");
            expect(countsOf([run(latin, "Times New Roman")], CC)).to.deep.equal([70, 70, 70, 30]);
            expect(countsOf([run(latin, "Times New Roman")], CD)).to.deep.equal([70, 70, 70, 30]);
            const mixed = Array.from({ length: 10 }, () => `${IDEOGRAPH.repeat(5)}abc de`).join("");
            expect(countsOf([mincho(mixed)], CC)).to.deep.equal([48, 47, 5]);
            expect(countsOf([mincho(mixed)], { ...CC, format: { alignment: "justified" } })).to.deep.equal([48, 47, 5]);
            expect(countsOf([mincho(mixed)], CD)).to.deep.equal([52, 48]);
        });

        it("should put marks on the character before them, in its cells", () => {
            const lines = linesOf([mincho(`${IDEOGRAPH}\u0301`.repeat(50))], CC);
            expect(lines.map((line) => [...line.text].filter((character) => character === IDEOGRAPH).length)).to.deep.equal([39, 11]);
        });

        it("should leave a run that doesn't snap to the grid as it is (CC5)", () => {
            expect(countsOf([mincho(IDEOGRAPH.repeat(100), 10.5, { snapToGrid: false })], CC)).to.deep.equal([42, 42, 16]);
            // And the text after it in cells from where it ends: 38 of them after it
            expect(countsOf([mincho("a", 10.5, { snapToGrid: false }), mincho(IDEOGRAPH.repeat(39))], CC)).to.deep.equal([39, 1]);
        });

        it("should start each line on the grid's cells, indented a whole number of them (CC6, CD6)", () => {
            const cell = WIDTH / 39;
            expect(
                countsOf([mincho(IDEOGRAPH.repeat(100))], { ...CC, format: { indentLeft: 2 * cell, firstLineIndent: 2 * cell } }),
            ).to.deep.equal([35, 37, 28]);
            // Where the indents are, the lines start
            expect(
                linesOf([mincho(IDEOGRAPH.repeat(100))], { ...CC, format: { indentLeft: 2 * cell } }).map((line) => line.start),
            ).to.deep.equal([undefined, undefined, undefined]);
        });

        it("should round an indent of part of a cell up to the next, and a hanging indent's other lines that many more cells in (GR14)", () => {
            // The probes' grid: 40 cells of 225.65 twips
            const cell = WIDTH / 40;
            const GR14 = { grid: { linePitch: 18, characterPitch: cell } };
            const startsOf = (format: LineLayoutOptions["format"]): readonly (number | undefined)[] =>
                linesOf([mincho(IDEOGRAPH.repeat(80))], { ...GR14, format }).map(({ start }) =>
                    start === undefined ? start : Math.round((start / cell) * 1e6) / 1e6,
                );
            // 1.2, 1.7 characters, and 300 twips: the 3rd cell (GR14a to GR14c)
            expect(startsOf({ indentLeft: 1.2 * cell })).to.deep.equal([2, 2, 2]);
            expect(startsOf({ indentLeft: 1.7 * cell })).to.deep.equal([2, 2, 2]);
            expect(startsOf({ indentLeft: 15 })).to.deep.equal([2, 2, 2]);
            expect(countsOf([mincho(IDEOGRAPH.repeat(80))], { ...GR14, format: { indentLeft: 1.2 * cell } })).to.deep.equal([38, 38, 4]);
            // A first line indent of half a character: the 2nd cell, and the others at the 1st (GR14d)
            expect(startsOf({ firstLineIndent: 0.5 * cell })).to.deep.equal([1, 0, 0]);
            // 2 characters hanging half a character: the 3rd cell, and the others at the 4th (GR14e)
            expect(startsOf({ indentLeft: 2 * cell, firstLineIndent: -0.5 * cell })).to.deep.equal([2, 3, 3]);
            expect(
                countsOf([mincho(IDEOGRAPH.repeat(80))], { ...GR14, format: { indentLeft: 2 * cell, firstLineIndent: -0.5 * cell } }),
            ).to.deep.equal([38, 37, 5]);
            // A whole first line indent beside a left indent of part of a cell
            expect(startsOf({ indentLeft: 1.2 * cell, firstLineIndent: cell })).to.deep.equal([3, 2, 2]);
            // A right indent of 1.5 characters leaves 38 cells (GR14f)
            expect(countsOf([mincho(IDEOGRAPH.repeat(80))], { ...GR14, format: { indentRight: 1.5 * cell } })).to.deep.equal([38, 38, 4]);
        });

        it("should stop at indents of part of a cell Word hasn't been seen rounding, and at a tab in a paragraph with one", () => {
            const cell = WIDTH / 40;
            const GR14 = { grid: { linePitch: 18, characterPitch: cell } };
            expect(
                unsupportedOf([mincho(IDEOGRAPH)], { ...GR14, format: { indentLeft: 1.2 * cell, firstLineIndent: 0.5 * cell } }),
            ).to.equal("a first line indent of part of a character beside a left indent of part of one on a grid that snaps to characters");
            expect(unsupportedOf([mincho(IDEOGRAPH)], { ...GR14, format: { indentLeft: 0.5 * cell, firstLineIndent: -cell } })).to.equal(
                "an indent of part of a character before the margin on a grid that snaps to characters",
            );
            expect(unsupportedOf([mincho(IDEOGRAPH)], { ...GR14, format: { indentLeft: -0.5 * cell } })).to.equal(
                "an indent of part of a character before the margin on a grid that snaps to characters",
            );
            expect(
                unsupportedOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, mincho(IDEOGRAPH)], {
                    ...GR14,
                    format: { indentLeft: 0.5 * cell },
                }),
            ).to.equal("a tab in a paragraph indented part of a character on a grid that snaps to characters");
        });

        it("should start text after a left tab at the next of the grid's cells, and stop at other tabs and text (GR10a, GR16c)", () => {
            const cell = WIDTH / 39;
            // A default stop at 36 points, after one cell: the next character in the fourth, after 3 cells
            const [line] = linesOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, mincho(IDEOGRAPH)], CC);
            expect(line.unsupported).to.equal(undefined);
            expect(line.textWidth).to.be.closeTo(5 * cell, 1e-9);
            // Latin text too, in as many cells as it needs from there
            const [latin] = linesOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, run("a", "Times New Roman")], CC);
            expect(latin.unsupported).to.equal(undefined);
            expect(latin.textWidth).to.be.closeTo(5 * cell, 1e-9);
            const STOP =
                "a tab on a grid that snaps to characters, but for a left one before text, or a right or centred one before Chinese, Japanese or Korean text";
            expect(unsupportedOf([mincho(IDEOGRAPH), { type: "tab", font: {} }], CC)).to.equal(STOP);
            expect(
                unsupportedOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, run("a", "Times New Roman")], {
                    ...CC,
                    tabStops: [{ position: 200, alignment: "right" }],
                }),
            ).to.equal(STOP);
            expect(
                unsupportedOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, mincho(IDEOGRAPH)], {
                    ...CC,
                    tabStops: [{ position: 200, alignment: "decimal" }],
                }),
            ).to.equal(STOP);
            // And one with no stop before the end of the line
            expect(
                unsupportedOf([mincho(IDEOGRAPH), { type: "tab", font: {} }, mincho(IDEOGRAPH)], { ...CC, width: 30, defaultTabStop: 36 }),
            ).to.equal(STOP);
        });

        it("should end Chinese, Japanese or Korean text's cells at a right tab stop, and centre them on a centred one, off the grid's cells (GR16c)", () => {
            // The probes' grid: 40 cells of 225.65 twips
            const cell = WIDTH / 40;
            const GR16 = { grid: { linePitch: 18, characterPitch: cell } };
            const tabbed = (alignment: "right" | "center", position: number, after: string): LaidOutLine =>
                linesOf([run("GR16c right", "Calibri"), { type: "tab", font: {} }, mincho(after)], {
                    ...GR16,
                    tabStops: [{ position, alignment }],
                })[0];
            // 6 ideographs at a right stop at 6000 twips start at 4646.1, and at a centred one at 4000 at 3323.1
            const right = tabbed("right", 300, "日本語のタブ");
            expect(right.unsupported).to.equal(undefined);
            expect(right.textWidth).to.be.closeTo(300, 1e-9);
            const centred = tabbed("center", 200, "日本語のタブ");
            expect(centred.unsupported).to.equal(undefined);
            expect(centred.textWidth).to.be.closeTo(200 + 3 * cell, 1e-9);
            // Latin words at a left stop at 3000, from the 14th cell at 3159.1, in 5 cells
            const [left] = linesOf([run("GR16c left", "Calibri"), { type: "tab", font: {} }, run("Latin words", "Calibri")], {
                ...GR16,
                tabStops: [{ position: 150, alignment: "left" }],
            });
            expect(left.unsupported).to.equal(undefined);
            expect(left.textWidth).to.be.closeTo(19 * cell, 1e-9);
            // With a space between them, and a bookmark before them
            const spaced = linesOf([run("a", "Calibri"), { type: "tab", font: {} }, { type: "marker", name: "b" }, mincho("日本 語")], {
                ...GR16,
                tabStops: [{ position: 300, alignment: "right" }],
            })[0];
            expect(spaced.unsupported).to.equal(undefined);
            expect(spaced.textWidth).to.be.closeTo(300, 1e-9);
            // And a picture after it
            expect(
                linesOf([run("a", "Calibri"), { type: "tab", font: {} }, mincho(IDEOGRAPH), { type: "box", width: 15, height: 10 }], {
                    ...GR16,
                    tabStops: [{ position: 300, alignment: "right" }],
                })[0].textWidth,
            ).to.be.closeTo(300, 1e-9);
        });

        it("should put a picture in as many of the grid's cells as it needs, after the cells of the text before it, and stop at an equation (GR10b, GR16f)", () => {
            const cell = WIDTH / 39;
            // 15 points in 2 cells of 11.57
            const [line] = linesOf([mincho(IDEOGRAPH), { type: "box", width: 15, height: 10 }, mincho(IDEOGRAPH)], CC);
            expect(line.unsupported).to.equal(undefined);
            expect(line.textWidth).to.be.closeTo(4 * cell, 1e-9);
            // "GR16f abc" in 4 cells of 225.65 twips, the picture in 2 more, and 5 ideographs after them
            const GR16 = { grid: { linePitch: 18, characterPitch: WIDTH / 40 } };
            const [after] = linesOf([run("GR16f abc", "Calibri"), { type: "box", width: 15, height: 15 }, mincho("日本語の絵")], GR16);
            expect(after.unsupported).to.equal(undefined);
            expect(after.textWidth).to.be.closeTo((11 * WIDTH) / 40, 1e-9);
            expect(unsupportedOf([mincho(IDEOGRAPH), { type: "box", width: 15, height: 10, descent: 2 }], CC)).to.equal(
                "an equation on a grid that snaps to characters",
            );
        });

        it("should break a word longer than its line after the last character that fits, and put the rest with the text after it in as many cells as they need (GR9)", () => {
            const cell = WIDTH / 39;
            const letter = measureTextWidth("a", { font: "Times New Roman", size: 10.5 });
            const first = Math.floor(WIDTH / letter);
            const lines = linesOf([run(`${"a".repeat(first + 20)} `, "Times New Roman"), mincho(IDEOGRAPH)], CC);
            expect(lines.map((line) => line.unsupported)).to.deep.equal([undefined, undefined]);
            expect(countsOf([run("a".repeat(first + 20), "Times New Roman")], CC)).to.deep.equal([first, 20]);
            // The 20 letters and the space take as many cells as they need, and the ideograph one more
            const rest = Math.ceil((20 * letter + measureTextWidth(" ", { font: "Times New Roman", size: 10.5 })) / cell);
            expect(lines[1].textWidth).to.be.closeTo((rest + 1) * cell, 1e-9);
        });

        // cspell:ignore gesell kapitän schifffahrtsgesellschaftkapitän
        it("should leave a word with a soft hyphen that fits whole, and break one that doesn't at its last soft hyphen whose part fits in the cells left (GR7a, GR16a)", () => {
            const softened = (before: string): readonly InlineItem[] => [
                run(before, "Times New Roman"),
                { type: "softHyphen", font: {} },
                run("cd", "Times New Roman"),
            ];
            expect(unsupportedOf(softened("ab"), CC)).to.equal(undefined);
            expect(linesOf(softened("ab"), CC).map((line) => line.text)).to.deep.equal(["abcd"]);
            // "GR16a " and 30 ideographs, then "Donaudampf-" in the 6 cells left of 40, and the rest of the word in 12 cells at
            // the start of the next line, before 28 ideographs (stops2/word-stops-east-asian2.ts GR16a)
            const JAPANESE = "測量は夏に船と徒歩で行われ、灯台から河口まで続いた。記録には見つかったものが書かれている。";
            const hyphen = { type: "softHyphen", font: { font: "Calibri", size: 10.5 } } as const;
            const word = ["Donau", "dampf", "schiff", "fahrts", "gesell", "schaft", "kapitän"].flatMap(
                (part, index): readonly InlineItem[] => (index === 0 ? [run(part, "Calibri")] : [hyphen, run(part, "Calibri")]),
            );
            const lines = linesOf(
                [run("GR16a ", "Calibri"), mincho(JAPANESE.slice(0, 30)), ...word, run(" ", "Calibri"), mincho(JAPANESE)],
                {
                    grid: { linePitch: 18, characterPitch: WIDTH / 40 },
                },
            );
            expect(lines.map((line) => line.unsupported)).to.deep.equal([undefined, undefined, undefined]);
            expect(lines.map((line) => line.text)).to.deep.equal([
                `GR16a ${JAPANESE.slice(0, 30)}Donaudampf`,
                `schifffahrtsgesellschaftkapitän ${JAPANESE.slice(0, 28)}`,
                JAPANESE.slice(28),
            ]);
        });

        it("should start a line beside a drawing at the next of the grid's cells (GR7b)", () => {
            const [line] = linesOf([mincho(IDEOGRAPH.repeat(50))], { ...CC, width: () => ({ start: 30, end: WIDTH }) });
            expect(line.unsupported).to.equal(undefined);
            // From the third cell's end, at 34.7 points
            expect([...line.text].length).to.equal(36);
        });

        it("should squeeze neither a justified line nor a distributed one, and stop at one justified for Thai that only fits squeezed (GR8, GR16b)", () => {
            // 21 words of 3 letters, which end a cell short of the line: a word of one more, with its space, fits only
            // squeezed
            const squeezed = `${Array.from({ length: 33 }, () => "abc").join(" ")} abcd`;
            const options = (alignment: "justified" | "distributed" | "thaiDistributed"): Partial<LineLayoutOptions> => ({
                grid: { characterPitch: 10 },
                width: 167,
                format: { alignment },
            });
            for (const alignment of ["justified", "distributed"] as const) {
                const lines = linesOf([run(squeezed, "Times New Roman", 10)], options(alignment));
                expect(lines.map((line) => line.unsupported)).to.deep.equal(lines.map(() => undefined));
                expect(lines[0].text.endsWith("abc ")).to.equal(true);
            }
            expect(unsupportedOf([run(squeezed, "Times New Roman", 10)], options("thaiDistributed"))).to.equal(
                "a line justified for Thai or with a kashida on a grid that snaps to characters that only fits squeezed",
            );
        });

        it("should put each column of a grid in columns of different widths in cells of its own (GR12)", () => {
            // Cells of at least 221 twips: 9 of 222.2 in a column of 2000, and 29 of 225 in one of 6526
            const options: Partial<LineLayoutOptions> = {
                grid: { linePitch: 18, characterRoom: 11.05 },
                width: (line) => (line < 2 ? 100 : 326.3),
            };
            expect(countsOf([mincho(IDEOGRAPH.repeat(60))], options)).to.deep.equal([9, 9, 29, 13]);
            expect(linesOf([mincho(IDEOGRAPH.repeat(9))], { ...options, width: 100 })[0].textWidth).to.be.closeTo(100, 1e-9);
            // A line beside a drawing is in the cells of the room's end
            expect(countsOf([mincho(IDEOGRAPH.repeat(9))], { ...options, width: () => ({ start: 0, end: 100 }) })).to.deep.equal([9]);
        });
    });

    it("should set text across in text that runs down the page in as much room as a line of its font is tall, whole (stops2/word-stops-east-asian.ts VD13)", () => {
        const across: InlineItem = { type: "text", text: "31", font: { font: "Calibri", size: 10.5 }, across: true };
        const [line] = linesOf([mincho(IDEOGRAPH.repeat(2)), across, mincho(IDEOGRAPH)]);
        expect(line.text).to.equal(IDEOGRAPH.repeat(3));
        expect(line.textWidth).to.be.closeTo(3 * 10.5 + measureLineHeight({ font: "Calibri", size: 10.5 }), 1e-9);
        // It goes on to the next line whole when it doesn't fit
        expect(linesOf([mincho(IDEOGRAPH.repeat(42)), across], { width: 42 * 10.5 + 5 }).map((laid) => laid.textWidth)).to.deep.equal([
            42 * 10.5,
            measureLineHeight({ font: "Calibri", size: 10.5 }),
        ]);
    });

    it("should kern text on a grid of lines and characters, and on one that snaps to characters, and stop at ligatures on either (GR5, GR16e)", () => {
        const STOP = "ligatures on a document grid of characters";
        const kerned = run("To", "Calibri", 10.5, { kerning: 1 });
        expect(unsupportedOf([run("office", "Calibri", 10.5, { ligatures: "standard" })], { grid: { characterPitch: 10 } })).to.equal(STOP);
        expect(
            unsupportedOf([run("office", "Calibri", 10.5, { ligatures: "standard" })], { grid: { linePitch: 18, characterSpace: 2 } }),
        ).to.equal(STOP);
        // Kerned, Latin text on a grid that snaps to characters takes 20 cells of 225.65 twips, which takes 21 as it is
        // without (stops2/word-stops-east-asian2.ts GR16e)
        const cell = WIDTH / 40;
        const GR16e = "GR16e AVATAR Toyota WAVE Yo Te LT kerned text";
        const cellsOf = (font: TextFont): number =>
            linesOf([run(GR16e, "Calibri", 11, font)], { grid: { linePitch: 18, characterPitch: cell } })[0].textWidth / cell;
        expect(cellsOf({ kerning: 1 })).to.be.closeTo(20, 1e-9);
        expect(cellsOf({})).to.be.closeTo(21, 1e-9);
        // Kerned across the words, between the space and the letter after it too
        const words = GR16e.split(/(?<= )/u).map((word): InlineItem => run(word, "Calibri", 11, { kerning: 1 }));
        expect(linesOf(words, { grid: { linePitch: 18, characterPitch: cell } })[0].textWidth / cell).to.be.closeTo(20, 1e-9);
        // Across runs in the same font too, as when measured apart from the grid, but not after a soft hyphen's break
        const fine = { grid: { linePitch: 18, characterPitch: 0.01 } };
        const together = linesOf([run("AVAV", "Calibri", 11, { kerning: 1 })], fine)[0].textWidth;
        const split = linesOf([run("AV", "Calibri", 11, { kerning: 1 }), run("AV", "Calibri", 11, { kerning: 1 })], fine)[0].textWidth;
        expect(split).to.be.closeTo(together, 0.011);
        expect(together).to.be.lessThan(linesOf([run("AVAV", "Calibri", 11)], fine)[0].textWidth - 0.1);
        // A space after an ideograph isn't kerned with it
        expect(
            linesOf([run("永 To", "Calibri", 11, { kerning: 1 })], { grid: { linePitch: 18, characterPitch: cell } })[0].unsupported,
        ).to.equal(undefined);
        // Kerned on a grid of lines and characters, with the grid's space after each character
        const [line] = linesOf([kerned], { grid: { linePitch: 18, characterSpace: 1 } });
        expect(line.unsupported).to.equal(undefined);
        expect(line.textWidth).to.be.lessThan(measureTextWidth("To", kerned.type === "text" ? kerned.font : {}) + 2);
        // But not text in a run that doesn't snap to the grid, which is as it is without one, nor on a grid of lines only
        expect(
            unsupportedOf([run("office", "Calibri", 10.5, { ligatures: "standard", snapToGrid: false })], { grid: { characterPitch: 10 } }),
        ).to.equal(undefined);
        expect(unsupportedOf([run("office", "Calibri", 10.5, { ligatures: "standard" })], { grid: { linePitch: 18 } })).to.equal(undefined);
    });
});

describe("right-to-left text, as Word lays it out (scripts/layout-probes/stops2/word-stops-arabic.ts)", () => {
    // cspell:disable
    const ARABIC = { font: "Arial", size: 10, rightToLeft: true } as const;
    const arabic = (value: string, font: TextFont = ARABIC): InlineItem => ({ type: "text", text: value, font });
    // A word of beh and lam-alef, 8.447 points, and a space, 2.78
    const WORD = "بلا";
    const linesOf = (items: readonly InlineItem[], format: ParagraphFormat = {}): readonly LaidOutLine[] =>
        layoutLines(items, { width: 21, format });
    const textsOf = (items: readonly InlineItem[], format: ParagraphFormat = {}): readonly string[] =>
        linesOf(items, format).map((line) => line.text);
    const UNKNOWN =
        "a word beside right-to-left text that fits on its line only without the space after it, which Word hasn't been seen breaking";

    it("should take the space after the last of a line's right-to-left words into the line, in a right-to-left run when a right-to-left word follows it (AR2)", () => {
        // Two words and the space between them, 19.674 points, fit in 21, but not with the space after them
        expect(textsOf([arabic(`${WORD} ${WORD} ${WORD}`)])).to.deep.equal([`${WORD} `, `${WORD} ${WORD}`]);
        // Across runs and bookmarks too
        expect(textsOf([arabic(`${WORD} `), { type: "marker", name: "b" }, arabic(`${WORD} ${WORD}`)])).to.deep.equal([
            `${WORD} `,
            `${WORD} ${WORD}`,
        ]);
        // But not in a right-to-left paragraph, whose lines Word breaks as a left-to-right one's (word-unicode.ts R2, R8)
        expect(textsOf([arabic(`${WORD} ${WORD} ${WORD}`)], { rightToLeft: true })).to.deep.equal([`${WORD} ${WORD} `, WORD]);
    });

    it("should let the space between right-to-left and left-to-right text hang past the end of the line, in runs that aren't right to left (W139, W278)", () => {
        const plain = { font: "Arial", size: 10 } as const;
        // The last right-to-left word, and the last left-to-right one, fit without the space after them
        const ends = linesOf([arabic(`${WORD} ${WORD} abc`, plain)]);
        expect(ends.map((line) => line.text)).to.deep.equal([`${WORD} ${WORD} `, "abc"]);
        expect(ends.map((line) => line.unsupported)).to.deep.equal([undefined, undefined]);
        // "abci", 18.34 points, fits without the space after it
        const starts = linesOf([arabic(`abci ${WORD}`, plain)]);
        expect(starts.map((line) => line.text)).to.deep.equal(["abci ", WORD]);
        expect(starts.map((line) => line.unsupported)).to.deep.equal([undefined, undefined]);
    });

    it("should stop at a word that fits only without the space after it where Word hasn't been seen breaking it", () => {
        // In a right-to-left run beside left-to-right text, and between right-to-left words in a run that isn't right to left
        expect(linesOf([arabic(`${WORD} ${WORD} `), arabic("abc", { font: "Arial", size: 10 })])[0].unsupported).to.equal(UNKNOWN);
        expect(linesOf([arabic(`${WORD} ${WORD} ${WORD}`, { font: "Arial", size: 10 })])[0].unsupported).to.equal(UNKNOWN);
        // But not where it fits with it too, nor where it doesn't fit without it
        expect(layoutLines([arabic(`${WORD} ${WORD} abc`)], { width: 30 })[0].unsupported).to.equal(undefined);
        expect(layoutLines([arabic(`${WORD} ${WORD} abc`)], { width: 18 })[0].unsupported).to.equal(undefined);
    });
    // cspell:enable
});

describe("measureContentWidths", () => {
    const widthsOf = (items: readonly InlineItem[], options = {}): { readonly min: number; readonly max: number } =>
        measureContentWidths(items, { measurer: MEASURER, ...options });

    it("should measure a paragraph's widest word and its widest line, without the spaces at the end", () => {
        expect(widthsOf([text("aa bbbb c   ")])).to.deep.equal({ min: 40, max: 90 });
        // Words in several runs are one word, and a line breaks only at its breaks
        expect(widthsOf([text("aa bb"), text("bb c"), { type: "break", kind: "line", font: {} }, text("dddddddddd")])).to.deep.equal({
            min: 100,
            max: 100,
        });
        expect(widthsOf([{ type: "box", width: 55, height: 10 }, { type: "marker", name: "b" }, text(" a")])).to.deep.equal({
            min: 55,
            max: 75,
        });
        expect(widthsOf([])).to.deep.equal({ min: 0, max: 0 });
    });

    it("should add the paragraph's indents, with the first line's own indent on its first word", () => {
        const format = { indentLeft: 10, indentRight: 5, firstLineIndent: 20 };
        // The first line is aaaa bb, from 30 points in, and bbbbbb can wrap to a line of its own
        expect(widthsOf([text("aaaa bbbbbb")], { format })).to.deep.equal({ min: 75, max: 145 });
        // With spaces before the first word, which stay on the first line
        expect(widthsOf([text("  aaaaaa")], { format: { firstLineIndent: 5 } })).to.deep.equal({ min: 85, max: 85 });
    });

    it("should move the text after a tab to its stop, as on a line as long as it needs", () => {
        // A list's number, then its text at the hanging indent
        const hanging = { indentLeft: 40, firstLineIndent: -40 };
        expect(widthsOf([text("1."), { type: "tab", font: {} }, text("aaa bb")], { format: hanging })).to.deep.equal({ min: 70, max: 100 });
        // Right tab stops line the text after them up to the stop
        const tabStops = [{ position: 100, alignment: "right" as const }];
        expect(widthsOf([text("a"), { type: "tab", font: {} }, text("bb")], { tabStops })).to.deep.equal({ min: 20, max: 100 });
        expect(
            widthsOf([text("a"), { type: "tab", font: {} }, text("bb")], { tabStops: [{ position: 50, alignment: "center" }] }),
        ).to.deep.equal({ min: 20, max: 60 });
        // Past the paragraph's stops, the document's default ones, on any line
        expect(widthsOf([text("a"), { type: "tab", font: {} }, text("b")], { defaultTabStop: 36 })).to.deep.equal({ min: 10, max: 46 });
        expect(
            widthsOf([text("a"), { type: "break", kind: "line", font: {} }, { type: "tab", font: {} }, text("b")], { defaultTabStop: 36 }),
        ).to.deep.equal({ min: 10, max: 46 });
    });

    it("should measure a list number aligned right or centred from before the start of its first line", () => {
        // As in layoutLines: the number "1234." ends at 30 right-aligned, at 55 centred, and at 80 left-aligned
        const format = { indentLeft: 40, firstLineIndent: -10 };
        const items: readonly InlineItem[] = [text("1234."), { type: "tab", font: { listNumber: "separator" } }, text("bbbbbbbbbb")];
        expect(widthsOf(items, { format, numberAlignment: "right" })).to.deep.equal({ min: 140, max: 140 });
        expect(widthsOf(items, { format, numberAlignment: "center" })).to.deep.equal({ min: 140, max: 172 });
        expect(widthsOf(items, { format })).to.deep.equal({ min: 140, max: 208 });
    });

    it("should measure with the widths of the fonts by default", () => {
        const { min, max } = measureContentWidths([{ type: "text", text: "two words", font: { font: "Calibri", size: 11 } }], {});
        expect(min).to.be.closeTo(measureTextWidth("words", { font: "Calibri", size: 11 }), 0.001);
        expect(max).to.be.closeTo(measureTextWidth("two words", { font: "Calibri", size: 11 }), 0.001);
    });
});

describe("soft hyphens", () => {
    // cspell:ignore abbcc abbccddd bbbccc bbccddd bbcccc dampf Donaudampf Donaudampfschiff Donaudampfschifffahrts fahrts narily ordi schiff
    // cspell:ignore Donaudampfschifffahrtsgesellschaft Donaudampfschifffahrt dampfschifffahrt ccddd haftDonaudampfschiff
    // cspell:ignore rtsgesellschaftDonau hrtsgesellschaft gesellschaft
    const softHyphen = (font: TextFont = {}): InlineItem => ({ type: "softHyphen", font });
    const linesOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): readonly LaidOutLine[] =>
        layoutLines(items, { width: 100, measurer: MEASURER, ...options });

    it("should break a word at a soft hyphen, with a hyphen at the end of the line, and give it no room elsewhere", () => {
        // "aaaa bbbccc" is 110 points: "aaaa bbb" and its hyphen end at 90
        const broken = linesOf([text("aaaa bbb"), softHyphen(), text("ccc")]);
        expect(broken.map(({ text: value, textWidth }) => [value, textWidth])).to.deep.equal([
            ["aaaa bbb", 90],
            ["ccc", 30],
        ]);
        // On one line, it takes no room
        expect(linesOf([text("aa bb"), softHyphen(), text("cc")]).map(({ textWidth }) => textWidth)).to.deep.equal([70]);
        // After a space, or at the start, the line can break there anyway
        expect(linesOf([text("aa "), softHyphen(), text("bb")]).map(({ text: value }) => value)).to.deep.equal(["aa bb"]);
        expect(linesOf([softHyphen(), text("aa")]).map(({ text: value }) => value)).to.deep.equal(["aa"]);
    });

    it("should break at the last soft hyphen whose part fits with its hyphen, and again on the next line", () => {
        const word = [text("a"), softHyphen(), text("bb"), softHyphen(), text("cc"), softHyphen(), text("ddd")];
        // "x abbcc-" is 80 points, and fits a line of 82, and of 80, as a word that ends at the end of the line does
        // (word-stops-text2.ts SH16a to SH16l)
        for (const width of [82, 80]) {
            expect(linesOf([text("x "), ...word], { width }).map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
                ["x abbcc", undefined],
                ["ddd", undefined],
            ]);
        }
        expect(linesOf([text("xxxxx "), ...word], { width: 82 }).map(({ text: value }) => value)).to.deep.equal(["xxxxx a", "bbccddd"]);
        // A hyphen that ends past the end of the line doesn't fit, so it breaks at the soft hyphen before
        expect(linesOf([text("x "), ...word], { width: 79.9 }).map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["x abb", undefined],
            ["ccddd", undefined],
        ]);
        // No part fits: the word goes on to the next line, where it fits whole
        expect(linesOf([text("xxxxxxx "), ...word], { width: 90 }).map(({ text: value }) => value)).to.deep.equal(["xxxxxxx ", "abbccddd"]);
        // The part before it fits, but not with its hyphen: it goes on to the next line whole
        expect(
            linesOf([text("aaaaa bbbb"), softHyphen(), text("cc")]).map(({ text: value, unsupported }) => [value, unsupported]),
        ).to.deep.equal([
            ["aaaaa ", undefined],
            ["bbbbcc", undefined],
        ]);
    });

    it("should mark a line beside a drawing that a word with soft hyphens doesn't fit in, as how Word breaks it there isn't known", () => {
        const lines = linesOf([text("aa bbb"), softHyphen(), text("ccc")], { width: (line) => (line === 0 ? 60 : { start: 0, end: 40 }) });
        expect(lines.map(({ unsupported }) => unsupported)).to.include("a word with a soft hyphen beside a drawing it doesn't fit beside");
    });

    it("should squeeze a word with soft hyphens onto a justified line whole, as a word without them", () => {
        // "a a a a a a a a a " is 180 points with 9 spaces, and "bbc" goes 10 past a line of 200: a ninth of the spaces
        const justified = { width: 200, format: { alignment: "justified" as const } };
        const squeezed = linesOf([text("a a a a a a a a a bb"), softHyphen(), text("c")], justified);
        expect(squeezed.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([["a a a a a a a a a bbc", undefined]]);
    });

    it("should break a word longer than its line at its soft hyphens, on each line", () => {
        expect(
            linesOf([text("aaaaaaa"), softHyphen(), text("bbbbbbb")]).map(({ text: value, unsupported }) => [value, unsupported]),
        ).to.deep.equal([
            ["aaaaaaa", undefined],
            ["bbbbbbb", undefined],
        ]);
    });

    it("should make the line as tall as its hyphen's font", () => {
        expect(linesOf([text("aaaa bbb"), softHyphen({ size: 20 }), text("ccc")]).map(({ height }) => height)).to.deep.equal([20, 10]);
    });

    it("should break a justified line at a soft hyphen whose part fits squeezed, as Word does", () => {
        // "a a a a a a a a a " is 180 points with 9 spaces. "bbcccc" doesn't fit squeezed onto a line of 200, but "bb" and its
        // hyphen do, 10 past its end, as "Donau-" did in word-stops-tabs.ts SH10d
        const justified = { width: 200, format: { alignment: "justified" as const } };
        const squeezed = linesOf([text("a a a a a a a a a bb"), softHyphen(), text("cccc")], justified);
        expect(squeezed.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["a a a a a a a a a bb", undefined],
            ["cccc", undefined],
        ]);
        // No part fits even squeezed: the word goes on to the next line, as on a line that isn't justified
        const moved = linesOf([text("a a a a a a a a a bbbb"), softHyphen(), text("cc")], justified);
        expect(moved.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["a a a a a a a a a ", undefined],
            ["bbbbcc", undefined],
        ]);
    });

    it("should take a shorter part as it is rather than squeeze a longer one, unless it leaves twice as much room, as Word does", () => {
        // "a a a a a a a a a b-" ends at 200, and "a a a a a a a a a bbb-" 220, 15 past a line of 205, which its spaces of 90
        // can be squeezed by: their 5 to stretch with "b-" are less than twice that, so Word takes "b-" (word-stops-text2.ts
        // SH17: "Do-" with 200 twips to spare rather than "Donau-" 136 past the end)
        const items = [text("a a a a a a a a a b"), softHyphen(), text("bb"), softHyphen(), text("cccc")];
        const justified = (
            width: number,
            alignment: "justified" | "distributed" = "justified",
        ): readonly (readonly (string | undefined)[])[] =>
            linesOf(items, { width, format: { alignment } }).map(({ text: value, unsupported }) => [value, unsupported]);
        expect(justified(205)).to.deep.equal([
            ["a a a a a a a a a b", undefined],
            ["bbcccc", undefined],
        ]);
        // With 15 to stretch and 5 to squeeze, which Word hasn't been seen with, nor a distributed line, it squeezes it
        const reason = "a line that fits a soft hyphen's part squeezed, and a shorter one as it is with twice as much room or more";
        expect(justified(215)).to.deep.equal([
            ["a a a a a a a a a bbb", reason],
            ["cccc", undefined],
        ]);
        expect(justified(205, "distributed")[0][1]).to.equal(reason);
    });

    it("should break a word with soft hyphens whose first part is longer than its line as a word without them", () => {
        // After the last letter that fits, as Word broke it (word-stops-tabs.ts SH12)
        const long = linesOf([text("aaaaaaaaaaaa"), softHyphen(), text("b")]);
        expect(long.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["aaaaaaaaaa", undefined],
            ["aab", undefined],
        ]);
    });

    it("should break a word with a border at a soft hyphen, as Word does", () => {
        // word-stops-tabs.ts SH11
        const boxed = { type: "text", text: "bbb", font: { border: { room: 1, key: "a" } } } as const;
        const lines = linesOf([text("aaaa "), boxed, softHyphen(), text("cccc")]);
        expect(lines.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["aaaa bbb", undefined],
            ["cccc", undefined],
        ]);
    });

    it("should break lines at soft hyphens where Word broke the probes' lines", () => {
        // word-breaks-and-tabs SH2: in Calibri 11, a line of 9026 twips whose last word's first part ends this many twips
        // short of its end, as the probe's character spacing of whole twips put it, rather than the 10 to 90 it meant: Word
        // moves the word on to the next line for 6.3 to 66.3, whose hyphen of 67.3 goes past the end, and breaks it after
        // "Donau" for 90.4, its hyphen ending at 9002.9
        const font = { font: "Calibri", size: 11 };
        const donau = measureTextWidth(" Donau", font);
        const lineFor = (twips: number): readonly LaidOutLine[] =>
            layoutLines(
                [
                    { type: "box", width: 9026 / 20 - twips / 20 - donau, height: 1, font },
                    { type: "text", text: " Donau", font },
                    softHyphen(font),
                    { type: "text", text: "dampfschifffahrt", font },
                ],
                { width: 9026 / 20 },
            );
        for (const twips of [6.3, 30.4, 48.3, 66.3]) {
            expect(lineFor(twips).map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
                [" ", undefined],
                ["Donaudampfschifffahrt", undefined],
            ]);
        }
        const broken = lineFor(90.4);
        expect(broken.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            [" Donau", undefined],
            ["dampfschifffahrt", undefined],
        ]);
        expect(broken[0].textWidth * 20).to.be.closeTo(9002.9, 5);
        // word-stops-text2.ts SH16a: the hyphen of "eeeee-" ending 3.5 twips short of the end, which Word breaks at
        const eeeee = measureTextWidth("eeeee-", font);
        const close = layoutLines(
            [
                { type: "box", width: 9026 / 20 - 3.5 / 20 - eeeee, height: 1, font },
                { type: "text", text: "eeeee", font },
                softHyphen(font),
                { type: "text", text: "continuation and more", font },
            ],
            { width: 9026 / 20 },
        );
        expect(close.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["eeeee", undefined],
            ["continuation and more", undefined],
        ]);
        // SH17: a justified line where "Do-" fits with 200 twips to spare, and "Donau-" only squeezed: Word takes "Do-"
        const before = "SH17 of the by in to and on of the by in to and on of the by in Do";
        const [first] = layoutLines(
            [
                { type: "text", text: before, font },
                softHyphen(font),
                { type: "text", text: "nau", font },
                softHyphen(font),
                { type: "text", text: "dampf", font },
                softHyphen(font),
                { type: "text", text: "schiff the in foot mouth made on river", font },
            ],
            { width: Math.round(measureTextWidth(`${before}-`, font) * 20 + 200) / 20, format: { alignment: "justified" } },
        );
        expect([first.text, first.unsupported]).to.deep.equal([before, undefined]);
        // SH1a to SH1e: a justified line whose last word, with soft hyphens in it, fits only with its spaces 3% to 20%
        // narrower, which Word squeezes onto it whole
        const filler = Array.from({ length: 12 }, () => " the").join("");
        const space = measureTextWidth(" ", font);
        for (const share of [0.03, 0.06, 0.1, 0.15, 0.2]) {
            const over = share * 13 * space;
            const [squeezed] = layoutLines(
                [
                    { type: "box", width: 9026 / 20 + over - measureTextWidth(`${filler} Donaudampfschiff`, font), height: 1, font },
                    { type: "text", text: `${filler} Donau`, font },
                    softHyphen(font),
                    { type: "text", text: "dampf", font },
                    softHyphen(font),
                    { type: "text", text: "schiff the end", font },
                ],
                { width: 9026 / 20, format: { alignment: "justified" } },
            );
            expect([share, squeezed.text.trimEnd().split(" ").at(-1), squeezed.unsupported]).to.deep.equal([
                share,
                "Donaudampfschiff",
                undefined,
            ]);
        }
        // SH4: a word with soft hyphens longer than a line, which Word broke after "Donaudampfschiff", its hyphen ending at
        // 8557.1 twips, and after "Donau", at 8673.8, and whose last line ended at 3025.0
        const parts = ["Donau", "dampf", "schiff", "fahrts", "gesellschaft"];
        const long = layoutLines(
            [
                { type: "text", text: "SH4 ", font },
                ...Array.from({ length: 6 }, () => parts)
                    .flat()
                    .flatMap((part, index): readonly InlineItem[] => [
                        ...(index === 0 ? [] : [softHyphen(font)]),
                        { type: "text", text: part, font },
                    ]),
                { type: "text", text: " end", font },
            ],
            { width: 9026 / 20 },
        );
        expect(long.map(({ text: value, unsupported }) => [value.slice(-20), unsupported])).to.deep.equal([
            ["haftDonaudampfschiff", undefined],
            ["rtsgesellschaftDonau", undefined],
            ["hrtsgesellschaft end", undefined],
        ]);
        [8557.1, 8673.8, 3025.0].forEach((edge, index) => expect(long[index].textWidth * 20).to.be.closeTo(edge, 5));
    });

    it("should break a long German word at its soft hyphens where Word breaks it", () => {
        // word-watertight-text TX10a: in Calibri 11, a line of 9026 twips, Word's 12 lines end with these parts, 8 of them
        // with a hyphen, which ends each line at 8856.7, 8823.0, 8193.8, 8877.9, 8597.8 and 8781.7 twips
        const font = { font: "Calibri", size: 11 };
        const part = (value: string): InlineItem => ({ type: "text", text: value, font });
        const items: readonly InlineItem[] = [
            part("TX10a"),
            ...Array.from({ length: 30 }, () => [
                part(" Donau"),
                softHyphen(font),
                part("dampf"),
                softHyphen(font),
                part("schiff"),
                softHyphen(font),
                part("fahrts"),
                softHyphen(font),
                part("gesellschaft"),
            ]).flat(),
        ];
        const lines = layoutLines(items, { width: 9026 / 20 });
        const whole = "Donaudampfschifffahrtsgesellschaft";
        expect(lines.map(({ text: value }) => value.trimEnd().split(" ").at(-1))).to.deep.equal([
            "Donaudampfschiff",
            "Donau",
            "Donaudampfschifffahrts",
            "Donaudampf",
            whole,
            "Donaudampfschifffahrts",
            "Donaudampf",
            whole,
            "Donaudampfschifffahrts",
            "Donaudampf",
            whole,
            whole,
        ]);
        [8856.7, 8823.0, 8193.8, 8877.9, 8597.8, 8781.7].forEach((edge, index) =>
            expect(lines[index].textWidth * 20).to.be.closeTo(edge, 5),
        );
        // TX10d and TX10e: a word with soft hyphens in a line is as wide as without, 1318.1 and 1318.0 twips
        const inLine = layoutLines([part("TX10d extra"), softHyphen(font), part("ordi"), softHyphen(font), part("narily end")], {
            width: 9026 / 20,
        });
        expect(inLine[0].textWidth).to.be.closeTo(measureTextWidth("TX10d extraordinarily end", font), 0.001);
    });
});

describe("decimal tab stops", () => {
    const tab: InlineItem = { type: "tab", font: {} };
    const decimal = { tabStops: [{ position: 60, alignment: "decimal" as const }] };
    const lineOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = decimal): LaidOutLine =>
        layoutLines(items, { width: 100, measurer: MEASURER, ...options })[0];

    it("should line up a number's full stop with the stop, and the end of a number without one", () => {
        // "12" ends at the stop at 60, and ".5" after it
        expect(lineOf([text("a"), tab, text("12.5")]).textWidth).to.equal(80);
        expect(lineOf([text("a"), tab, text("-0.25")]).textWidth).to.equal(90);
        expect(lineOf([text("a"), tab, text("7")]).textWidth).to.equal(60);
        // Spaces after it, and bookmarks, don't count
        const marked = lineOf([text("a"), tab, { type: "marker", name: "m" }, text("12.5  ")]);
        expect([marked.textWidth, marked.unsupported]).to.deep.equal([80, undefined]);
        expect(measureContentWidths([text("a"), tab, text("12.5")], { measurer: MEASURER, ...decimal }).max).to.equal(80);
    });

    it("should line up text at its first full stop, or at the end of a number before it, as Word does", () => {
        const at = (value: string): number => lineOf([text("a"), tab, text(value)], { ...decimal, width: 200 }).textWidth;
        // "$1,2" before the full stop ends at the stop at 60
        expect([at("$1,2.5"), at("12.5%"), at("(3.5)"), at("x 1.5"), at("a.b"), at("1.2.3"), at("e.g. 7"), at(".75")]).to.deep.equal([
            80, 90, 90, 80, 80, 100, 110, 90,
        ]);
        // Its end, with no full stop and no number, or a number that goes on to its end
        expect([at("abc"), at("1,5"), at("-")]).to.deep.equal([60, 60, 60]);
        // The end of a number that ends at a space before the full stop
        expect(at("1 23.5")).to.equal(110);
        // A picture after it is after the stop
        expect(
            lineOf([text("a"), tab, text("1.5"), { type: "box", width: 10, height: 10 }], { ...decimal, width: 200 }).textWidth,
        ).to.equal(90);
        expect(measureContentWidths([text("a"), tab, text("abc")], { measurer: MEASURER, ...decimal }).max).to.equal(60);
    });

    it("should line up the end of a number that ends at anything but a full stop, with the commas in it", () => {
        // word-stops-tabs TA6f, TA6j: Word lines up "12%" at the end of its "12", and "12, 34" at the end of its "12,"
        const at = (value: string): LaidOutLine => lineOf([text("a"), tab, text(value)], { ...decimal, width: 200 });
        expect(["12%", "1, 2.5", "12, 5", "1,"].map((value) => [at(value).textWidth, at(value).unsupported])).to.deep.equal([
            [70, undefined],
            [100, undefined],
            [80, undefined],
            [60, undefined],
        ]);
        expect(measureContentWidths([text("a"), tab, text("12%")], { measurer: MEASURER, ...decimal }).max).to.equal(70);
    });

    it("should stop at a picture before where text at a decimal stop lines up, as Word hasn't been seen lining it up", () => {
        expect(lineOf([text("a"), tab, { type: "box", width: 10, height: 10 }, text("1.5")]).unsupported).to.equal(
            "text at a decimal tab stop that Word hasn't been seen lining up",
        );
        // In the widths of a table's columns, it is as wide as at a right stop
        expect(
            measureContentWidths([text("a"), tab, { type: "box", width: 10, height: 10 }, text("1.5")], { measurer: MEASURER, ...decimal })
                .max,
        ).to.equal(60);
    });

    it("should line up text with a decimal stop where Word lined up the probes' text", () => {
        // word-breaks-and-tabs DT1 to DT15: in Calibri 11, at a decimal stop at 4000 twips, Word's text ends at these
        const font = { font: "Calibri", size: 11 };
        const tabStops = [{ position: 200, alignment: "decimal" as const }];
        for (const [written, edge] of [
            ["$1,234.50", 4279.2],
            ["12.5%", 4325.0],
            ["abc", 4000.3],
            ["a.b", 4171.4],
            ["1.2.3", 4334.7],
            ["x 1.5", 4167.4],
            ["1.5 x", 4312.4],
            ["(3.25)", 4345.4],
            ["1,5", 4000.5],
            [".75", 4278.9],
            ["12.", 4055.6],
            ["Total 12.50", 4278.7],
            ["1 234.5", 4551.8],
            ["-", 4000.2],
            ["e.g. 7", 4376.5],
        ] as const) {
            const [line] = layoutLines(
                [
                    { type: "text", text: "DT", font },
                    { type: "tab", font },
                    { type: "text", text: written, font },
                ],
                { width: 9026 / 20, tabStops },
            );
            expect([written, line.unsupported]).to.deep.equal([written, undefined]);
            expect(line.textWidth * 20).to.be.closeTo(edge, 5);
        }
    });

    it("should line up numbers with a decimal stop where Word lines them up", () => {
        // word-watertight-text TX12a: in Calibri 11, at a decimal stop at 4000 twips, Word's numbers end at these
        const font = { font: "Calibri", size: 11 };
        const tabStops = [{ position: 200, alignment: "decimal" as const }];
        for (const [written, edge] of [
            ["12.5", 4167.6],
            ["1234.56", 4279.1],
            ["7", 4000.4],
            ["-0.25", 4279.1],
        ] as const) {
            const [line] = layoutLines(
                [
                    { type: "text", text: "TX12a", font },
                    { type: "tab", font },
                    { type: "text", text: written, font },
                ],
                {
                    width: 9026 / 20,
                    tabStops,
                },
            );
            expect(line.textWidth * 20).to.be.closeTo(edge, 5);
        }
    });
});

describe("tab stops past the end of the line", () => {
    const tab: InlineItem = { type: "tab", font: {} };
    const linesOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions>): readonly LaidOutLine[] =>
        layoutLines(items, { width: 100, measurer: MEASURER, ...options });
    const at = (alignment: "left" | "right" | "center" | "decimal", position = 150) => ({ tabStops: [{ position, alignment }] });

    it("should line up the text after a right stop past the end of the line with the end, as Word does", () => {
        // word-watertight-text TX12c: a right stop at 10000 twips puts the text's right edge at the margin at 9026
        expect(linesOf([text("a"), tab, text("bb")], at("right")).map(({ textWidth }) => textWidth)).to.deep.equal([100]);
        // word-stops-tabs TA3a to TA3d: at the start of a line, after a right, centred or decimal stop, and in a paragraph
        // indented on the left after a right stop
        for (const alignment of ["right", "center", "decimal"] as const) {
            expect(linesOf([tab, text("bb")], at(alignment)).map(({ textWidth, unsupported }) => [textWidth, unsupported])).to.deep.equal([
                [100, undefined],
            ]);
        }
        const [indented] = linesOf([tab, text("bb")], { ...at("right"), format: { indentLeft: 10 } });
        expect([indented.textWidth, indented.unsupported]).to.deep.equal([90, undefined]);
    });

    it("should put the text after a left stop past the end of the line two lines down, as Word does", () => {
        // word-watertight-text TX12d: a left stop at 9500 twips puts the tab on the next line, and the text at the start of
        // the one after
        const lines = linesOf([text("a"), tab, { type: "marker", name: "m" }, text("bb")], at("left"));
        expect(lines.map(({ text: value, textWidth, markers }) => [value, textWidth, markers])).to.deep.equal([
            ["a", 10, []],
            ["\t", 0, []],
            ["bb", 20, ["m"]],
        ]);
        // A default stop past the end, after the paragraph's own stops, goes on to the next line
        expect(linesOf([text("aaaaaaaa"), tab, text("b")], at("left", 50)).map(({ text: value }) => value)).to.deep.equal([
            "aaaaaaaa",
            "\tb",
        ]);
    });

    it("should line up the text after centred and decimal stops past the end of the line with the end, as Word does", () => {
        // word-breaks-and-tabs TP1, TP2: centred and decimal stops at 9800 twips put the text's right edge at the margin
        expect(linesOf([text("a"), tab, text("bb")], at("center")).map(({ textWidth }) => textWidth)).to.deep.equal([100]);
        expect(linesOf([text("a"), tab, text("1.5")], at("decimal")).map(({ textWidth }) => textWidth)).to.deep.equal([100]);
        // TP5: a right stop past the margin, in a paragraph indented on the right, at the indent
        expect(linesOf([text("a"), tab, text("bb")], { ...at("right"), format: { indentRight: 20 } })[0].textWidth).to.equal(80);
        // TP7: text that doesn't fit before the end goes on to the next line, and lines up with its end
        expect(
            linesOf([text("aaaaaaaa"), tab, text("bbb")], at("right")).map(({ text: value, textWidth }) => [value, textWidth]),
        ).to.deep.equal([
            ["aaaaaaaa", 80],
            ["\tbbb", 100],
        ]);
    });

    it("should give a left stop past the end of the line a line of its own, and put the text after it on the next, as Word does", () => {
        // word-breaks-and-tabs TP3, TP4, word-stops-tabs.docx TA8a to TA8g: at the start of a paragraph, the tab takes its
        // first line, and the text goes on the next; after text, in a paragraph indented on the left or the right too, the
        // tab takes the next line, and the text the one after, at the indent. TA1a, TA1b: with a first line or hanging
        // indent too, the text going at the start of its line, the left indent
        expect(
            linesOf([tab, text("bb")], at("left")).map(({ text: value, textWidth, unsupported }) => [value, textWidth, unsupported]),
        ).to.deep.equal([
            ["\t", 0, undefined],
            ["bb", 20, undefined],
        ]);
        for (const format of [{ indentLeft: 10 }, { indentRight: 10 }, { firstLineIndent: 10 }, { firstLineIndent: -10, indentLeft: 10 }]) {
            const indented = linesOf([text("a"), tab, text("bb")], { ...at("left"), format });
            expect(indented.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
                ["a", undefined],
                ["\t", undefined],
                ["bb", undefined],
            ]);
        }
    });

    it("should line up the text after a stop past the right indent with it, as far as the margin, as Word does", () => {
        // word-breaks-and-tabs TP6, TP9: with a right indent of 1000 twips, a left stop at 8500 puts the text there, past the
        // indent at 8026, and a right stop at 8500 ends it there
        const indented = { format: { indentRight: 20 } };
        expect(linesOf([text("a"), tab, text("b")], { ...at("left", 85), ...indented })[0]).to.include({ text: "a\tb", textWidth: 95 });
        expect(linesOf([text("a"), tab, text("bb")], { ...at("right", 90), ...indented })[0]).to.include({ text: "a\tbb", textWidth: 90 });
        // word-stops-tabs TA4a, TA4b: a centred stop at 8000 centres the text on it, and a decimal one lines up its full stop
        const [centred] = linesOf([text("a"), tab, text("bb")], { ...at("center", 85), ...indented });
        expect([centred.textWidth, centred.unsupported]).to.deep.equal([95, undefined]);
        const [decimal] = linesOf([text("a"), tab, text("1.")], { ...at("decimal", 85), ...indented });
        expect([decimal.textWidth, decimal.unsupported]).to.deep.equal([95, undefined]);
    });

    it("should line up the text after a right, centred or decimal stop past the end of the line with it whatever the indents, as Word does", () => {
        // word-stops-text2.ts TA10a to TA10f: after text, with a first line or hanging indent; TA10h, TA10i: at the start of a
        // line and after text, indented on the left
        const formats = [
            { indentLeft: 0, firstLineIndent: 10 },
            { indentLeft: 10, firstLineIndent: -10 },
            { indentLeft: 10, firstLineIndent: 0 },
        ];
        for (const format of formats) {
            for (const alignment of ["right", "center", "decimal"] as const) {
                const [line] = linesOf([text("a"), tab, text("b")], { ...at(alignment), format });
                const start = format.indentLeft + format.firstLineIndent;
                expect([alignment, start + line.textWidth, line.unsupported]).to.deep.equal([alignment, 100, undefined]);
            }
        }
        for (const alignment of ["center", "decimal"] as const) {
            const [line] = linesOf([tab, text("b")], { ...at(alignment), format: { indentLeft: 10 } });
            expect([10 + line.textWidth, line.unsupported]).to.deep.equal([100, undefined]);
        }
    });

    it("should take a tab on to the next line with a word that doesn't fit after it, and break the word there, as Word does", () => {
        // word-stops-text2.ts TA11a: "afterwards" after a left stop at 8800 twips doesn't fit before 9026, so the tab goes on to
        // the next line with it, and it breaks there after "af"; TA11b, word-stops-tabs.ts TA1c: past the margin, in a
        // paragraph indented past it
        const lines = (items: readonly InlineItem[], options: Partial<LineLayoutOptions>): readonly (readonly (string | undefined)[])[] =>
            linesOf(items, options).map(({ text: value, unsupported }) => [value, unsupported]);
        expect(lines([text("a"), tab, { type: "marker", name: "m" }, text("bbb")], at("left", 80))).to.deep.equal([
            ["a", undefined],
            ["\tbb", undefined],
            ["b", undefined],
        ]);
        expect(lines([text("a"), tab, text("bbb")], { ...at("left", 105), format: { indentRight: -20 } })).to.deep.equal([
            ["a", undefined],
            ["\tb", undefined],
            ["bb", undefined],
        ]);
        // At the start of a line, the word breaks after the tab
        expect(lines([tab, text("bbb")], at("left", 80))).to.deep.equal([
            ["\tbb", undefined],
            ["b", undefined],
        ]);
        // A word that fits after the tab on the next line goes there whole, and a word after a space stays with the space
        expect(lines([text("aaaaa"), tab, text("bbbbb")], {})).to.deep.equal([
            ["aaaaa", undefined],
            ["\tbbbbb", undefined],
        ]);
        expect(lines([text("aaaaa"), tab, text(" bbbb")], at("left", 70))).to.deep.equal([
            ["aaaaa\t ", undefined],
            ["bbbb", undefined],
        ]);
        // A word with soft hyphens breaks at one after the tab, where its part and hyphen fit (word-stops-text2.ts SH16a)
        const hyphened = [text("a"), tab, text("bb"), { type: "softHyphen", font: {} } as const, text("cccc")];
        expect(lines(hyphened, at("left", 60))).to.deep.equal([
            ["a\tbb", undefined],
            ["cccc", undefined],
        ]);
        // One whose first part doesn't fit, which Word hasn't been seen with, takes the tab on to the next line, guessing
        expect(lines(hyphened, at("left", 80))).to.deep.equal([
            ["a", "a word with soft hyphens whose first part doesn't fit after a tab"],
            ["\t", "a word with soft hyphens that doesn't fit after a tab that starts its line"],
            ["bbcccc", undefined],
        ]);
        // A picture after a tab, a word with soft hyphens after a tab that starts its line, and a word after tabs in a row,
        // haven't been seen
        const picture: InlineItem = { type: "box", width: 40, height: 10 };
        expect(lines([text("a"), tab, picture], at("left", 70))[0][1]).to.equal("a picture that doesn't fit after a tab");
        expect(lines([tab, picture], at("left", 70))[0][1]).to.equal("a picture that doesn't fit after a tab that starts its line");
        expect(
            lines([text("a"), tab, tab, text("bbb")], {
                tabStops: [
                    { position: 60, alignment: "left" },
                    { position: 80, alignment: "left" },
                ],
            })[0][1],
        ).to.equal("a word that doesn't fit after tabs in a row");
        expect(lines([tab, text("bb"), { type: "softHyphen", font: {} }, text("bb")], at("left", 80))[0][1]).to.equal(
            "a word with soft hyphens that doesn't fit after a tab that starts its line",
        );
    });

    it("should stop at a stop past the end of the line, or the right indent, that Word hasn't been seen with", () => {
        const unsupportedOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions>): string | undefined =>
            linesOf(items, options)[0].unsupported;
        const indented = (format: object) => ({ format });
        // A left one at the start of a line indented, or with a first line indent; and any in a paragraph indented past the
        // margin
        const leftStop = "a left tab stop past the end of the line at the start of a line in an indented paragraph";
        expect(unsupportedOf([tab, text("b")], { ...at("left"), ...indented({ firstLineIndent: 10 }) })).to.equal(leftStop);
        expect(unsupportedOf([tab, text("b")], { ...at("left"), ...indented({ indentLeft: 10 }) })).to.equal(leftStop);
        expect(unsupportedOf([text("a"), tab, text("b")], { ...at("left"), ...indented({ indentRight: -10 }) })).to.equal(
            "a tab stop past the end of the line in a paragraph indented past the margin",
        );
        // Centred and decimal ones in a paragraph indented on the right, and a right one at the start of a line there
        const rightStop =
            "a centred or decimal tab stop past the end of the line in a paragraph indented on the right, or a right one at the start of a line there";
        expect(unsupportedOf([tab, text("b")], { ...at("right"), ...indented({ indentRight: 10 }) })).to.equal(rightStop);
        expect(unsupportedOf([text("a"), tab, text("b")], { ...at("center"), ...indented({ indentRight: 10 }) })).to.equal(rightStop);
        // Past the right indent: a distributed line, and text after a left stop past the margin. In a justified line, the text
        // after a right stop too long for the room before it starts at the tab, and the line goes on to the margin
        // (word-stops-text2.ts TA10g)
        expect(
            unsupportedOf([text("a"), tab, text("b")], { ...at("right", 85), format: { indentRight: 20, alignment: "distributed" } }),
        ).to.equal("a tab stop past the paragraph's right indent in a distributed line");
        const [justified] = linesOf([text("a"), tab, text("bbbbbbbbb")], {
            ...at("right", 85),
            format: { indentRight: 20, alignment: "justified" },
        });
        expect([justified.text, justified.textWidth, justified.unsupported]).to.deep.equal(["a\tbbbbbbbbb", 100, undefined]);
        expect(unsupportedOf([text("a"), tab, text("bbbbb")], { ...at("left", 85), format: { indentRight: 20 } })).to.equal(
            "text after a tab stop past the paragraph's right indent that goes past the margin",
        );
    });

    it("should put the text after tabs past the end of the line where Word puts it", () => {
        // word-watertight-text TX12c, TX12d, TX12e: in Calibri 11, a right stop at 10000 twips and at 9026 put "right" at the
        // margin, its right edge at 9026.3, and a left stop at 9500 puts the tab on the next line, and "left" at the start of
        // the one after
        const font = { font: "Calibri", size: 11 };
        const items = (label: string, after: string): readonly InlineItem[] => [
            { type: "text", text: label, font },
            { type: "tab", font },
            { type: "text", text: after, font },
        ];
        const stop = (alignment: "left" | "right", twips: number) => ({
            width: 9026 / 20,
            tabStops: [{ position: twips / 20, alignment }],
        });
        expect(layoutLines(items("TX12c", "right"), stop("right", 10000)).map(({ textWidth }) => textWidth * 20)).to.deep.equal([9026]);
        expect(layoutLines(items("TX12e", "right"), stop("right", 9026)).map(({ textWidth }) => textWidth * 20)).to.deep.equal([9026]);
        expect(layoutLines(items("TX12d", "left"), stop("left", 9500)).map(({ text: value }) => value)).to.deep.equal([
            "TX12d",
            "\t",
            "left",
        ]);
        // word-breaks-and-tabs TP1 to TP9: "centred" and "12.5" after centred and decimal stops at 9800 end at 9026.0 and
        // 9026.5; "TP3 left" after a left stop at 9500 at the start of the paragraph goes on the line after the tab's, 683.0
        // long; with a left indent of 1000, "left" goes on the line after the tab's; with a right indent of 1000, "right" after a stop at 10000 ends at
        // 8026.3, "left" after one at 8500 ends at 8801.0, and "right" after one at 8500 at 8500.3; and "right" after a stop
        // at 10000 that doesn't fit after 49 m's goes on to the next line, ending at 9026.3
        const widthsOf = (laidOut: readonly LaidOutLine[]): readonly number[] => laidOut.map(({ textWidth }) => textWidth * 20);
        const withStop = (alignment: TabStop["alignment"], twips: number, format = {}) => ({
            ...stop("left", twips),
            tabStops: [{ position: twips / 20, alignment }],
            format,
        });
        expect(widthsOf(layoutLines(items("TP1 text", "centred"), withStop("center", 9800)))).to.deep.equal([9026]);
        expect(widthsOf(layoutLines(items("TP2 text", "12.5"), withStop("decimal", 9800)))).to.deep.equal([9026]);
        const startOfLine = layoutLines(
            [
                { type: "tab", font },
                { type: "text", text: "TP3 left", font },
            ],
            withStop("left", 9500),
        );
        expect(widthsOf(startOfLine)[1]).to.be.closeTo(683.0, 5);
        expect(
            layoutLines(items("TP4 text", "left"), withStop("left", 9500, { indentLeft: 50 })).map(({ text: value }) => value),
        ).to.deep.equal(["TP4 text", "\t", "left"]);
        expect(widthsOf(layoutLines(items("TP5 text", "right"), withStop("right", 10000, { indentRight: 50 })))).to.deep.equal([8026]);
        expect(widthsOf(layoutLines(items("TP6 text", "left"), withStop("left", 8500, { indentRight: 50 })))[0]).to.be.closeTo(8801.0, 5);
        expect(widthsOf(layoutLines(items("TP9 text", "right"), withStop("right", 8500, { indentRight: 50 })))).to.deep.equal([8500]);
        const pushed = layoutLines(items(`TP7 ${"m".repeat(49)}`, "right"), withStop("right", 10000));
        expect(pushed.map(({ text: value }) => value.slice(-6))).to.deep.equal(["mmmmmm", "\tright"]);
        expect(widthsOf(pushed)[1]).to.equal(9026);
        // word-stops-text2.ts TA11a: "afterwards" after a left stop at 8800 goes on to the next line with the tab, where "af"
        // ends at 8973, and "terwards" goes on the line after
        const moved = layoutLines(items("TA11a text", "afterwards"), withStop("left", 8800));
        expect(moved.map(({ text: value }) => value)).to.deep.equal(["TA11a text", "\taf", "terwards"]);
        expect(widthsOf(moved)[1]).to.be.closeTo(8973, 5);
    });
});

describe("layoutLines in compatibility mode, as Word lays it out (scripts/layout-probes/stops2/word-stops-compat-mode.ts)", () => {
    // Each character is 10 points wide, so is each space
    const older = { measurer: MEASURER, compatibilityMode: 14 };

    it("should break a justified line where it breaks one aligned left, without squeezing its spaces, as Word 2010 and before do", () => {
        // word-stops-compat-14.docx CM1: "aa ... bbbb" squeezes onto a line of 325 in Word 2013's mode, and not in 2010's
        const items = [text(`aa aa aa aa aa aa aa aa aa aa bbbb ${"c".repeat(30)}`)];
        const count = (options: Partial<LineLayoutOptions>): number =>
            layoutLines(items, { width: 325, measurer: MEASURER, format: { alignment: "justified" }, ...options }).length;
        expect(count({})).to.equal(2);
        expect(count({ compatibilityMode: 14 })).to.equal(3);
        // Nor with spaces Word hasn't been seen squeezing among them
        const other = [text("aa aa aa aa aa aa aa aa aa\u2003aa bbbb")];
        expect(layoutLines(other, { width: 325, format: { alignment: "justified" }, ...older })).to.have.length(2);
    });

    it("should put a tab to a stop past the end of the line at its stop, with the rest of the paragraph on the line, as Word 2010 and before do", () => {
        // word-stops-compat-14.docx CM12a, CM12d, word-stops-compat2-14.docx CN5a to CN5e: a left stop past the end with words
        // after it, a default stop past a right one at the end, centred and decimal stops past it, and a left one between a
        // right indent and the end, the text after each on the line, past the end
        const tab: InlineItem = { type: "tab", font: {} };
        const linesOf = (items: readonly InlineItem[], tabStops: readonly TabStop[], options: Partial<LineLayoutOptions> = older) =>
            layoutLines(items, { width: 100, tabStops, ...options }).map(({ text: value, textWidth, unsupported }) => ({
                text: value,
                textWidth,
                ...(unsupported === undefined ? {} : { unsupported }),
            }));
        const left = (position: number): readonly TabStop[] => [{ position, alignment: "left" }];
        expect(linesOf([text("a"), tab, text("bb cc dd ee ff")], left(150))).to.deep.equal([{ text: "a\tbb cc dd ee ff", textWidth: 290 }]);
        // Word 2013 puts the tab on a line of its own, and the text after it on the next
        expect(
            linesOf([text("a"), tab, text("bb cc dd ee ff")], left(150), { measurer: MEASURER }).map(({ text: value }) => value),
        ).to.deep.equal(["a", "\t", "bb cc dd ", "ee ff"]);
        // A default stop past the end, after a right one at the end
        expect(linesOf([text("a"), tab, text("bb"), tab, text("c")], [{ position: 100, alignment: "right" }])).to.deep.equal([
            { text: "a\tbb\tc", textWidth: 118 },
        ]);
        expect(linesOf([text("a"), tab, text("bb")], [{ position: 200, alignment: "center" }])).to.deep.equal([
            { text: "a\tbb", textWidth: 210 },
        ]);
        expect(linesOf([text("a"), tab, text("12.5")], [{ position: 200, alignment: "decimal" }])).to.deep.equal([
            { text: "a\t12.5", textWidth: 220 },
        ]);
        // One between the paragraph's right indent and the end
        expect(
            layoutLines([text("a"), tab, text("bb cc")], { width: 100, tabStops: left(90), format: { indentRight: 20 }, ...older }).map(
                ({ textWidth }) => textWidth,
            ),
        ).to.deep.equal([140]);
        // Past where Word was seen keeping it on the line, 941.4 points past the margin, how it breaks it hasn't been seen
        expect(linesOf([text("a"), tab, text("b".repeat(80))], left(150))[0].unsupported).to.equal(
            "text after a tab past the end of the line that goes further past the margin than Word was seen keeping it on the line, in a document in compatibility mode",
        );
        // One to a stop on the line is as it is, and the text after it breaks as it does without
        expect(linesOf([text("a"), tab, text("bb cc dd ee ff")], left(50))).to.deep.equal([
            { text: "a\tbb cc ", textWidth: 100 },
            { text: "dd ee ff", textWidth: 80 },
        ]);
    });

    it("should keep the mark of a paragraph that ends with a page break on its line, as Word 2010 and 2007 do", () => {
        // word-stops-compat2-14.docx, -12 CN1a: the next paragraph at the top of the next page, as in Word 2013's mode
        const pageBreak: InlineItem = { type: "break", kind: "page", font: {} };
        const lines = (options: Partial<LineLayoutOptions>): readonly object[] =>
            layoutLines([text("aaaaaaaa aa"), pageBreak], { width: 100, measurer: MEASURER, ...options }).map(
                ({ text: value, breakAfter, unsupported }) => ({ text: value, breakAfter, unsupported }),
            );
        expect(lines(older)).to.deep.equal(lines({}));
        expect(lines(older)).to.have.length(2);
    });
});
