import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { Math as Equation } from "@file/paragraph/math";
import type { IContext } from "@file/xml-components";

import { latexToMath } from "../math";
import { type EquationBox, layOutEquation, layOutEquations } from "./equations";

/** An equation's parts: a run for each text, and the other parts as they are */
const equation = (...parts: readonly (string | object)[]): readonly object[] =>
    parts.map((part) => (typeof part === "string" ? { "m:r": [{ "m:t": [part] }] } : part));

/** A run of an equation with its properties */
const run = (text: string, ...properties: readonly object[]): object => ({ "m:r": [{ "m:rPr": properties }, { "m:t": [text] }] });
const style = (value: string): object => ({ "m:sty": { _attr: { "m:val": value } } });
const alphabet = (value: string): object => ({ "m:scr": { _attr: { "m:val": value } } });
/** A property of a part Word builds up, such as a fraction's type */
const property = (name: string, value?: string): object => ({ [name]: value === undefined ? {} : { _attr: { "m:val": value } } });

/** How wide an equation of these parts is at 11 points, in twips, to the hundredth, or why it can't be laid out */
const widthOf = (...parts: readonly (string | object)[]): number | string => {
    const box = layOutEquation(equation(...parts), 11);
    return typeof box === "string" ? box : Math.round(box.width * 2000) / 100;
};

/** An equation docx writes from LaTeX, as docx/math's latexToMath writes it, formatted, as the layout reads it */
const fromLatex = (latex: string): unknown =>
    (
        new Formatter().format(new Equation({ children: latexToMath(latex) }), { stack: [] } as unknown as IContext) as Record<
            string,
            unknown
        >
    )["m:oMath"];

/** An equation from LaTeX laid out at 11 points, or another size, in a line of text or displayed, or why it can't be */
const laidOut = (latex: string, display = false, size = 11): EquationBox | string => layOutEquation(fromLatex(latex), size, display);

// Calibri's ascent and descent, as shares of its size, which the probes' lines of text are in
const CALIBRI_ASCENT = 1950 / 2048;
const CALIBRI_DESCENT = 550 / 2048;

/** How tall a line of an equation is: in a line of Calibri, 11 points or another size, as tall as both, or displayed, its own */
const lineOf = (box: EquationBox, display: boolean, size = 11): number =>
    display ? box.ascent + box.descent : Math.max(CALIBRI_ASCENT * size, box.ascent) + Math.max(CALIBRI_DESCENT * size, box.descent);

const BUILT_UP = "an equation with a part Word builds up in a way not yet followed";

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

    it("should build equations up as Word does, as wide as it makes them in a line of text, and as tall as it makes their lines", () => {
        // Word's widths and lines, in points, from its PDF of scripts/layout-probes/stops2/word-stops-equations.ts, as
        // word-stops-equations.py reads them: each equation's width to within a hundredth of a point, and its line's height
        // pinned by the lines of Calibri 11 around it to within half a point. The probes are each equation in a line of text,
        // and alone in its paragraph (`m:oMathPara`, the probe's name ending in "d")
        const probes: readonly (readonly [string, string, boolean, number | undefined, readonly [number, number]])[] = [
            ["EQ10a", "\\frac{a}{b}", false, 5.2, [17.317, 17.772]],
            ["EQ10ad", "\\frac{a}{b}", true, undefined, [22.357, 22.812]],
            ["EQ10b", "\\frac{a+b}{c+d}", false, 16.026, [18.757, 19.212]],
            ["EQ10bd", "\\frac{a+b}{c+d}", true, undefined, [25.237, 25.692]],
            ["EQ10c", "\\frac{1}{\\frac{1}{x}}", false, 6.838, [23.317, 23.772]],
            ["EQ10cd", "\\frac{1}{\\frac{1}{x}}", true, undefined, [35.317, 35.772]],
            ["EQ10d", "\\frac{\\frac{a}{b}}{c}", false, 6.6, [23.317, 23.772]],
            ["EQ10dd", "\\frac{\\frac{a}{b}}{c}", true, undefined, [30.997, 31.452]],
            ["EQ10e", "\\binom{n}{k}", false, 15.229, [15.397, 15.852]],
            ["EQ10ed", "\\binom{n}{k}", true, undefined, [22.357, 22.812]],
            ["EQ10f", "\\frac{x^2}{\\sqrt{y}}", false, 10.522, [21.877, 22.332]],
            ["EQ10fd", "\\frac{x^2}{\\sqrt{y}}", true, undefined, [31.945, 32.412]],
            ["EQ11a", "x^2", false, 11.55, [13.477, 13.932]],
            ["EQ11ad", "x^2", true, undefined, [12.757, 13.212]],
            ["EQ11b", "x_i", false, 9.293, [13.237, 13.692]],
            ["EQ11bd", "x_i", true, undefined, [12.757, 13.212]],
            ["EQ11c", "x_i^2", false, 11.551, [13.717, 14.172]],
            ["EQ11cd", "x_i^2", true, undefined, [13.717, 14.172]],
            ["EQ11d", "x^{2^{3}}", false, 15.75, [15.157, 15.612]],
            ["EQ11dd", "x^{2^{3}}", true, undefined, [14.917, 15.372]],
            ["EQ11e", "{}^{14}_{6}C", false, 16.541, [13.477, 13.932]],
            ["EQ11ed", "{}^{14}_{6}C", true, undefined, [13.237, 13.692]],
            ["EQ11f", "e^{-x^2}", false, 21.626, [15.157, 15.612]],
            ["EQ11fd", "e^{-x^2}", true, undefined, [14.665, 15.132]],
            ["EQ12a", "\\sqrt{x}", false, 13.42, [14.437, 14.892]],
            ["EQ12ad", "\\sqrt{x}", true, undefined, [13.717, 14.172]],
            ["EQ12b", "\\sqrt{x+y}", false, 33.818, [15.877, 16.332]],
            ["EQ12bd", "\\sqrt{x+y}", true, undefined, [15.637, 16.092]],
            ["EQ12c", "\\sqrt[3]{x}", false, 14.563, [14.437, 14.892]],
            ["EQ12cd", "\\sqrt[3]{x}", true, undefined, [13.957, 14.412]],
            ["EQ12d", "\\sqrt{\\frac{a}{b}}", false, 13.458, [26.437, 26.892]],
            ["EQ12dd", "\\sqrt{\\frac{a}{b}}", true, undefined, [26.665, 27.132]],
            ["EQ13a", "\\sum_{i=1}^{n} i", false, 26.997, [13.237, 13.692]],
            ["EQ13ad", "\\sum_{i=1}^{n} i", true, undefined, [35.797, 36.252]],
            ["EQ13b", "\\int_0^1 x\\,dx", false, 33.506, [17.557, 18.012]],
            ["EQ13bd", "\\int_0^1 x\\,dx", true, undefined, [29.557, 30.012]],
            ["EQ13c", "\\prod_{k} a_k", false, 27.508, [13.237, 13.692]],
            ["EQ13cd", "\\prod_{k} a_k", true, undefined, [29.077, 29.532]],
            ["EQ13d", "\\oint_C F", false, 18.579, [15.157, 15.612]],
            ["EQ13dd", "\\oint_C F", true, undefined, [26.677, 27.132]],
            ["EQ13e", "\\sum a", false, 16.038, [13.237, 13.692]],
            ["EQ13ed", "\\sum a", true, undefined, [22.357, 22.812]],
            ["EQ13f", "\\int f", false, 14.66, [13.477, 13.932]],
            ["EQ13fd", "\\int f", true, undefined, [24.997, 25.452]],
            ["EQ13g", "\\sum\\nolimits_{k=1}^{n} a_k", false, 36.826, [13.237, 13.692]],
            ["EQ13gd", "\\sum\\nolimits_{k=1}^{n} a_k", true, undefined, [25.705, 26.172]],
            ["EQ14a", "\\left( \\frac{a}{b} \\right)", false, 15.985, [19.477, 19.932]],
            ["EQ14ad", "\\left( \\frac{a}{b} \\right)", true, undefined, [22.357, 22.812]],
            ["EQ14b", "\\left[ x^2 \\right]", false, 19.255, [13.477, 13.932]],
            ["EQ14bd", "\\left[ x^2 \\right]", true, undefined, [12.997, 13.452]],
            ["EQ14c", "\\left| x \\right|", false, 13.157, [13.225, 13.465]],
            ["EQ14cd", "\\left| x \\right|", true, undefined, [12.745, 12.985]],
            ["EQ14d", "\\left\\{ \\frac{1}{2} \\right\\}", false, 13.964, [19.477, 19.932]],
            ["EQ14dd", "\\left\\{ \\frac{1}{2} \\right\\}", true, undefined, [24.997, 25.452]],
            ["EQ14e", "\\left\\langle \\psi \\middle| \\phi \\right\\rangle", false, 27.052, [13.225, 13.465]],
            ["EQ14ed", "\\left\\langle \\psi \\middle| \\phi \\right\\rangle", true, undefined, [12.732, 12.985]],
            ["EQ15a", "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", false, 34.915, [22.117, 22.572]],
            ["EQ15ad", "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", true, undefined, [21.877, 22.332]],
            ["EQ15b", "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}", false, 54.995, [37.957, 38.412]],
            ["EQ15bd", "\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}", true, undefined, [37.957, 38.412]],
            ["EQ15c", "f(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\le 0 \\end{cases}", false, 84.408, [22.357, 22.812]],
            ["EQ15cd", "f(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\le 0 \\end{cases}", true, undefined, [22.345, 22.812]],
            ["EQ16a", "\\hat{x}", false, 6.196, [13.237, 13.692]],
            ["EQ16ad", "\\hat{x}", true, undefined, [12.517, 12.972]],
            ["EQ16b", "\\bar{x}", false, 6.198, [13.237, 13.692]],
            ["EQ16bd", "\\bar{x}", true, undefined, [12.757, 13.212]],
            ["EQ16c", "\\vec{v}", false, 6.315, [13.237, 13.692]],
            ["EQ16cd", "\\vec{v}", true, undefined, [12.517, 12.972]],
            ["EQ16d", "\\overline{AB}", false, 14.491, [15.157, 15.612]],
            ["EQ16dd", "\\overline{AB}", true, undefined, [14.437, 14.892]],
            ["EQ16e", "\\underline{x}", false, 6.201, [13.717, 14.172]],
            ["EQ16ed", "\\underline{x}", true, undefined, [13.477, 13.932]],
            ["EQ16f", "\\tilde{n}", false, 6.505, [13.237, 13.692]],
            ["EQ16fd", "\\tilde{n}", true, undefined, [12.745, 13.212]],
            ["EQ17a", "\\sin x", false, 21.951, [13.237, 13.692]],
            ["EQ17ad", "\\sin x", true, undefined, [12.517, 12.972]],
            ["EQ17b", "\\log_2 n", false, 28.119, [13.237, 13.692]],
            ["EQ17bd", "\\log_2 n", true, undefined, [12.757, 13.212]],
            ["EQ17c", "\\lim_{x \\to 0} f(x)", false, 39.804, [17.065, 17.305]],
            ["EQ17cd", "\\lim_{x \\to 0} f(x)", true, undefined, [17.065, 17.305]],
            ["EQ17d", "\\max_{i} a_i", false, 31.348, [17.077, 17.532]],
            ["EQ17dd", "\\max_{i} a_i", true, undefined, [17.065, 17.532]],
            ["EQ18a", "\\underbrace{a+b}_{c}", false, 25.683, [22.357, 22.812]],
            ["EQ18ad", "\\underbrace{a+b}_{c}", true, undefined, [22.117, 22.572]],
            ["EQ18b", "\\overbrace{a+b}^{c}", false, 25.686, [23.077, 23.532]],
            ["EQ18bd", "\\overbrace{a+b}^{c}", true, undefined, [22.357, 22.812]],
            ["EQ18c", "\\boxed{E=mc^2}", false, 46.865, [16.105, 16.345]],
            ["EQ18cd", "\\boxed{E=mc^2}", true, undefined, [15.852, 16.105]],
            ["EQ20a", "a-=b", false, 32.068, [13.237, 13.692]],
            ["EQ20b", "a+-b", false, 33.903, [13.237, 13.692]],
            ["EQ20c", "a\\le-b", false, 35.146, [12.997, 13.452]],
            ["EQ20d", "(-x)", false, 23.547, [13.237, 13.692]],
            ["EQ20e", "x)+y", false, 30.216, [13.237, 13.692]],
            ["EQ20f", "a==b", false, 35.122, [13.237, 13.692]],
            ["EQ20g", "a,-b", false, 24.892, [13.237, 13.692]],
            ["EQ20h", "a|+b", false, 29.166, [13.225, 13.692]],
            ["EQ21a", "x.y", false, 16.628, [13.237, 13.692]],
            ["EQ21b", "1.2.3", false, 22.795, [13.237, 13.692]],
            ["EQ21c", "a.\\,b", false, 18.498, [12.985, 13.452]],
            ["EQ24a", "\\partial+x", false, 25.699, [13.237, 13.692]],
            ["EQ24b", "\\nabla=0", false, 27.505, [13.237, 13.692]],
            ["EQ24c", "\\partial(x)", false, 21.724, [12.985, 13.452]],
        ];
        for (const [name, latex, display, width, [low, high]] of probes) {
            const box = laidOut(latex, display);
            expect(box, name).to.be.an("object");
            expect(lineOf(box as EquationBox, display), `${name}'s line`).to.be.within(low - 1e-6, high + 1e-6);
            if (width !== undefined) {
                expect((box as EquationBox).width, `${name}'s width`).to.be.closeTo(width, 0.03);
            }
        }
    });

    it("should build up what Word's PDF of word-stops-equations2.docx shows, as wide and as tall as Word makes it", () => {
        // Word's widths and lines, in points, from its PDF of scripts/layout-probes/stops2/word-stops-equations2.ts, as
        // word-stops-equations.py reads them: scripts in paragraphs of other sizes (EQ30), superscripts in cramped parts
        // (EQ31), spaces beside fractions, brackets, sums and functions (EQ32), matrices whose rows are too tall to be a line
        // apart (EQ33), brackets (EQ34), roots (EQ35), boxes (EQ36), fractions beside other parts and in scripts, sums in
        // scripts, equation arrays, phantoms and braces (EQ37), symbols beside letters and operators next to each other
        // (EQ39), and bold and double-struck digits (EQ45), each in a line of text of its size, and displayed (the probe's
        // name ending in "d")
        const probes: readonly (readonly [string, string, boolean, number, number | undefined, readonly [number, number]])[] = [
            ["EQ30a1", "x^2", false, 9, 9.423, [10.837, 11.292]],
            ["EQ30a2", "x^{2^{3}}", false, 9, 12.667, [12.277, 12.732]],
            ["EQ30a3", "\\frac{a}{b}", false, 9, 4.225, [14.197, 14.652]],
            ["EQ30b1", "x^2", false, 10, 10.347, [12.037, 12.492]],
            ["EQ30b2", "x^{2^{3}}", false, 10, 14.206, [13.717, 14.172]],
            ["EQ30b3", "\\frac{a}{b}", false, 10, 4.555, [15.637, 16.092]],
            ["EQ30c1", "x^2", false, 10.5, 10.958, [12.757, 13.212]],
            ["EQ30c2", "x^{2^{3}}", false, 10.5, 14.838, [14.437, 14.892]],
            ["EQ30c3", "\\frac{a}{b}", false, 10.5, 4.887, [16.585, 16.825]],
            ["EQ30d1", "x^2", false, 12, 12.475, [14.665, 14.905]],
            ["EQ30d2", "x^{2^{3}}", false, 12, 16.991, [16.357, 16.812]],
            ["EQ30d3", "\\frac{a}{b}", false, 12, 5.532, [18.997, 19.452]],
            ["EQ30e1", "x^2", false, 14, 14.569, [17.077, 17.532]],
            ["EQ30e2", "x^{2^{3}}", false, 14, 19.742, [19.237, 19.692]],
            ["EQ30e3", "\\frac{a}{b}", false, 14, 6.475, [22.117, 22.572]],
            ["EQ30f1", "x^2", false, 16, 16.719, [19.465, 19.932]],
            ["EQ30f2", "x^{2^{3}}", false, 16, 22.846, [22.105, 22.572]],
            ["EQ30f3", "\\frac{a}{b}", false, 16, 7.473, [25.465, 25.932]],
            ["EQ31a", "\\frac{1}{x^2}", false, 11, 9.304, [18.517, 18.972]],
            ["EQ31ad", "\\frac{1}{x^2}", true, 11, undefined, [24.517, 24.972]],
            ["EQ31b", "\\sqrt{x^2}", false, 11, 18.777, [15.157, 15.612]],
            ["EQ31bd", "\\sqrt{x^2}", true, 11, undefined, [16.357, 16.812]],
            ["EQ31c", "x_{a^2}", false, 11, 15.709, [12.997, 13.452]],
            ["EQ31cd", "x_{a^2}", true, 11, undefined, [13.237, 13.692]],
            ["EQ31d", "\\overline{x^2}", false, 11, 11.552, [15.877, 16.332]],
            ["EQ31dd", "\\overline{x^2}", true, 11, undefined, [15.397, 15.852]],
            ["EQ31e", "\\hat{x^2}", false, 11, 11.555, [14.917, 15.372]],
            ["EQ31ed", "\\hat{x^2}", true, 11, undefined, [14.437, 14.892]],
            ["EQ31f", "\\frac{1}{e^{x^2}}", false, 11, 13.429, [18.997, 19.452]],
            ["EQ31fd", "\\frac{1}{e^{x^2}}", true, 11, undefined, [25.465, 25.932]],
            ["EQ32a", "2\\frac{a}{b}", false, 11, 13.124, [17.317, 17.772]],
            ["EQ32ad", "2\\frac{a}{b}", true, 11, undefined, [22.357, 22.812]],
            ["EQ32b", "\\frac{a}{b}x", false, 11, 13.223, [17.557, 18.012]],
            ["EQ32bd", "\\frac{a}{b}x", true, 11, undefined, [22.357, 22.812]],
            ["EQ32c", "x\\left(a+b\\right)", false, 11, 41.002, [13.237, 13.692]],
            ["EQ32cd", "x\\left(a+b\\right)", true, 11, undefined, [12.517, 12.972]],
            ["EQ32d", "\\left(a\\right)\\left(b\\right)", false, 11, 30.841, [13.237, 13.692]],
            ["EQ32dd", "\\left(a\\right)\\left(b\\right)", true, 11, undefined, [12.757, 13.212]],
            ["EQ32e", "\\left(a\\right)x", false, 11, 21.729, [13.237, 13.692]],
            ["EQ32ed", "\\left(a\\right)x", true, 11, undefined, [12.517, 12.972]],
            ["EQ32f", "2\\sum_{i} a_i", false, 11, 30.298, [13.237, 13.692]],
            ["EQ32fd", "2\\sum_{i} a_i", true, 11, undefined, [29.077, 29.532]],
            ["EQ32g", "x\\sin y", false, 11, 30.136, [13.237, 13.692]],
            ["EQ32gd", "x\\sin y", true, 11, undefined, [12.757, 13.212]],
            ["EQ32h", "\\sin x\\cos y", false, 11, 47.378, [13.237, 13.692]],
            ["EQ32i", "\\frac{a}{b}\\frac{c}{d}", false, 11, 12.405, [17.317, 17.772]],
            ["EQ32id", "\\frac{a}{b}\\frac{c}{d}", true, 11, undefined, [22.357, 22.812]],
            ["EQ32j", "a,\\frac{1}{2}", false, 11, 15.125, [18.517, 18.972]],
            ["EQ32jd", "a,\\frac{1}{2}", true, 11, undefined, [24.517, 24.972]],
            ["EQ32k", "\\frac{1}{2},a", false, 11, 16.964, [18.277, 18.732]],
            ["EQ32kd", "\\frac{1}{2},a", true, 11, undefined, [24.517, 24.972]],
            ["EQ32l", "\\sum_{i} a_i\\sum_{j} b_j", false, 11, 46.956, [14.197, 14.652]],
            ["EQ32ld", "\\sum_{i} a_i\\sum_{j} b_j", true, 11, undefined, [30.505, 30.972]],
            ["EQ33a", "\\begin{pmatrix} g & y \\\\ A & B \\end{pmatrix}", false, 11, 36.382, [19.957, 20.412]],
            ["EQ33ad", "\\begin{pmatrix} g & y \\\\ A & B \\end{pmatrix}", true, 11, undefined, [19.957, 20.412]],
            ["EQ33b", "\\begin{pmatrix} a & b \\\\ \\frac{1}{2} & d \\end{pmatrix}", false, 11, 36.755, [29.557, 30.012]],
            ["EQ33bd", "\\begin{pmatrix} a & b \\\\ \\frac{1}{2} & d \\end{pmatrix}", true, 11, undefined, [35.797, 36.252]],
            ["EQ33c", "\\begin{pmatrix} a_1 & b_2 \\\\ c_3 & d_4 \\end{pmatrix}", false, 11, 44.301, [24.757, 25.212]],
            ["EQ33cd", "\\begin{pmatrix} a_1 & b_2 \\\\ c_3 & d_4 \\end{pmatrix}", true, 11, undefined, [24.985, 25.225]],
            ["EQ33d", "\\begin{pmatrix} p & q \\\\ f & h \\\\ j & k \\end{pmatrix}", false, 11, 37.179, [36.265, 36.505]],
            ["EQ33dd", "\\begin{pmatrix} p & q \\\\ f & h \\\\ j & k \\end{pmatrix}", true, 11, undefined, [36.037, 36.492]],
            ["EQ33e", "\\begin{pmatrix} x_{i_j} & y \\\\ \\frac{a}{b} & z \\end{pmatrix}", false, 11, 42.5, [31.477, 31.932]],
            ["EQ33ed", "\\begin{pmatrix} x_{i_j} & y \\\\ \\frac{a}{b} & z \\end{pmatrix}", true, 11, undefined, [36.505, 36.972]],
            ["EQ34a", "\\left( x_i^{2^3} \\right)", false, 11, 26.533, [19.477, 19.932]],
            ["EQ34ad", "\\left( x_i^{2^3} \\right)", true, 11, undefined, [19.477, 19.932]],
            ["EQ34b", "\\left( A^{B^C} \\right)", false, 11, 28.401, [19.717, 20.172]],
            ["EQ34bd", "\\left( A^{B^C} \\right)", true, 11, undefined, [19.477, 19.932]],
            ["EQ34c", "\\left( x_{i_j} \\right)", false, 11, 23.315, [19.477, 19.932]],
            ["EQ34cd", "\\left( x_{i_j} \\right)", true, 11, undefined, [19.477, 19.932]],
            ["EQ34d", "\\left[ x_{i_j} \\right]", false, 11, 20.567, [19.477, 19.932]],
            ["EQ34dd", "\\left[ x_{i_j} \\right]", true, 11, undefined, [19.477, 19.932]],
            ["EQ34e", "\\left\\{ A^{B^C} \\right\\}", false, 11, 26.943, [19.465, 19.705]],
            ["EQ34ed", "\\left\\{ A^{B^C} \\right\\}", true, 11, undefined, [19.465, 19.705]],
            ["EQ34f", "\\left( \\sqrt{\\frac{a}{b}} \\right)", false, 11, 24.324, [26.677, 27.132]],
            ["EQ34fd", "\\left( \\sqrt{\\frac{a}{b}} \\right)", true, 11, undefined, [29.557, 30.012]],
            ["EQ34g", "\\left( \\sum_i a \\right)", false, 11, 28.249, [12.997, 13.452]],
            ["EQ34gd", "\\left( \\sum_i a \\right)", true, 11, undefined, [35.065, 35.532]],
            ["EQ34h", "\\left| \\frac{a}{b} \\right|", false, 11, 12.26, [19.465, 19.932]],
            ["EQ34hd", "\\left| \\frac{a}{b} \\right|", true, 11, undefined, [22.345, 22.812]],
            ["EQ35a", "\\sqrt{g}", false, 11, 15.096, [15.637, 16.092]],
            ["EQ35ad", "\\sqrt{g}", true, 11, undefined, [15.877, 16.332]],
            ["EQ35b", "\\sqrt{A}", false, 11, 14.309, [14.677, 15.132]],
            ["EQ35bd", "\\sqrt{A}", true, 11, undefined, [14.677, 15.132]],
            ["EQ35c", "\\sqrt{x_i}", false, 11, 17.46, [15.637, 16.092]],
            ["EQ35cd", "\\sqrt{x_i}", true, 11, undefined, [15.877, 16.332]],
            ["EQ35d", "\\sqrt{a_{i_j}}", false, 11, 21.082, [15.637, 16.092]],
            ["EQ35dd", "\\sqrt{a_{i_j}}", true, 11, undefined, [26.677, 27.132]],
            ["EQ35e", "\\sqrt{\\frac{1}{\\frac{1}{x}}}", false, 11, 15.098, [26.677, 27.132]],
            ["EQ35ed", "\\sqrt{\\frac{1}{\\frac{1}{x}}}", true, 11, undefined, [38.677, 39.132]],
            ["EQ35f", "\\sqrt{\\sum_i a}", false, 11, 27.278, [15.877, 16.332]],
            ["EQ35fd", "\\sqrt{\\sum_i a}", true, 11, undefined, [38.677, 39.132]],
            ["EQ35g", "\\sqrt{y_1}", false, 11, 18.84, [15.877, 16.332]],
            ["EQ35gd", "\\sqrt{y_1}", true, 11, undefined, [15.637, 16.092]],
            ["EQ35hd", "\\sqrt{\\frac{a}{b}+c}", true, 11, undefined, [26.665, 27.132]],
            ["EQ36a", "\\boxed{x}", false, 11, 11.331, [13.237, 13.692]],
            ["EQ36ad", "\\boxed{x}", true, 11, undefined, [12.757, 13.212]],
            ["EQ36b", "\\boxed{x_i}", false, 11, 14.427, [15.157, 15.612]],
            ["EQ36bd", "\\boxed{x_i}", true, 11, undefined, [15.157, 15.612]],
            ["EQ36c", "\\boxed{\\frac{a}{b}}", false, 11, 10.335, [22.597, 23.052]],
            ["EQ36cd", "\\boxed{\\frac{a}{b}}", true, 11, undefined, [27.397, 27.852]],
            ["EQ36d", "\\boxed{g}", false, 11, 12.064, [15.385, 15.625]],
            ["EQ36dd", "\\boxed{g}", true, 11, undefined, [15.385, 15.625]],
            ["EQ36e", "\\boxed{A}", false, 11, 12.222, [14.197, 14.652]],
            ["EQ36ed", "\\boxed{A}", true, 11, undefined, [13.945, 14.412]],
            ["EQ37a", "\\frac{1+\\frac{1}{x}}{2}", false, 11, 14.577, [23.797, 24.252]],
            ["EQ37ad", "\\frac{1+\\frac{1}{x}}{2}", true, 11, undefined, [33.157, 33.612]],
            ["EQ37b", "e^{\\frac{a}{b}}", false, 11, 10.905, [17.797, 18.252]],
            ["EQ37bd", "e^{\\frac{a}{b}}", true, 11, undefined, [17.797, 18.252]],
            ["EQ37c", "x^{\\sum_i a}", false, 11, 21.555, [14.197, 14.652]],
            ["EQ37cd", "x^{\\sum_i a}", true, 11, undefined, [13.957, 14.412]],
            ["EQ37d", "\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}", false, 11, 27.462, [21.877, 22.332]],
            ["EQ37dd", "\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}", true, 11, undefined, [22.117, 22.572]],
            ["EQ37e", "\\phantom{x}y", false, 11, 12.545, [13.237, 13.692]],
            ["EQ37ed", "\\phantom{x}y", true, 11, undefined, [12.517, 12.972]],
            ["EQ37f", "\\underbrace{x}_{n}", false, 11, 6.795, [22.357, 22.812]],
            ["EQ37fd", "\\underbrace{x}_{n}", true, 11, undefined, [22.357, 22.812]],
            ["EQ37g", "\\overbrace{xyz}^{n}", false, 11, 17.532, [20.437, 20.892]],
            ["EQ37gd", "\\overbrace{xyz}^{n}", true, 11, undefined, [19.957, 20.412]],
            ["EQ37hd", "\\underbrace{a+b+c+d+e+f+g+h}_{n}", true, 11, undefined, [23.545, 24.012]],
            ["EQ39a", "a\\to b", false, 11, 27.905, [13.237, 13.692]],
            ["EQ39b", "a\\Rightarrow b", false, 11, 28.214, [13.237, 13.692]],
            ["EQ39c", "a\\cup b", false, 11, 24.959, [12.997, 13.452]],
            ["EQ39d", "a\\cap b", false, 11, 24.961, [13.237, 13.692]],
            ["EQ39e", "a\\in B", false, 11, 26.89, [13.237, 13.692]],
            ["EQ39f", "A\\subset B", false, 11, 28.923, [13.237, 13.692]],
            ["EQ39g", "p\\land q", false, 11, 23.919, [13.237, 13.692]],
            ["EQ39h", "\\forall x", false, 11, 13.111, [13.237, 13.692]],
            ["EQ39i", "a\\cdot b", false, 11, 20.574, [13.237, 13.692]],
            ["EQ39j", "-+a", false, 11, 27.731, [12.997, 13.452]],
            ["EQ39k", "a+--b", false, 11, 47.015, [13.237, 13.692]],
            ["EQ39l", "a\\times-b", false, 11, 33.546, [13.237, 13.692]],
            ["EQ39m", "a\\oplus b", false, 11, 28.419, [13.237, 13.692]],
            ["EQ39n", "x\\mapsto y", false, 11, 28.246, [13.237, 13.692]],
            ["EQ39o", "\\neg p", false, 11, 14.496, [13.225, 13.692]],
            ["EQ45a", "\\mathbf{12}", false, 11, 13.168, [13.237, 13.692]],
            ["EQ45b", "\\boldsymbol{12}", false, 11, 13.17, [13.237, 13.692]],
            ["EQ45c", "\\mathbb{1}", false, 11, 5.095, [12.997, 13.452]],
            ["EQ45d", "\\mathbf{2x}", false, 11, 12.37, [13.237, 13.692]],
            ["EQ45e", "x^{\\mathbf{2}}", false, 11, 11.712, [13.945, 14.412]],
        ];
        for (const [name, latex, display, size, width, [low, high]] of probes) {
            const box = laidOut(latex, display, size);
            expect(box, name).to.be.an("object");
            expect(lineOf(box as EquationBox, display, size), `${name}'s line`).to.be.within(low - 1e-6, high + 1e-6);
            if (width !== undefined) {
                expect((box as EquationBox).width, `${name}'s width`).to.be.closeTo(width, 0.03);
            }
        }
    });

    it("should space operators next to each other as Word does, and full stops, italic signs and runs of another size", () => {
        // Word's widths, in points (`word-stops-equations.docx` EQ20 to EQ24): no space beside an operator before a
        // relation (EQ20a), the rest as TeX spaces them; a full stop as punctuation but between digits (EQ21); an italic
        // sign's italic correction before what isn't ordinary (EQ24); and a run of another size without the italic correction
        // of the letter before it (EQ22)
        const widths: readonly (readonly [string, number])[] = [
            ["a\u2212=b", 32.081],
            ["a+\u2212b", 33.906],
            ["a\u2264\u2212b", 35.157],
            ["(\u2212x)", 23.557],
            ["x)+y", 30.218],
            ["a==b", 35.135],
            ["a,\u2212b", 24.898],
            ["a|+b", 29.179],
            ["x.y", 16.623],
            ["1.2.3", 22.795],
            ["\u2202+x", 25.699],
            ["\u2207=0", 27.499],
            ["\u2202(x)", 21.731],
        ];
        for (const [text, word] of widths) {
            const box = layOutEquation(equation(text), 11) as EquationBox;
            expect(box.width, text).to.be.closeTo(word, 0.03);
        }
        const sized = { "m:r": [{ "w:rPr": [{ "w:sz": { _attr: { "w:val": 32 } } }] }, { "m:t": ["b"] }] };
        const mixed = layOutEquation(equation("a+", sized, "+c"), 11) as EquationBox;
        expect(mixed.width).to.be.closeTo(46.666, 0.03);
        // Its line as tall as the larger letter's ink, with the line gap of the equation's size above it (EQ22)
        expect(mixed.ascent).to.be.within(12.42, 12.89);
    });

    it("should lay out an equation in the size its runs give, rather than its paragraph's (word-equations2.docx EQ9e)", () => {
        const sized = { "m:r": [{ "w:rPr": [{ "w:sz": { _attr: { "w:val": 32 } } }] }, { "m:t": ["x+y"] }] };
        expect(widthOf(sized)).to.be.closeTo(745.73, 0.1);
        expect((layOutEquation(equation(sized), 11) as EquationBox).ascent).to.be.closeTo((1946 / 2048) * 16, 1e-9);
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

    it("should draw letters in the alphabet and style a run gives, as Word does (word-stops-equations.docx EQ19)", () => {
        // Word's widths, in points: double-struck R, script L with its italic correction, fraktur g, bold F, bold italic alpha,
        // and a plain d before an italic x
        expect((layOutEquation(equation(run("R", alphabet("double-struck"), style("p"))), 11) as EquationBox).width).to.be.closeTo(
            8.191,
            0.03,
        );
        expect((layOutEquation(equation(run("L", alphabet("script"), style("p"))), 11) as EquationBox).width).to.be.closeTo(6.843, 0.03);
        expect((layOutEquation(equation(run("g", alphabet("fraktur"), style("p"))), 11) as EquationBox).width).to.be.closeTo(5.5, 0.03);
        expect((layOutEquation(equation(run("F", style("b"))), 11) as EquationBox).width).to.be.closeTo(6.229, 0.03);
        expect((layOutEquation(equation(run("\u03b1", style("bi"))), 11) as EquationBox).width).to.be.closeTo(7.385, 0.03);
        expect((layOutEquation(equation(run("d", style("p")), "x"), 11) as EquationBox).width).to.be.closeTo(12.296, 0.03);
        // An italic Greek letter in the italic style, a script letter in the letterlike symbols, and a Greek symbol Word draws
        // in italic
        expect(widthOf(run("\u03b1", style("i")))).to.equal(widthOf("\u03b1"));
        expect(widthOf(run("B", alphabet("script")))).to.be.a("number");
        expect(widthOf("\u03d5")).to.be.a("number");
        // Digits are upright, as they are, in an italic or plain run, and Unicode's bold digits in a bold or bold italic one,
        // and its double-struck ones (`word-stops-equations2.docx` EQ45)
        expect(widthOf(run("1", style("i")))).to.equal(widthOf(run("1", style("p"))));
        expect(widthOf(run("12", style("b")))).to.equal(widthOf(run("12", style("bi"))));
        expect(widthOf(run("12", style("b")))).to.not.equal(widthOf(run("12", style("p"))));
        expect(widthOf(run("1", alphabet("double-struck"), style("p")))).to.equal(widthOf(run("1", alphabet("double-struck"))));
        // Bold and the spacing of its characters, which Word leaves as they are (EQ28)
        const bold = { "m:r": [{ "w:rPr": [{ "w:b": {} }, { "w:spacing": { _attr: { "w:val": 40 } } }] }, { "m:t": ["a+b=c"] }] };
        expect(widthOf(bold)).to.equal(widthOf("a+b=c"));
    });

    it("should lay out several equations in a row as one, and show nothing for an empty one in a line of text", () => {
        // Two equations in one displayed paragraph are on one line, the second right after the first (EQ25c)
        const two = layOutEquations([equation("x+y=z"), equation("x+y=z")], 11, true) as EquationBox;
        expect(two.width).to.be.closeTo(90.76, 0.03);
        expect(layOutEquation([], 11)).to.deep.equal({ width: 0, ascent: 0, descent: 0 });
        expect(layOutEquation([], 11, true)).to.equal("an empty equation on a line of its own");
    });

    it("should say why an equation Word builds up, or spaces or formats in a way not yet followed, can't be laid out", () => {
        const empty = "a part of an equation with nothing in it";
        expect(widthOf({ "m:f": [] })).to.equal(empty);
        expect(widthOf({ "m:sPre": [{ "m:sub": equation("1") }, { "m:sup": equation("2") }, { "m:e": equation("x") }] })).to.equal(
            BUILT_UP,
        );
        expect(widthOf({ "m:sSup": [{ "m:sup": equation("2") }] })).to.equal(empty);
        expect(widthOf({ "m:m": [] })).to.equal(empty);
        expect(widthOf({ "m:m": [{ "m:mr": [] }] })).to.equal(empty);
        // Operators next to each other, the second binary after a unary first (`word-stops-equations2.docx` EQ39j), and
        // symbols Word has seen only next to themselves
        expect(widthOf("\u2212+a")).to.be.a("number");
        expect(widthOf("a\u2192\u2192b")).to.be.a("number");
        expect(widthOf("a\u2297b")).to.equal("an equation with a symbol Word hasn't been seen to space");
        expect(widthOf("\u2297\u2297")).to.be.a("number");
        expect(widthOf("\u2603")).to.equal("a character in an equation Cambria Math doesn't have");
        expect(widthOf({ "m:r": [{ "w:rPr": [{ "w:i": {} }] }, { "m:t": ["x"] }] })).to.equal(
            "an equation whose text has formatting of its own",
        );
        expect(widthOf(run("x", { "m:nor": {} }))).to.equal("an equation with normal text (`m:nor`)");
        expect(widthOf(run("x", { "m:nor": { _attr: { "m:val": "0" } } }))).to.equal(widthOf("x"));
        for (const properties of [[alphabet("sans-serif")], [alphabet("fraktur"), style("b")], [alphabet("script"), style("p")]]) {
            expect(widthOf(run("\u03b1", ...properties))).to.equal("an equation in an alphabet or style Word hasn't been seen drawing");
        }
        expect(widthOf(run("1", alphabet("fraktur")))).to.equal("an equation in an alphabet or style Word hasn't been seen drawing");
        const script = {
            "m:sSup": [
                { "m:e": equation("x") },
                { "m:sup": [{ "m:r": [{ "w:rPr": [{ "w:sz": { _attr: { "w:val": 32 } } }] }, { "m:t": ["2"] }] }] },
            ],
        };
        expect(widthOf(script)).to.equal("an equation whose script's run has a size of its own");
    });

    it("should stop at what Word's PDFs haven't shown it building up", () => {
        const fraction = (type: string, ...parts: readonly object[]): object => ({
            "m:f": [
                { "m:fPr": [property("m:type", type)] },
                { "m:num": parts.length > 0 ? parts : equation("a") },
                { "m:den": equation("b") },
            ],
        });
        expect(widthOf(fraction("skw"))).to.equal("a skewed or linear fraction");
        expect(widthOf(fraction("noBar"))).to.be.a("number");
        // A superscript in a lower limit, which TeX cramps
        const lower = "a superscript in a lower limit, which Word hasn't been seen to cramp or not";
        expect(laidOut("\\sum_{i^2} x")).to.equal(lower);
        expect(laidOut("\\lim_{x^2} y")).to.equal(lower);
        expect(laidOut("\\sum_{\\frac{1}{i^2}} x", true)).to.be.an("object");
        // Spaces beside a fraction, a sum or a function Word hasn't been seen to put or not, as before a bracket
        expect(laidOut("\\frac{a}{b}(x)")).to.equal(
            "an equation with a fraction, a sum or a function beside a bracket or bar, which Word spaces in a way not yet followed",
        );
        expect(laidOut("=\\frac{a}{b}")).to.be.an("object");
        // Sums Word hasn't been seen to grow, or put in a script's script, or a character without sizes for a displayed one
        const nary = (...properties: readonly object[]): object => ({
            "m:nary": [{ "m:naryPr": properties }, { "m:sub": equation("i") }, { "m:sup": equation("n") }, { "m:e": equation("x") }],
        });
        expect(widthOf(nary(property("m:chr", "\u2211"), property("m:grow", "1")))).to.equal(BUILT_UP);
        expect(widthOf(nary(property("m:limLoc", "other")))).to.equal(BUILT_UP);
        expect(layOutEquation(equation(nary(property("m:chr", "x"))), 11, true)).to.equal(BUILT_UP);
        expect(laidOut("x^{y^{\\sum a}}")).to.equal(BUILT_UP);
        expect(widthOf(nary(property("m:chr", "\u2211")))).to.be.a("number");
        expect(widthOf(nary())).to.be.a("number");
        // Brackets Word hasn't been seen to keep from growing, shape, or grow when angled, and brackets taller than any
        const brackets = (properties: readonly object[], ...parts: readonly object[]): object => ({
            "m:d": [{ "m:dPr": properties }, { "m:e": parts }],
        });
        expect(widthOf(brackets([property("m:grow", "0")], ...equation("x")))).to.equal("brackets that don't grow with what is in them");
        expect(widthOf(brackets([property("m:grow", "1")], ...equation("x")))).to.be.a("number");
        expect(widthOf(brackets([property("m:shp", "match")], ...equation("x")))).to.equal(
            "brackets that match the shape of what is in them",
        );
        expect(widthOf(brackets([property("m:begChr", "\u27e8"), property("m:endChr", "\u27e9")], ...equation(fraction("bar"))))).to.equal(
            "angle brackets that grow",
        );
        const tall = (count: number): object => (count === 0 ? equation("x")[0] : fraction("bar", tall(count - 1)));
        expect(layOutEquation(equation(brackets([], tall(9))), 11, true)).to.equal("brackets taller than Cambria Math's tallest");
        // A part between two sizes of a bracket, as Word's PDFs leave it
        expect(laidOut("\\left( x^{a^{t}} \\right)")).to.equal("brackets whose size Word's PDFs leave between two");
        // A matrix spaced or lined up otherwise
        const matrix = (properties: readonly object[]): object => ({
            "m:m": [{ "m:mPr": properties }, { "m:mr": [{ "m:e": equation("a") }] }],
        });
        expect(widthOf(matrix([property("m:baseJc", "top")]))).to.equal("a matrix spaced or lined up in a way not yet followed");
        expect(widthOf(matrix([property("m:rSpRule", "1")]))).to.equal("a matrix spaced or lined up in a way not yet followed");
        expect(widthOf(matrix([]))).to.be.a("number");
        // A root too tall for any sign, or between two sizes of its sign, as Word's PDFs leave it
        expect(
            layOutEquation(
                equation({ "m:rad": [{ "m:radPr": [property("m:degHide", "1")] }, { "m:deg": [] }, { "m:e": [tall(12)] }] }),
                11,
                true,
            ),
        ).to.equal("a root taller than Cambria Math's tallest root sign");
        expect(laidOut("\\sqrt{p}")).to.equal("a root whose sign's size Word's PDFs leave between two");
        // A brace or accent between two of its sizes, as Word's PDFs leave it, a character without sizes, and an arrow over a
        // part too narrow for it made of its parts
        const brace = (character: string | undefined, ...parts: readonly (string | object)[]): object => ({
            "m:groupChr": [
                { "m:groupChrPr": character === undefined ? [] : [property("m:chr", character)] },
                { "m:e": equation(...parts) },
            ],
        });
        expect(widthOf(brace(undefined, "abc"))).to.equal("a brace whose size Word's PDFs leave between two");
        expect(widthOf({ "m:acc": [{ "m:e": equation("d") }] })).to.equal("an accent whose size Word's PDFs leave between two");
        expect(widthOf(brace("x", "a+b+c"))).to.equal("a character grown over or under a part that Cambria Math has no sizes of");
        expect(widthOf(brace("\u2192", "ei"))).to.equal(
            "a character grown over or under a part narrower than the character made of its parts",
        );
        expect(widthOf(brace("\u2192", "xi"))).to.be.a("number");
        // A box with a side hidden, a phantom that takes less than its part's room, and an equation array lined up otherwise
        const box = { "m:borderBox": [{ "m:borderBoxPr": [property("m:hideTop", "1")] }, { "m:e": equation("x") }] };
        expect(widthOf(box)).to.equal("a box with a side hidden or struck through");
        const phantom = { "m:phant": [{ "m:phantPr": [property("m:zeroWid", "1")] }, { "m:e": equation("x") }] };
        expect(widthOf(phantom)).to.equal("a phantom that takes less than its part's room");
        const array = (properties: readonly object[], ...rows: readonly (readonly (string | object)[])[]): object => ({
            "m:eqArr": [{ "m:eqArrPr": properties }, ...rows.map((row) => ({ "m:e": equation(...row) }))],
        });
        const otherwise = "an equation array lined up in a way not yet followed";
        expect(widthOf(array([property("m:baseJc", "top")], ["a&=b"]))).to.equal(
            "an equation array spaced or lined up in a way not yet followed",
        );
        expect(widthOf(array([property("m:maxDist", "1")], ["a&=b"]))).to.equal(
            "an equation array spaced or lined up in a way not yet followed",
        );
        expect(widthOf(array([property("m:rSp", "4")], ["a&=b"]))).to.equal(
            "an equation array spaced or lined up in a way not yet followed",
        );
        expect(widthOf(array([], ["a=b"]))).to.equal(otherwise);
        expect(widthOf(array([], ["a&=b&c"]))).to.equal(otherwise);
        expect(widthOf(array([], [run("a", { "m:aln": {} }), "&=b"]))).to.equal(otherwise);
        expect(widthOf(array([]))).to.equal("a part of an equation with nothing in it");
    });

    it("should space a matrix's rows a line of Cambria Math apart, each checked against the row before", () => {
        const row = (...cells: readonly string[]): object => ({ "m:mr": cells.map((cell) => ({ "m:e": equation(cell) })) });
        const two = layOutEquation(equation({ "m:m": [row("1", "2"), row("3", "4")] }), 11) as EquationBox;
        const three = layOutEquation(equation({ "m:m": [row("1", "2"), row("3", "4"), row("5", "6")] }), 11) as EquationBox;
        // A third row of digits is one line of Cambria Math, 2401 of its 2048 units, below the second (EQ15)
        expect(three.ascent + three.descent - (two.ascent + two.descent)).to.be.closeTo((2401 / 2048) * 11, 1e-9);
        // A deep row before a tall one is further below it, where their ink would come nearer than the gap (EQ15b,
        // `word-stops-equations2.docx` EQ33)
        const deep = layOutEquation(equation({ "m:m": [row("1", "2"), row("g", "y"), row("A", "B")] }), 11) as EquationBox;
        expect(deep.ascent + deep.descent).to.be.greaterThan(three.ascent + three.descent);
    });

    it("should build up the rest of what Word builds up, as it does", () => {
        // A root with a degree, and an accent over a capital, raised over its height
        expect(laidOut("\\sqrt[n]{x}")).to.be.an("object");
        const accent = laidOut("\\hat{A}") as EquationBox;
        expect(accent.ascent).to.be.greaterThan((laidOut("\\hat{a}") as EquationBox).ascent);
        // Limits over and under, a function with its own name, a sub- and superscript beside an integral, and a stack
        expect(laidOut("\\overbrace{a+b}^{c}")).to.be.an("object");
        expect(widthOf({ "m:limUpp": [{ "m:e": equation("x") }, { "m:lim": equation("n") }] })).to.be.a("number");
        expect(widthOf({ "m:func": [{ "m:fName": equation(run("sin", style("p"))) }, { "m:e": equation("x") }] })).to.be.a("number");
        expect(laidOut("\\int_0^1 x", true)).to.be.an("object");
        expect(laidOut("\\binom{n}{k}", true)).to.be.an("object");
        // A tall base raises its superscript, and a deep one lowers its subscript
        const tallBase = laidOut("{\\frac{a}{b}}^2") as EquationBox;
        expect(tallBase.ascent).to.be.greaterThan((laidOut("x^2") as EquationBox).ascent);
        expect(laidOut("{\\frac{a}{b}}_2")).to.be.an("object");
        // A stack whose parts are too close moved apart, a superscript on an integral as a glyph that is a shape grown to a
        // size, a matrix with a shorter row, and parts with their properties' defaults
        const over = { "m:f": [{ "m:num": equation("a") }, { "m:den": equation("b") }] };
        const stack = { "m:f": [{ "m:fPr": [property("m:type", "noBar")] }, { "m:num": equation("y") }, { "m:den": [over] }] };
        expect(layOutEquation(equation(stack), 11, true)).to.be.an("object");
        expect(widthOf({ "m:sSup": [{ "m:e": equation("\u222b") }, { "m:sup": equation("2") }] })).to.be.a("number");
        expect(laidOut("\\begin{pmatrix} a & b \\\\ c \\end{pmatrix}")).to.be.an("object");
        expect(widthOf({ "m:acc": [{ "m:e": equation("x") }] })).to.equal(
            widthOf({ "m:acc": [{ "m:accPr": [property("m:chr", "\u0302")] }, { "m:e": equation("x") }] }),
        );
        expect(widthOf({ "m:acc": [{ "m:accPr": [property("m:chr", "\u0307")] }, { "m:e": equation("x") }] })).to.be.a("number");
        expect(widthOf({ "m:bar": [{ "m:e": equation("x") }] })).to.be.a("number");
        expect(widthOf({ "m:rad": [{ "m:radPr": [property("m:degHide")] }, { "m:deg": [] }, { "m:e": equation("x") }] })).to.be.a("number");
        // An equation array with a row with nothing before its ampersand, and a phantom shown
        expect(widthOf({ "m:eqArr": [{ "m:e": equation("&=b") }, { "m:e": equation("a&=b") }] })).to.be.a("number");
        expect(widthOf({ "m:phant": [{ "m:e": equation("x") }] })).to.equal(widthOf("x"));
        // A full stop at the start and the end, and a matrix whose row is shorter than the other's
        expect(widthOf(".5")).to.be.a("number");
        expect(widthOf("1.")).to.be.a("number");
        const row = (...cells: readonly string[]): object => ({ "m:mr": cells.map((cell) => ({ "m:e": equation(cell) })) });
        expect(widthOf({ "m:m": [row("a", "b"), row("c")] })).to.be.a("number");
        // A script's script, and a subscript beside a glyph without kerning
        expect(laidOut("x^{2^{3^4}}")).to.be.an("object");
        expect(laidOut("1_2")).to.be.an("object");
    });
});
