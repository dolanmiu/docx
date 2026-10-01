import { describe, expect, it } from "vitest";

import {
    DEFAULT_MEASURER,
    type InlineItem,
    type LineLayoutOptions,
    type TextMeasurer,
    layoutLines,
    measureContentWidths,
} from "./line-breaking";
import { measureLineHeight, measureTextWidth } from "./text-width";

// Every character is 10 points wide, and a line is as tall as its font's size
const MEASURER: TextMeasurer = {
    measureWidth: (value) => [...value].length * 10,
    measureLineHeight: ({ size = 10 }) => size,
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
            { height: 10, markers: [], breakAfter: "column" },
            { height: 10, markers: ["after"], breakAfter: "page" },
        ]);
        // After a column break at its end, the mark is on a line of its own, at the top of the next column
        expect(
            layoutLines([text("aa"), { type: "break", kind: "column", font: {} }, { type: "marker", name: "after" }], {
                width: 100,
                measurer: MEASURER,
                markFont: { size: 12 },
            }),
        ).to.deep.equal([
            { height: 10, markers: [], breakAfter: "column" },
            { height: 12, markers: ["after"] },
        ]);
        // With no text on its line, the break's line is as tall as the mark
        expect(
            layoutLines([{ type: "break", kind: "page", font: {} }], { width: 100, measurer: MEASURER, markFont: { size: 12 } }),
        ).to.deep.equal([{ height: 12, markers: [], breakAfter: "page" }]);
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
            { height: 10, markers: [], breakAfter: "page" },
            { height: 10, markers: [] },
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
        const wide: TextMeasurer = { measureWidth: (value) => [...value].length * 30, measureLineHeight: () => 10 };
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

    it("should measure with the widths of the fonts by default", () => {
        const [line] = layoutLines([text("Some text", 11)], { width: 500 });
        expect(line.height).to.equal(measureLineHeight({ size: 11 }));
        expect(DEFAULT_MEASURER.measureWidth("Some text", { size: 11 })).to.equal(measureTextWidth("Some text", { size: 11 }));
        expect(layoutLines([text("Some text", 11)], { width: measureTextWidth("Some", { size: 11 }) + 1 })).to.have.length(2);
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

    it("should measure with the widths of the fonts by default", () => {
        const { min, max } = measureContentWidths([{ type: "text", text: "two words", font: { font: "Calibri", size: 11 } }], {});
        expect(min).to.be.closeTo(measureTextWidth("words", { font: "Calibri", size: 11 }), 0.001);
        expect(max).to.be.closeTo(measureTextWidth("two words", { font: "Calibri", size: 11 }), 0.001);
    });
});
