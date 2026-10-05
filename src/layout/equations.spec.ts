import { describe, expect, it } from "vitest";

import { type EquationBox, layOutEquation } from "./equations";

/** An equation's parts: a run for each text, and the other parts as they are */
const equation = (...parts: readonly (string | object)[]): readonly object[] =>
    parts.map((part) => (typeof part === "string" ? { "m:r": [{ "m:t": [part] }] } : part));

/** A run of an equation with its properties */
const run = (text: string, ...properties: readonly object[]): object => ({ "m:r": [{ "m:rPr": properties }, { "m:t": [text] }] });
const style = (value: string): object => ({ "m:sty": { _attr: { "m:val": value } } });

/** How wide an equation of these parts is at 11 points, in twips, to the hundredth, or why it can't be laid out */
const widthOf = (...parts: readonly (string | object)[]): number | string => {
    const box = layOutEquation(equation(...parts), 11);
    return typeof box === "string" ? box : Math.round(box.width * 2000) / 100;
};

describe("layOutEquation", () => {
    it("should make an equation of text as wide as Word does, with its italic corrections and the spaces between its atoms", () => {
        // Word's widths, from its PDFs, to within a quarter of a twip: those of characters Word drew in a string of them are
        // known to a thousandth of an em (`word-equations.docx` EQ1, `word-equations2.docx` EQ6 to EQ8)
        const words: readonly (readonly [string, number])[] = [
            ["x", 123.75],
            ["a+b=c", 908.27],
            ["2x+1", 629.52],
            ["xy", 243.96],
            ["f(x)", 433.71],
            ["a\u2212b", 513.53],
            ["a\u00d7b", 506.33],
            ["a/b", 359.23],
            ["\u03b1+\u03b2", 540.67],
            ["x,y", 332.36],
            ["(a+b)", 696.11],
            ["a<b", 538.43],
            ["\u2212x", 288.05],
            ["ABC", 424.61],
            ["h", 125.79],
            ["abcdefghijklm", 1484.43],
            ["x + y", 609.57],
            // Greek capitals are italic too (EQ6G), and binary operators and relations are spaced alike (EQ7d, EQ7e)
            ["\u0393+1", 524.12],
            ["a+b\u2212c\u00d7d\u00f7e\u00b1f\u2213g\u22c5h\u2217i\u2218j", 3283.82],
            ["a=b<c>d\u2264e\u2265f\u2260g\u2248h\u2261i\u223cj\u2192k\u2190l", 4547.38],
            // No space beside brackets, bars and slashes, and a thin space after punctuation, with italic corrections before
            // them, and none before a prime or a sign (EQ7f, EQ7g)
            ["(a)[b]{c}|d|", 1140.31],
            ["a;b:c!d?e'f\u2032g\u221eh\u2202i\u2207j", 2109.76],
            // No italic correction before a digit (EQ8a), and a minus sign after a bracket, a relation, punctuation or an
            // operator is unary (EQ8c)
            ["x2 a1", 531.72],
            ["(\u2212a)=\u2212b,\u2212c+\u2212d", 1964.59],
        ];
        for (const [text, word] of words) {
            expect(widthOf(text), text).to.be.closeTo(word, 0.25);
        }
        // Plain letters have no italic correction, and an italic letter before one has none either (EQ1q, EQ8b)
        expect(widthOf(run("a+b", style("p")))).to.be.closeTo(489.92, 0.1);
        expect(widthOf("x", run("a", style("p")), "y")).to.be.closeTo(351.36, 0.1);
        expect(widthOf(run("a+b", style("i")))).to.equal(widthOf("a+b"));
        // Text written as a string, rather than in an array, is read too
        expect(widthOf({ "m:r": [{ "m:t": "x" }] })).to.equal(widthOf("x"));
        // A function is its name, a thin space and its argument, its name italic or plain (EQ1z, EQ8e)
        const sine = (name: object): object => ({
            "m:func": [{ "m:funcPr": [] }, { "m:fName": equation(name) }, { "m:e": equation("x") }],
        });
        expect(widthOf(sine({ "m:r": [{ "m:t": ["sin"] }] }))).to.be.closeTo(461.75, 0.1);
        expect(widthOf(sine(run("sin", style("p"))))).to.be.closeTo(438.85, 0.1);
    });

    it("should lay out an equation in the size its runs give, rather than its paragraph's (word-equations2.docx EQ9e)", () => {
        const sized = { "m:r": [{ "w:rPr": [{ "w:sz": { _attr: { "w:val": 32 } } }] }, { "m:t": ["x+y"] }] };
        expect(widthOf(sized)).to.be.closeTo(745.73, 0.1);
        expect((layOutEquation(equation(sized), 11) as EquationBox).ascent).to.be.closeTo((1946 / 2048) * 16, 1e-9);
        expect(widthOf(sized, "+z")).to.equal("an equation whose runs are of different sizes");
    });

    it("should make an equation as tall as a line of Cambria Math, above and below its baseline", () => {
        const box = layOutEquation(equation("x"), 11) as EquationBox;
        // 2401 of 2048 units at 11 points is 257.92 twips (`word-equations.docx` EQ2c)
        expect((box.ascent + box.descent) * 20).to.be.closeTo(257.92, 0.01);
        expect(box.descent * 20).to.be.closeTo(48.87, 0.01);
    });

    it("should leave out what takes no room, such as bookmarks and properties", () => {
        expect(widthOf({ "m:oMathPr": [] }, { "w:bookmarkStart": { _attr: { "w:name": "b" } } }, "x", { "w:proofErr": {} })).to.equal(
            widthOf("x"),
        );
    });

    it("should say why an equation Word builds up, or spaces or formats in a way not yet followed, can't be laid out", () => {
        const builtUp = "an equation with a fraction, a script, a root or another part Word builds up";
        expect(widthOf({ "m:f": [] })).to.equal(builtUp);
        // A function beside other parts, whose spaces Word hasn't shown
        expect(widthOf("a", { "m:func": [{ "m:fName": equation("sin") }, { "m:e": equation("x") }] })).to.equal(builtUp);
        expect(widthOf({ "m:func": [{ "m:fName": equation({ "m:f": [] }) }, { "m:e": equation("x") }] })).to.equal(builtUp);
        expect(widthOf({ "m:func": [{ "m:fName": equation("sin") }, { "m:e": equation({ "m:f": [] }) }] })).to.equal(builtUp);
        const together = "an equation with operators next to each other, which Word spaces in a way not yet followed";
        expect(widthOf("a+=b")).to.equal(together);
        expect(widthOf("(a)+b")).to.equal(together);
        expect(widthOf("x.y")).to.equal("a full stop in an equation other than a decimal point");
        expect(widthOf("1.")).to.equal("a full stop in an equation other than a decimal point");
        expect(widthOf("\u2202+x")).to.equal("an italic sign in an equation before what isn't ordinary, such as a letter or digit");
        expect(widthOf("a+(b)")).to.equal(together);
        expect(widthOf("a+")).to.equal(together);
        expect(widthOf("\u2212+a")).to.equal(together);
        expect(widthOf({ "m:r": [{ "w:rPr": [{ "w:b": {} }] }, { "m:t": ["x"] }] })).to.equal(
            "an equation whose text has formatting of its own",
        );
        for (const properties of [[{ "m:nor": {} }], [{ "m:scr": {} }], [style("b")]]) {
            expect(widthOf(run("x", ...properties))).to.equal("an equation in normal text, another alphabet or bold");
        }
        // A snowman, which Cambria Math hasn't, a diamond, which Word drew in another font, and an integral, which Word drew
        // wider than the font has it (`word-stops-equations.docx` EQ27k)
        for (const character of ["\u2603", "\u25c7", "\u222b"]) {
            expect(widthOf(character)).to.equal("a character in an equation whose width isn't known");
        }
    });

    it("should make a character of Cambria Math's own as wide as the font has it, and a Greek variant an italic letter, as Word draws them", () => {
        // word-stops-equations.docx EQ27: ten of each, as wide as Cambria Math has them, to within a thousandth of an em: ∞
        // 851.07 thousandths, where Word's PDF has 850.59, ℝ 744.64, and ϑ the italic letter U+1D717, 586.43 wide, with its
        // italic correction after it, 22.04
        expect(widthOf("\u221e")).to.equal(187.22);
        expect(widthOf("\u211d\u211d")).to.equal(327.64);
        expect(widthOf("\u03d1")).to.equal(133.86);
        // Plain, it is as it is
        expect(widthOf(run("\u03d1", style("p")))).to.equal("a character in an equation whose width isn't known");
        // A symbol Word hasn't been seen to space, beside another atom, where TeX would space it by what it is
        const unseen = "a symbol in an equation beside another, where Word hasn't been seen to space it";
        expect(widthOf("a\u2282b")).to.equal(unseen);
        expect(widthOf("\u2282\u2282")).to.equal(unseen);
        expect(widthOf("\u2282")).to.be.a("number");
    });
});
