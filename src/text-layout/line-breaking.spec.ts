import { describe, expect, it } from "vitest";

import {
    DEFAULT_MEASURER,
    type InlineItem,
    type LaidOutLine,
    type LineLayoutOptions,
    type TextMeasurer,
    layoutLines,
    measureContentWidths,
} from "./line-breaking";
import { type ParagraphFormat, type TextFont, measureLineHeight, measureTextWidth } from "./text-width";

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
        // With text on the line, its spaces count
        expect(heightsOf([text("aa"), text(" ", 16), text("bb")])).to.deep.equal([16]);
    });

    it("should measure the pieces of a word in the same font together when it is kerned, so they are kerned across runs as Word kerns them", () => {
        // cspell:ignore AVAVAVAV
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

    it("should space the lines as the paragraph says", () => {
        const lines = [text("aaaa bbbb cccc")];
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "multiple", multiple: 1.5 } } })).to.deep.equal([15, 15]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "exact", height: 8 } } })).to.deep.equal([8, 8]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "atLeast", height: 12 } } })).to.deep.equal([12, 12]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "atLeast", height: 8 } } })).to.deep.equal([10, 10]);
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

    it("should move tabs to the default tab stops", () => {
        // Stops every 36 points: aaa ends at 30, the tab moves to 36, and the rest doesn't fit in 100
        expect(heightsOf([text("aaa"), { type: "tab", font: {} }, text("bbbbbbb")])).to.deep.equal([10, 10]);
        expect(heightsOf([text("aaa"), { type: "tab", font: {} }, text("bbbbbb")])).to.deep.equal([10]);
        expect(heightsOf([text("aaa"), { type: "tab", font: {} }, text("bbbbbbb")], 100, { defaultTabStop: 30 })).to.deep.equal([10, 10]);
        expect(heightsOf([text("aa"), { type: "tab", font: {} }, text("bbbbbbb")], 100, { defaultTabStop: 30 })).to.deep.equal([10]);
    });

    it("should line up the text after a tab with the paragraph's own tab stops", () => {
        const tab: InlineItem = { type: "tab", font: {} };
        // A left stop at 70 leaves room for three characters
        expect(heightsOf([text("a"), tab, text("bbb")], 100, { tabStops: [{ position: 70, alignment: "left" }] })).to.deep.equal([10]);
        expect(heightsOf([text("a"), tab, text("bbbb")], 100, { tabStops: [{ position: 70, alignment: "left" }] })).to.deep.equal([10, 10]);
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
        const items: readonly InlineItem[] = [text("1234."), { type: "tab", font: {} }, text("bbbbbbbbbb")];
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

    it("should move the tab after a right-aligned number to the first stop at or after its end, and stop where Word hasn't shown which", () => {
        const items: readonly InlineItem[] = [text("1234."), { type: "tab", font: { listNumber: "separator" } }, text("b")];
        const laidOut = (format: ParagraphFormat, tabStops: readonly { readonly position: number; readonly alignment: "left" }[] = []) =>
            layoutLines(items, { width: 300, format, tabStops, defaultTabStop: 36, measurer: MEASURER, numberAlignment: "right" })[0];
        // word-lists.docx LJ6: the number ends at the left indent, on a default stop, and the text starts there
        expect(laidOut({ indentLeft: 72 })).to.deep.include({ textWidth: 10 });
        expect(laidOut({ indentLeft: 72 }).unsupported).to.equal(undefined);
        // LJ1, LJ7: with a hanging indent, at its stop past the default one the number ends at
        expect(laidOut({ indentLeft: 108, firstLineIndent: -36 })).to.deep.include({ textWidth: 46 });
        expect(laidOut({ indentLeft: 108, firstLineIndent: -36 }).unsupported).to.equal(undefined);
        // At a left indent off the default stops, or a stop of the paragraph's own or a default one at the end of a number
        // after a first line indent, Word may move it on, and hasn't shown it
        const unknown = "a tab after a list number aligned right, which Word hasn't been seen to move";
        expect(laidOut({ indentLeft: 80 }).unsupported).to.equal(unknown);
        expect(laidOut({ indentLeft: 108, firstLineIndent: -36 }, [{ position: 72, alignment: "left" }]).unsupported).to.equal(unknown);
        expect(laidOut({ indentLeft: 36, firstLineIndent: 36 }).unsupported).to.equal(unknown);
        expect(laidOut({ indentLeft: 36, firstLineIndent: 40 }).unsupported).to.equal(undefined);
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
            // Whether Word squeezes a line with text in a border isn't known, whether the border is on the word squeezed in or
            // on a word before it
            const box = (value: string): InlineItem => ({ type: "text", text: value, font: { border: { room: 1, key: "a" } } });
            const unsupported = (boxed: readonly InlineItem[]): string | undefined =>
                layoutLines(boxed, { width: 330, measurer: MEASURER, format: justified })[0].unsupported;
            const squeezed = "a justified line with text in a border that only fits squeezed";
            expect(unsupported([text("aa aa aa aa aa aa aa aa aa aa "), box("bbbb"), text(` ${"c".repeat(30)}`)])).to.equal(squeezed);
            expect(unsupported([box("aa"), text(" aa aa aa aa aa aa aa aa aa bbbb"), text(` ${"c".repeat(30)}`)])).to.equal(squeezed);
            expect(unsupported([box("aa"), text(" aa aa aa aa aa aa aa aa aa"), text(` ${"c".repeat(30)}`)])).to.equal(undefined);
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

        it("should mark a line that only fits squeezed at an en, em or ideographic space, which Word hasn't been seen squeezing", () => {
            // As above, with the 5th space an en space: "bbbb" is 15 past the end of a line of 325, which its spaces could take
            const items = [text(`aa aa aa aa aa${String.fromCodePoint(0x2002)}aa aa aa aa aa bbbb`)];
            const reasonsOf = (width: number, format: ParagraphFormat): readonly (string | undefined)[] =>
                layoutLines(items, { width, measurer: MEASURER, format }).map(({ unsupported }) => unsupported);
            expect(reasonsOf(325, justified)).to.deep.equal([
                "a justified line that only fits squeezed at an en, em or ideographic space",
                undefined,
            ]);
            expect(reasonsOf(325, { alignment: "distributed" })[0]).to.equal(
                "a justified line that only fits squeezed at an en, em or ideographic space",
            );
            // 40 past the end of a line of 300, more than a quarter of all its spaces, it goes on the next line in any case
            expect(reasonsOf(300, justified)).to.deep.equal([undefined, undefined]);
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

    it("should stop at a line of only pictures in a paragraph whose mark is larger than the pictures' runs, which Word hasn't shown", () => {
        const larger = { font: "Calibri", size: 16 };
        // The mark's line or the picture's
        expect(linesOf([picture(12)], { markFont: larger })[0].unsupported).to.equal(
            "a picture alone in a line of a paragraph whose mark is larger",
        );
        // The share of the mark's line or of the run's that the spacing adds
        expect(linesOf([picture(30)], { ...multiple(1.5), markFont: larger })[0].unsupported).to.equal(
            "a picture alone in a line of a paragraph whose mark is larger",
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

    it("should make a line of only a number as tall as the number, and stop where its mark is of another size or font", () => {
        expect(heightOf([listNumber(20), tab(20)])).to.deep.include({ height: 24 });
        expect(heightOf([listNumber(20), tab(20)]).unsupported).to.equal(undefined);
        expect(heightOf([listNumber(20), tab(20)], { markFont: { size: 10 } }).unsupported).to.equal(
            "a line of only a list number of another size or font than its paragraph's mark",
        );
    });

    it("should stop at multiple line spacing in a line whose number is taller than its text", () => {
        const spacing = (multiple: number): Partial<LineLayoutOptions> => ({
            format: { lineSpacing: { rule: "multiple", multiple } },
        });
        expect(heightOf([listNumber(20), tab(20), text("b")], spacing(1.5)).unsupported).to.equal(
            "a list number taller than its line's text, with multiple line spacing",
        );
        expect(heightOf([listNumber(20), tab(20), text("b")], spacing(1)).unsupported).to.equal(undefined);
        expect(heightOf([listNumber(10), tab(10), text("b")], spacing(1.5)).unsupported).to.equal(undefined);
        // A line of only a number is as tall as text of its font
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

    it("should stop at emphasis marks where how much room Word gives them isn't known", () => {
        const unsupported = (items: readonly InlineItem[], options: Omit<LineLayoutOptions, "width"> = {}): string | undefined =>
            linesOf(items, options)[0].unsupported;
        const spacing = "emphasis marks on a line whose line spacing Word hasn't shown with them";
        // Less than a line, and between the room Word added below the marks' and the room that held them
        expect(unsupported(lineWith({ emphasis: "above" }), multiple(0.8))).to.equal(spacing);
        expect(unsupported(lineWith({ emphasis: "above" }), multiple(1.25))).to.equal(spacing);
        expect(unsupported(lineWith({ emphasis: "above" }), { format: { lineSpacing: { rule: "atLeast", height: 17 } } })).to.equal(
            spacing,
        );
        // On a line taller than its fonts' own, with spacing, though single spaced it is known
        expect(unsupported(lineWith({ emphasis: "above", raise: 6 }), multiple(1.5))).to.equal(spacing);
        expect(unsupported(lineWith({ emphasis: "above", raise: 6 }), multiple(1))).to.equal(undefined);
        expect(unsupported([word("x", { ...CALIBRI, emphasis: "above" }), { type: "box", width: 20, height: 30, font: CALIBRI }])).to.equal(
            "emphasis marks on a line with a picture",
        );
        expect(unsupported([word("x ", { ...CALIBRI, emphasis: "below" }), word("y", { ...CALIBRI, emphasis: "above" })])).to.equal(
            "emphasis marks over and under text on one line",
        );
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
        // A tab after a box ends it
        expect(widths([box("bb"), { type: "tab", font: {} }, plain("c")]).max).to.equal(46);
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
        // Nor how a box goes on round a word broken across lines, or round text lined up with a right tab stop
        expect(layoutLines([box("aaaaaaaaaaaaaaa")], { width: 100, measurer: MEASURER })[0].unsupported).to.equal(
            "a word longer than its line with a border",
        );
        expect(
            layoutLines([{ type: "tab", font: {} }, box("aa")], {
                width: 100,
                measurer: MEASURER,
                tabStops: [{ position: 90, alignment: "right" }],
            })[0].unsupported,
        ).to.equal("text with a border lined up with a tab stop");
    });
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
        const items: readonly InlineItem[] = [text("1234."), { type: "tab", font: {} }, text("bbbbbbbbbb")];
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
        // "x abbcc-" is 80 points, and "x abbccd" wouldn't fit with its hyphen
        expect(linesOf([text("x "), ...word], { width: 80 }).map(({ text: value }) => value)).to.deep.equal(["x abbcc", "ddd"]);
        expect(linesOf([text("xxxxx "), ...word], { width: 80 }).map(({ text: value }) => value)).to.deep.equal(["xxxxx a", "bbccddd"]);
        // No part fits: the word goes on to the next line, where it fits whole
        expect(linesOf([text("xxxxxxx "), ...word], { width: 90 }).map(({ text: value }) => value)).to.deep.equal(["xxxxxxx ", "abbccddd"]);
    });

    it("should make the line as tall as its hyphen's font", () => {
        expect(linesOf([text("aaaa bbb"), softHyphen({ size: 20 }), text("ccc")]).map(({ height }) => height)).to.deep.equal([20, 10]);
    });

    it("should stop where Word's breaking at a soft hyphen hasn't been seen", () => {
        const unsupportedOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions> = {}): readonly (string | undefined)[] =>
            linesOf(items, options).map(({ unsupported }) => unsupported);
        // The part before it fits, but not with its hyphen: it goes on to the next line whole
        const pastEnd = linesOf([text("aaaaa bbbb"), softHyphen(), text("cc")]);
        expect(pastEnd.map(({ text: value }) => value)).to.deep.equal(["aaaaa ", "bbbbcc"]);
        expect(pastEnd[0].unsupported).to.equal("a soft hyphen whose hyphen would go past the end of the line");
        // A justified line, which Word may squeeze the word onto
        expect(unsupportedOf([text("aaaa bbb"), softHyphen(), text("ccc")], { format: { alignment: "justified" } })[0]).to.equal(
            "a soft hyphen in a justified line",
        );
        // A word longer than its line
        expect(unsupportedOf([text("aaaaaaa"), softHyphen(), text("bbbbbbb")])[0]).to.equal(
            "a word with soft hyphens longer than its line",
        );
        // whose first part is too: it breaks after the last letter that fits, as a word without them does
        const long = linesOf([text("aaaaaaaaaaaa"), softHyphen(), text("b")]);
        expect(long.map(({ text: value, unsupported }) => [value, unsupported])).to.deep.equal([
            ["aaaaaaaaaa", "a word with soft hyphens longer than its line"],
            ["aab", undefined],
        ]);
        // A word with a border
        const boxed = { type: "text", text: "bbb", font: { border: { room: 1, key: "a" } } } as const;
        expect(unsupportedOf([text("aaaa "), boxed, softHyphen(), text("ccc")])[0]).to.equal("a soft hyphen in a word with a border");
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
        expect(lines.map(({ text: value }) => value.trimEnd().split(" ").pop())).to.deep.equal([
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

    it("should stop at text at a decimal stop that isn't a plain number, which Word hasn't been seen lining up", () => {
        for (const value of ["abc", "12.5%", "$1,234.50", "1 234.5", "x 1.5"]) {
            expect(lineOf([text("a"), tab, text(value)]).unsupported).to.equal("text at a decimal tab stop that isn't a number");
        }
        expect(lineOf([text("a"), tab, { type: "box", width: 10, height: 10 }]).unsupported).to.equal(
            "text at a decimal tab stop that isn't a number",
        );
        // In the widths of a table's columns, it lines up its end
        expect(measureContentWidths([text("a"), tab, text("abc")], { measurer: MEASURER, ...decimal }).max).to.equal(60);
    });

    it("should line up numbers with a decimal stop where Word lines them up", () => {
        // word-watertight-text TX12a: in Calibri 11, at a decimal stop at 4000 twips, Word's numbers end at these
        const font = { font: "Calibri", size: 11 };
        const tabStops = [{ position: 200, alignment: "decimal" as const }];
        for (const [number, edge] of [
            ["12.5", 4167.6],
            ["1234.56", 4279.1],
            ["7", 4000.4],
            ["-0.25", 4279.1],
        ] as const) {
            const [line] = layoutLines(
                [
                    { type: "text", text: "TX12a", font },
                    { type: "tab", font },
                    { type: "text", text: number, font },
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
    });

    it("should put the text after a left stop past the end of the line on the next line, as Word does", () => {
        // word-watertight-text TX12d: a left stop at 9500 twips puts the text at the start of the next line
        const lines = linesOf([text("a"), tab, { type: "marker", name: "m" }, text("bb")], at("left"));
        expect(lines.map(({ text: value, textWidth, markers }) => [value, textWidth, markers])).to.deep.equal([
            ["a\t", 10, []],
            ["bb", 20, ["m"]],
        ]);
        // A default stop past the end, after the paragraph's own stops, goes on to the next line
        expect(linesOf([text("aaaaaaaa"), tab, text("b")], at("left", 50)).map(({ text: value }) => value)).to.deep.equal([
            "aaaaaaaa",
            "\tb",
        ]);
    });

    it("should stop at a stop past the end of the line that Word hasn't been seen with", () => {
        const unsupportedOf = (items: readonly InlineItem[], options: Partial<LineLayoutOptions>): string | undefined =>
            linesOf(items, options)[0].unsupported;
        expect(unsupportedOf([text("a"), tab, text("b")], at("center"))).to.equal("a centred or decimal tab stop past the end of the line");
        expect(unsupportedOf([text("a"), tab, text("1.5")], at("decimal"))).to.equal(
            "a centred or decimal tab stop past the end of the line",
        );
        expect(unsupportedOf([tab, text("b")], at("left"))).to.equal("a tab at the start of a line to a stop past its end");
        for (const format of [{ indentLeft: 10 }, { indentRight: 10 }, { firstLineIndent: 10 }]) {
            expect(unsupportedOf([text("a"), tab, text("b")], { ...at("left"), format })).to.equal(
                "a tab stop past the end of the line in an indented paragraph",
            );
        }
    });

    it("should put the text after tabs past the end of the line where Word puts it", () => {
        // word-watertight-text TX12c, TX12d, TX12e: in Calibri 11, a right stop at 10000 twips and at 9026 put "right" at the
        // margin, its right edge at 9026.3, and a left stop at 9500 puts "left" at the start of the next line
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
        expect(layoutLines(items("TX12d", "left"), stop("left", 9500)).map(({ text: value }) => value)).to.deep.equal(["TX12d\t", "left"]);
    });
});
