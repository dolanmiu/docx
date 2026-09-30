import { describe, expect, it } from "vitest";

import { DEFAULT_MEASURER, type InlineItem, type TextMeasurer, layoutLines, measureContentWidths } from "./line-breaking";
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

    it("should give an empty paragraph one line as tall as its mark, or its spaces", () => {
        expect(heightsOf([], 100, { markFont: { size: 12 } })).to.deep.equal([12]);
        expect(heightsOf([text("   ", 16)], 100, { markFont: { size: 12 } })).to.deep.equal([16]);
    });

    it("should space the lines as the paragraph says", () => {
        const lines = [text("aaaa bbbb cccc")];
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "multiple", multiple: 1.5 } } })).to.deep.equal([15, 15]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "exact", height: 8 } } })).to.deep.equal([8, 8]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "atLeast", height: 12 } } })).to.deep.equal([12, 12]);
        expect(heightsOf(lines, 100, { format: { lineSpacing: { rule: "atLeast", height: 8 } } })).to.deep.equal([10, 10]);
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

    it("should mark the lines that end with a page or column break, with the paragraph's mark on the last break's line", () => {
        const lines = layoutLines(
            [
                text("aa"),
                { type: "break", kind: "page", font: {} },
                text("bb"),
                { type: "break", kind: "column", font: {} },
                { type: "marker", name: "after" },
            ],
            { width: 100, measurer: MEASURER, markFont: { size: 12 } },
        );
        expect(lines).to.deep.equal([
            { height: 10, markers: [], breakAfter: "page" },
            { height: 10, markers: ["after"], breakAfter: "column" },
        ]);
        // With no text on its line, the break's line is as tall as the mark
        expect(
            layoutLines([{ type: "break", kind: "page", font: {} }], { width: 100, measurer: MEASURER, markFont: { size: 12 } }),
        ).to.deep.equal([{ height: 12, markers: [], breakAfter: "page" }]);
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

    it("should break between Chinese and Japanese characters, but not before closing punctuation", () => {
        // cspell:disable
        expect(heightsOf([text("漢字漢字漢字漢字漢字漢字")])).to.deep.equal([10, 10]);
        // The full stop stays with the character before it, which moves to the next line with it
        expect(heightsOf([text("漢字漢字漢字漢字漢字。")])).to.deep.equal([10, 10]);
        expect(layoutLines([text("漢字漢字漢字漢字漢字。")], { width: 100, measurer: MEASURER })).to.have.length(2);
        expect(heightsOf([text("漢字"), text("かな")])).to.deep.equal([10]);
        // cspell:enable
    });

    it("should break a word wider than a line across as many lines as it needs", () => {
        expect(heightsOf([text("a".repeat(25))])).to.deep.equal([10, 10, 10]);
        expect(heightsOf([text("bb "), text("a".repeat(20), 12)])).to.deep.equal([10, 12, 12]);
        expect(heightsOf([text("a".repeat(20))])).to.deep.equal([10, 10]);
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
