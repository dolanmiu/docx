import { describe, expect, it } from "vitest";
import xml from "xml";

import { Formatter } from "@export/formatter";
import {
    Math,
    type MathComponent,
    MathFraction,
    MathFunction,
    MathLimitLower,
    MathLimitUpper,
    MathRadical,
    MathRun,
    type MathRunOptions,
    MathSubScript,
    MathSubSuperScript,
    MathSuperScript,
} from "docx";

import { latexToMath } from "./latex-to-math";
import { MathAccent } from "./math-accent";
import { MathBar } from "./math-bar";
import { MathBox } from "./math-box";
import { MathBrace } from "./math-brace";
import { MathBrackets } from "./math-brackets";
import { MathCases } from "./math-cases";
import { MathEquationArray } from "./math-equation-array";
import { MathLargeOperator } from "./math-large-operator";
import { MathMatrix } from "./math-matrix";
import { MathPhantom } from "./math-phantom";

const written = (...children: readonly MathComponent[]): string => xml(new Formatter().format(new Math({ children })));

/** The math the LaTeX is read as, written, to compare with the same math built by hand */
const read = (latex: string): string => written(...latexToMath(latex));

const run = (text: string, options: Omit<MathRunOptions, "text"> = {}): MathRun => new MathRun({ text, ...options });
const plain = (text: string): MathRun => run(text, { style: "plain" });
const words = (text: string): MathRun => run(text, { normalText: true });
const space = (): MathRun => new MathRun("\u200B");
const fn = (name: string, ...children: readonly MathComponent[]): MathFunction => new MathFunction({ name: [plain(name)], children });

describe("latexToMath", () => {
    describe("text and symbols", () => {
        it("joins letters, digits and operators in one run, with a minus sign for a hyphen, as LaTeX draws it", () => {
            expect(read("a + 2b - c * d")).toBe(written(run("a+2b−c∗d")));
        });

        it("leaves out spaces, and comments", () => {
            expect(read("a   b % a comment\n c")).toBe(written(run("abc")));
        });

        it("writes Greek letters, with capitals upright as LaTeX draws them, and italic ones for \\varGamma", () => {
            expect(read("\\alpha\\varepsilon\\phi\\varphi \\Gamma \\varDelta")).toBe(
                written(run("αεϕφ"), plain("Γ"), run("Δ", { style: "italic" })),
            );
        });

        it("keeps the font it is in for capital Greek letters", () => {
            expect(read("\\mathbf{\\Omega}")).toBe(written(run("Ω", { style: "bold" })));
            expect(read("\\mathbf{\\varOmega}")).toBe(written(run("Ω", { style: "bold" })));
        });

        it("writes symbols, relations and arrows", () => {
            expect(
                read(
                    "\\infty \\le \\ne \\in \\to \\Rightarrow \\times \\cdot \\pm \\ldots \\cdots \\{ \\} \\| \\langle \\rangle \\backslash",
                ),
            ).toBe(written(run("∞≤≠∈→⇒×⋅±…⋯{}‖⟨⟩\\")));
        });

        it("takes characters typed as they are", () => {
            expect(read("α ≤ β")).toBe(written(run("α≤β")));
        });

        it("writes spaces as spaces of their width, and leaves out negative ones", () => {
            expect(read("a\\,b\\:c\\;d\\quad e\\qquad f\\!g~h\\ i\\enspace j")).toBe(
                written(run("a\u2009b\u2005c\u2004d\u2003e\u2003\u2003fg\u00A0h\u2004i\u2002j")),
            );
        });

        it("writes \\& and \\# literally, so an equation array doesn't take them as a point or a number", () => {
            expect(read("a \\& b \\# c")).toBe(
                written(run("a"), run("&", { literal: true }), run("b"), run("#", { literal: true }), run("c")),
            );
        });

        it("writes escaped characters", () => {
            expect(read("\\% \\$ \\_")).toBe(written(run("%$_")));
        });

        it("writes a relation with a line through it for \\not", () => {
            expect(read("a \\not= b \\not\\in C \\not< d \\not\\perp e \\not| f")).toBe(written(run("a≠b∉C≮d⊥\u0338e|\u0338f")));
        });

        it("writes a colon as a relation, and a tilde as a space that doesn't break", () => {
            expect(read("f\\colon A \\to B")).toBe(written(run("f:A→B")));
        });
    });

    describe("scripts", () => {
        it("writes a superscript, a subscript and both, in either order", () => {
            expect(read("x^2")).toBe(written(new MathSuperScript({ children: [run("x")], superScript: [run("2")] })));
            expect(read("x_i")).toBe(written(new MathSubScript({ children: [run("x")], subScript: [run("i")] })));
            const both = written(new MathSubSuperScript({ children: [run("x")], subScript: [run("i")], superScript: [run("2")] }));
            expect(read("x_i^2")).toBe(both);
            expect(read("x^2_i")).toBe(both);
        });

        it("puts a script on the letter before it only, and on a group in braces", () => {
            expect(read("ab^2")).toBe(written(run("a"), new MathSuperScript({ children: [run("b")], superScript: [run("2")] })));
            expect(read("{a+b}^2")).toBe(written(new MathSuperScript({ children: [run("a+b")], superScript: [run("2")] })));
        });

        it("reads a number as one base, but a script of one token as its first character, as LaTeX does", () => {
            expect(read("10.5^{-3}")).toBe(written(new MathSuperScript({ children: [run("10.5")], superScript: [run("−3")] })));
            expect(read("x^12")).toBe(written(new MathSuperScript({ children: [run("x")], superScript: [run("1")] }), run("2")));
        });

        it("writes a script of a command that writes nothing with a zero-width space", () => {
            expect(read("x^\\!")).toBe(written(new MathSuperScript({ children: [run("x")], superScript: [space()] })));
        });

        it("takes a command and its arguments as a script", () => {
            expect(read("e^\\alpha")).toBe(written(new MathSuperScript({ children: [run("e")], superScript: [run("α")] })));
            expect(read("x^\\frac12")).toBe(
                written(
                    new MathSuperScript({
                        children: [run("x")],
                        superScript: [new MathFraction({ numerator: [run("1")], denominator: [run("2")] })],
                    }),
                ),
            );
        });

        it("writes primes as a superscript, before any other", () => {
            expect(read("f'")).toBe(written(new MathSuperScript({ children: [run("f")], superScript: [run("′")] })));
            expect(read("f''")).toBe(written(new MathSuperScript({ children: [run("f")], superScript: [run("″")] })));
            expect(read("f'''")).toBe(written(new MathSuperScript({ children: [run("f")], superScript: [run("‴")] })));
            expect(read("f''''")).toBe(written(new MathSuperScript({ children: [run("f")], superScript: [run("⁗")] })));
            expect(read("f'''''")).toBe(written(new MathSuperScript({ children: [run("f")], superScript: [run("′′′′′")] })));
            expect(read("f'^2")).toBe(written(new MathSuperScript({ children: [run("f")], superScript: [run("′2")] })));
        });

        it("puts scripts with nothing before them on an empty base, as for an isotope", () => {
            expect(read("{}^{14}_{6}C")).toBe(
                written(new MathSubSuperScript({ children: [space()], subScript: [run("6")], superScript: [run("14")] }), run("C")),
            );
            expect(read("^2")).toBe(written(new MathSuperScript({ children: [space()], superScript: [run("2")] })));
            expect(read("'")).toBe(written(new MathSuperScript({ children: [space()], superScript: [run("′")] })));
        });

        it("writes an empty script with a zero-width space", () => {
            expect(read("x^{}")).toBe(written(new MathSuperScript({ children: [run("x")], superScript: [space()] })));
        });

        it("throws for two superscripts or subscripts in a row, or a prime after a superscript", () => {
            expect(() => latexToMath("x^a^b")).toThrow(
                "latexToMath: there are two superscripts in a row. Put them in braces, as in x^{ab}, at character 4",
            );
            expect(() => latexToMath("x_a_b")).toThrow("there are two subscripts in a row");
            expect(() => latexToMath("x^2'")).toThrow("a prime follows a superscript");
        });

        it("throws for a script with nothing to raise", () => {
            expect(() => latexToMath("x^")).toThrow("^ needs an argument");
            expect(() => latexToMath("x^_2")).toThrow("^ needs an argument");
            expect(() => latexToMath("{x^}")).toThrow("^ needs an argument");
        });
    });

    describe("fractions and roots", () => {
        const fraction = new MathFraction({ numerator: [run("a")], denominator: [run("b")] });

        it("writes \\frac and its kinds as fractions", () => {
            for (const latex of ["\\frac{a}{b}", "\\dfrac ab", "\\tfrac{a}{b}", "\\cfrac[l]{a}{b}", "{a \\over b}", "a \\over b"]) {
                expect(read(latex), latex).toBe(written(fraction));
            }
        });

        it("writes an empty numerator or denominator with a zero-width space", () => {
            expect(read("\\frac{}{}")).toBe(written(new MathFraction({ numerator: [space()], denominator: [space()] })));
        });

        it("writes \\nicefrac and \\sfrac as skewed fractions", () => {
            const skewed = written(new MathFraction({ numerator: [run("1")], denominator: [run("2")], type: "skewed" }));
            expect(read("\\nicefrac{1}{2}")).toBe(skewed);
            expect(read("\\sfrac12")).toBe(skewed);
        });

        it("writes binomial coefficients as fractions without a bar, in round brackets", () => {
            const binomial = written(
                new MathBrackets({ children: [new MathFraction({ numerator: [run("n")], denominator: [run("k")], type: "noBar" })] }),
            );
            for (const latex of ["\\binom{n}{k}", "\\dbinom nk", "\\tbinom{n}{k}", "{n \\choose k}"]) {
                expect(read(latex), latex).toBe(binomial);
            }
        });

        it("writes \\atop, \\brace and \\brack as fractions without a bar", () => {
            const noBar = new MathFraction({ numerator: [run("a")], denominator: [run("b")], type: "noBar" });
            expect(read("{a \\atop b}")).toBe(written(noBar));
            expect(read("{a \\brace b}")).toBe(written(new MathBrackets({ open: "{", close: "}", children: [noBar] })));
            expect(read("{a \\brack b}")).toBe(written(new MathBrackets({ open: "[", close: "]", children: [noBar] })));
        });

        it("throws for two fractions written between numerator and denominator in one group", () => {
            expect(() => latexToMath("{a \\over b \\over c}")).toThrow(
                "\\over follows \\over in the same group. Put one of them in braces",
            );
        });

        it("writes square roots and roots of any degree", () => {
            expect(read("\\sqrt{x}")).toBe(written(new MathRadical({ children: [run("x")] })));
            expect(read("\\sqrt[3]{x}")).toBe(written(new MathRadical({ children: [run("x")], degree: [run("3")] })));
            expect(read("\\sqrt[]{x}")).toBe(written(new MathRadical({ children: [run("x")] })));
            expect(read("\\sqrt2")).toBe(written(new MathRadical({ children: [run("2")] })));
        });

        it("throws for a root's degree with no closing bracket", () => {
            expect(() => latexToMath("\\sqrt[3{x}")).toThrow("\\sqrt's option has no closing ]");
            expect(() => latexToMath("\\sqrt[{3}")).toThrow("\\sqrt's option has no closing ]");
            expect(() => latexToMath("\\sqrt[3}]{x}")).toThrow("a } has no { before it");
        });
    });

    describe("large operators", () => {
        it("writes a sum with its limits, over what comes after it up to a relation", () => {
            expect(read("\\sum_{i=1}^n i^2 = S")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "sum",
                        subScript: [run("i=1")],
                        superScript: [run("n")],
                        children: [new MathSuperScript({ children: [run("i")], superScript: [run("2")] })],
                    }),
                    run("=S"),
                ),
            );
        });

        it("ends what an operator applies to at a + or −, or punctuation, but not at a sign that comes first", () => {
            expect(read("\\sum_i a_i + b")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "sum",
                        subScript: [run("i")],
                        children: [new MathSubScript({ children: [run("a")], subScript: [run("i")] })],
                    }),
                    run("+b"),
                ),
            );
            expect(read("\\prod -x, y")).toBe(written(new MathLargeOperator({ operator: "product", children: [run("−x")] }), run(",y")));
        });

        it("takes an integral's differential, and brackets whole, into what it applies to", () => {
            expect(read("\\int_0^1 f(x+1)\\,dx")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "integral",
                        subScript: [run("0")],
                        superScript: [run("1")],
                        children: [run("f(x+1)\u2009dx")],
                    }),
                ),
            );
        });

        it("ends at the bracket that closes the brackets it is in", () => {
            expect(read("(\\sum a)^2")).toBe(
                written(
                    run("("),
                    new MathLargeOperator({ operator: "sum", children: [run("a")] }),
                    new MathSuperScript({ children: [run(")")], superScript: [run("2")] }),
                ),
            );
        });

        it("holds an operator that comes first, and ends at one that comes later", () => {
            expect(read("\\sum_i \\sum_j a \\int b")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "sum",
                        subScript: [run("i")],
                        children: [new MathLargeOperator({ operator: "sum", subScript: [run("j")], children: [run("a")] })],
                    }),
                    new MathLargeOperator({ operator: "integral", children: [run("b")] }),
                ),
            );
            expect(read("\\int a \\int b")).toBe(
                written(
                    new MathLargeOperator({ operator: "integral", children: [run("a")] }),
                    new MathLargeOperator({ operator: "integral", children: [run("b")] }),
                ),
            );
        });

        it("takes built math and scripts on groups into what an operator applies to", () => {
            expect(read("\\sum \\frac{1}{n} {ab}^2 = 1")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "sum",
                        children: [
                            new MathFraction({ numerator: [run("1")], denominator: [run("n")] }),
                            new MathSuperScript({ children: [run("ab")], superScript: [run("2")] }),
                        ],
                    }),
                    run("=1"),
                ),
            );
        });

        it("applies an operator to nothing when a relation follows it", () => {
            expect(read("\\sum = 0")).toBe(written(new MathLargeOperator({ operator: "sum", children: [] }), run("=0")));
        });

        it("puts the limits where \\limits and \\nolimits say", () => {
            expect(read("\\int\\limits_a^b x")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "integral",
                        limits: "aboveBelow",
                        subScript: [run("a")],
                        superScript: [run("b")],
                        children: [run("x")],
                    }),
                ),
            );
            expect(read("\\sum\\nolimits_k x")).toBe(
                written(new MathLargeOperator({ operator: "sum", limits: "side", subScript: [run("k")], children: [run("x")] })),
            );
        });

        it.each([
            ["prod", "product"],
            ["coprod", "coproduct"],
            ["bigcup", "union"],
            ["bigcap", "intersection"],
            ["bigsqcup", "squareUnion"],
            ["biguplus", "multisetUnion"],
            ["bigvee", "logicalOr"],
            ["bigwedge", "logicalAnd"],
            ["bigoplus", "directSum"],
            ["bigotimes", "tensorProduct"],
            ["bigodot", "circledDot"],
            ["iint", "doubleIntegral"],
            ["iiint", "tripleIntegral"],
            ["iiiint", "quadrupleIntegral"],
            ["oint", "contourIntegral"],
            ["oiint", "surfaceIntegral"],
            ["oiiint", "volumeIntegral"],
        ] as const)("writes \\%s as the %s operator", (command, operator) => {
            expect(read(`\\${command} x`)).toBe(written(new MathLargeOperator({ operator, children: [run("x")] })));
        });
    });

    describe("functions", () => {
        it("writes a function's name upright, over what comes after it", () => {
            expect(read("\\sin x + 1")).toBe(written(fn("sin", run("x")), run("+1")));
            expect(read("\\cos(x+y) = 1")).toBe(written(fn("cos", run("(x+y)")), run("=1")));
            expect(read("\\ln -x")).toBe(written(fn("ln", run("−x"))));
        });

        it("ends what a function applies to at another function, unless that comes first", () => {
            expect(read("\\sin x \\cos y")).toBe(written(fn("sin", run("x")), fn("cos", run("y"))));
            expect(read("\\log\\log n")).toBe(written(fn("log", fn("log", run("n")))));
        });

        it("writes a function applied to nothing with a zero-width space", () => {
            expect(read("\\exp")).toBe(written(fn("exp", space())));
        });

        it("puts scripts on the name of a function whose limits don't go below it", () => {
            expect(read("\\sin^2 x")).toBe(
                written(
                    new MathFunction({
                        name: [new MathSuperScript({ children: [plain("sin")], superScript: [run("2")] })],
                        children: [run("x")],
                    }),
                ),
            );
            expect(read("\\log_2 n")).toBe(
                written(
                    new MathFunction({
                        name: [new MathSubScript({ children: [plain("log")], subScript: [run("2")] })],
                        children: [run("n")],
                    }),
                ),
            );
        });

        it("puts limits below lim and its like, and above for a superscript", () => {
            expect(read("\\lim_{x\\to0} f")).toBe(
                written(
                    new MathFunction({
                        name: [new MathLimitLower({ children: [plain("lim")], limit: [run("x→0")] })],
                        children: [run("f")],
                    }),
                ),
            );
            expect(read("\\max^{a} f")).toBe(
                written(
                    new MathFunction({ name: [new MathLimitUpper({ children: [plain("max")], limit: [run("a")] })], children: [run("f")] }),
                ),
            );
            expect(read("\\sup_a^b f")).toBe(
                written(
                    new MathFunction({
                        name: [
                            new MathLimitUpper({
                                children: [new MathLimitLower({ children: [plain("sup")], limit: [run("a")] })],
                                limit: [run("b")],
                            }),
                        ],
                        children: [run("f")],
                    }),
                ),
            );
            expect(read("\\liminf x")).toBe(written(fn("lim\u2009inf", run("x"))));
        });

        it("puts lim's limits to the side for \\nolimits, and a function's below for \\limits", () => {
            expect(read("\\lim\\nolimits_x f")).toBe(
                written(
                    new MathFunction({
                        name: [new MathSubScript({ children: [plain("lim")], subScript: [run("x")] })],
                        children: [run("f")],
                    }),
                ),
            );
            expect(read("\\sin\\limits_x f")).toBe(
                written(
                    new MathFunction({ name: [new MathLimitLower({ children: [plain("sin")], limit: [run("x")] })], children: [run("f")] }),
                ),
            );
        });

        it("writes \\operatorname as a function, with its limits below for \\operatorname*", () => {
            expect(read("\\operatorname{rank}(A)")).toBe(written(fn("rank", run("(A)"))));
            expect(read("\\operatorname*{arg\\,max}_x f")).toBe(
                written(
                    new MathFunction({
                        name: [new MathLimitLower({ children: [plain("arg\u2009max")], limit: [run("x")] })],
                        children: [run("f")],
                    }),
                ),
            );
        });

        it("writes the modulo commands", () => {
            expect(read("a \\bmod b")).toBe(written(run("a\u2004"), plain("mod"), run("\u2004b")));
            expect(read("a \\mod b")).toBe(written(run("a\u2003"), plain("mod"), run("\u2004b")));
            expect(read("a \\pmod{n}")).toBe(written(run("a\u2003("), plain("mod"), run("\u2004n)")));
            expect(read("a \\pod n")).toBe(written(run("a\u2003(n)")));
        });
    });

    describe("brackets", () => {
        it("writes \\left and \\right as brackets that grow", () => {
            expect(read("\\left( \\frac{a}{b} \\right)^2")).toBe(
                written(
                    new MathSuperScript({
                        children: [new MathBrackets({ children: [new MathFraction({ numerator: [run("a")], denominator: [run("b")] })] })],
                        superScript: [run("2")],
                    }),
                ),
            );
        });

        it("takes any delimiter, and a dot for none", () => {
            expect(read("\\left\\{ x \\right.")).toBe(written(new MathBrackets({ open: "{", close: "", children: [run("x")] })));
            expect(read("\\left. x \\right|")).toBe(written(new MathBrackets({ open: "", close: "|", children: [run("x")] })));
            expect(read("\\left\\| v \\right\\Vert")).toBe(written(new MathBrackets({ open: "‖", close: "‖", children: [run("v")] })));
            expect(read("\\left\\lvert x \\right\\rvert")).toBe(written(new MathBrackets({ open: "|", close: "|", children: [run("x")] })));
            expect(read("\\left< x \\right>")).toBe(written(new MathBrackets({ open: "⟨", close: "⟩", children: [run("x")] })));
            expect(read("\\left⌊ x \\right⌋")).toBe(written(new MathBrackets({ open: "⌊", close: "⌋", children: [run("x")] })));
            expect(read("\\left[ x \\right\\rbrack")).toBe(written(new MathBrackets({ open: "[", close: "]", children: [run("x")] })));
        });

        it("writes \\middle as the separator between items", () => {
            expect(read("\\left\\langle a \\middle| b \\middle| c \\right\\rangle")).toBe(
                written(new MathBrackets({ open: "⟨", close: "⟩", separator: "|", items: [[run("a")], [run("b")], [run("c")]] })),
            );
        });

        it("writes different \\middle delimiters as text, as Word has one separator for each pair of brackets", () => {
            expect(read("\\left( a \\middle| b \\middle/ c \\right)")).toBe(
                written(new MathBrackets({ children: [run("a"), run("|"), run("b"), run("/"), run("c")] })),
            );
        });

        it("writes \\big and its like as the delimiter, which doesn't grow", () => {
            expect(read("\\bigl( x \\bigr) \\Bigm| \\big. y")).toBe(written(run("(x)|y")));
            expect(read("\\sin \\Big( x + y \\bigg) z")).toBe(written(fn("sin", run("(x+y)z"))));
        });

        it("throws for \\left with no \\right, and for \\right or \\middle with no \\left", () => {
            expect(() => latexToMath("\\left( x")).toThrow("latexToMath: \\left has no \\right, at character 1");
            expect(() => latexToMath("x \\right)")).toThrow("\\right has no \\left before it");
            expect(() => latexToMath("x \\middle|")).toThrow("\\middle has no \\left before it");
            expect(() => latexToMath("{\\left( x }")).toThrow("a } has no { before it");
        });

        it("throws for a delimiter it doesn't know, or none", () => {
            expect(() => latexToMath("\\left x \\right)")).toThrow("\\left can't take \"x\", which isn't a delimiter");
            expect(() => latexToMath("\\left\\alpha x \\right)")).toThrow("\\left can't take \\alpha, which isn't a delimiter");
            expect(() => latexToMath("\\left")).toThrow("\\left needs a delimiter after it");
        });
    });

    describe("accents, bars, braces, boxes and phantoms", () => {
        it.each([
            ["hat", "hat"],
            ["widehat", "hat"],
            ["check", "check"],
            ["widecheck", "check"],
            ["tilde", "tilde"],
            ["widetilde", "tilde"],
            ["acute", "acute"],
            ["grave", "grave"],
            ["dot", "dot"],
            ["ddot", "doubleDot"],
            ["dddot", "tripleDot"],
            ["breve", "breve"],
            ["bar", "bar"],
            ["mathring", "ring"],
            ["vec", "rightArrow"],
            ["overrightarrow", "rightArrow"],
            ["overleftarrow", "leftArrow"],
            ["overleftrightarrow", "leftRightArrow"],
            ["overrightharpoon", "rightHarpoon"],
            ["overleftharpoon", "leftHarpoon"],
        ] as const)("writes \\%s as the %s accent", (command, accent) => {
            expect(read(`\\${command}{x}`)).toBe(written(new MathAccent({ accent, children: [run("x")] })));
        });

        it("writes \\overline and \\underline as bars", () => {
            expect(read("\\overline{AB} \\underline x")).toBe(
                written(new MathBar({ children: [run("AB")] }), new MathBar({ position: "below", children: [run("x")] })),
            );
        });

        it("writes braces, with the script on their other side as their label", () => {
            expect(read("\\overbrace{a+b}^{n}")).toBe(written(new MathBrace({ children: [run("a+b")], label: [run("n")] })));
            expect(read("\\underbrace{a+b}_n")).toBe(
                written(new MathBrace({ position: "below", children: [run("a+b")], label: [run("n")] })),
            );
            expect(read("\\overbracket{a} \\underparen{b}")).toBe(
                written(
                    new MathBrace({ brace: "square", children: [run("a")] }),
                    new MathBrace({ brace: "round", position: "below", children: [run("b")] }),
                ),
            );
        });

        it("writes a script on the brace's own side as a script", () => {
            expect(read("\\underbrace{a}^2")).toBe(
                written(
                    new MathSuperScript({
                        children: [new MathBrace({ position: "below", children: [run("a")] })],
                        superScript: [run("2")],
                    }),
                ),
            );
        });

        it("writes \\overset, \\underset and \\stackrel as limits", () => {
            expect(read("\\overset{!}{=}")).toBe(written(new MathLimitUpper({ children: [run("=")], limit: [run("!")] })));
            expect(read("\\stackrel{def}{=}")).toBe(written(new MathLimitUpper({ children: [run("=")], limit: [run("def")] })));
            expect(read("\\underset{x}{ab}")).toBe(written(new MathLimitLower({ children: [run("ab")], limit: [run("x")] })));
        });

        it("ends what an operator applies to at a relation written with \\overset or \\stackrel", () => {
            const sum = new MathLargeOperator({ operator: "sum", children: [run("a")] });
            expect(read("\\sum a \\stackrel{?}{x} b")).toBe(
                written(sum, new MathLimitUpper({ children: [run("x")], limit: [run("?")] }), run("b")),
            );
            expect(read("\\sum a \\overset{!}{=} b")).toBe(
                written(sum, new MathLimitUpper({ children: [run("=")], limit: [run("!")] }), run("b")),
            );
        });

        it("writes arrows with text above and below them", () => {
            const arrow = new MathLimitUpper({ children: [run("→")], limit: [run("f")] });
            expect(read("\\xrightarrow{f}")).toBe(written(arrow));
            expect(read("\\xrightarrow[g]{f}")).toBe(written(new MathLimitLower({ children: [arrow], limit: [run("g")] })));
            expect(read("\\xleftarrow{}")).toBe(written(new MathLimitUpper({ children: [run("←")], limit: [space()] })));
        });

        it("writes boxes and cancelled terms", () => {
            expect(read("\\boxed{x}")).toBe(written(new MathBox({ children: [run("x")] })));
            expect(read("\\fbox{if}")).toBe(written(new MathBox({ children: [words("if")] })));
            expect(read("\\cancel{x}\\bcancel{y}\\xcancel{z}")).toBe(
                written(
                    new MathBox({ borders: [], strikes: ["diagonalUp"], children: [run("x")] }),
                    new MathBox({ borders: [], strikes: ["diagonalDown"], children: [run("y")] }),
                    new MathBox({ borders: [], strikes: ["diagonalUp", "diagonalDown"], children: [run("z")] }),
                ),
            );
        });

        it("writes phantoms", () => {
            expect(read("\\phantom{x}")).toBe(written(new MathPhantom({ children: [run("x")] })));
            expect(read("\\hphantom{x}")).toBe(written(new MathPhantom({ height: false, depth: false, children: [run("x")] })));
            expect(read("\\vphantom{x}")).toBe(written(new MathPhantom({ width: false, children: [run("x")] })));
            expect(read("\\smash{x}")).toBe(written(new MathPhantom({ visible: true, height: false, depth: false, children: [run("x")] })));
            expect(read("\\smash[t]{x}")).toBe(
                written(new MathPhantom({ visible: true, height: false, depth: true, children: [run("x")] })),
            );
            expect(read("\\smash[b]{x}")).toBe(
                written(new MathPhantom({ visible: true, height: true, depth: false, children: [run("x")] })),
            );
            expect(read("\\mathstrut")).toBe(written(new MathPhantom({ width: false, children: [run("(")] })));
        });
    });

    describe("fonts and text", () => {
        it.each([
            ["mathrm", { style: "plain" }],
            ["mathup", { style: "plain" }],
            ["mathit", { style: "italic" }],
            ["mathbf", { style: "bold" }],
            ["bold", { style: "bold" }],
            ["boldsymbol", { style: "boldItalic" }],
            ["bm", { style: "boldItalic" }],
            ["pmb", { style: "boldItalic" }],
            ["mathbb", { script: "doubleStruck", style: "plain" }],
            ["Bbb", { script: "doubleStruck", style: "plain" }],
            ["mathcal", { script: "script", style: "plain" }],
            ["mathscr", { script: "script", style: "plain" }],
            ["mathfrak", { script: "fraktur", style: "plain" }],
            ["mathsf", { script: "sansSerif", style: "plain" }],
            ["mathtt", { script: "monospace", style: "plain" }],
        ] as const)("writes \\%s as a run in its font", (command, font) => {
            expect(read(`\\${command}{R}`)).toBe(written(run("R", font)));
        });

        it("combines fonts, the inner one taking the place of the outer where they differ", () => {
            expect(read("\\mathbf{\\mathbb{R}}")).toBe(written(run("R", { script: "doubleStruck", style: "bold" })));
            expect(read("\\boldsymbol{\\mathcal{A}}")).toBe(written(run("A", { script: "script", style: "bold" })));
            expect(read("\\mathcal{\\mathbf{A}}")).toBe(written(run("A", { script: "script", style: "bold" })));
            expect(read("\\mathbb{\\mathrm{R}} \\mathbf{\\mathnormal{x}}")).toBe(written(plain("R"), run("x")));
        });

        it("changes the font for the rest of a group with \\bf and its like", () => {
            expect(read("{a \\bf b} c")).toBe(written(run("a"), run("b", { style: "bold" }), run("c")));
            expect(read("\\rm a \\it b \\sf c \\tt d \\cal e")).toBe(
                written(
                    plain("a"),
                    run("b", { style: "italic" }),
                    run("c", { script: "sansSerif", style: "plain" }),
                    run("d", { script: "monospace", style: "plain" }),
                    run("e", { script: "script", style: "plain" }),
                ),
            );
        });

        it("writes \\text and its like as normal text, keeping its spaces", () => {
            expect(read("x \\text{ if } y")).toBe(written(run("x"), words(" if "), run("y")));
            for (const command of [
                "textrm",
                "textnormal",
                "textup",
                "textmd",
                "textbf",
                "textit",
                "textsl",
                "textsf",
                "texttt",
                "emph",
                "mbox",
                "hbox",
            ]) {
                expect(read(`\\${command}{a b}`), command).toBe(written(words("a b")));
            }
        });

        it("writes text's spaces as one, and its escaped characters and dashes", () => {
            expect(read("\\text{a  \n b \\& c \\% \\$ \\# \\_ \\{ \\} \\textbackslash \\ldots}")).toBe(
                written(words("a b & c % $ # _ { } \\…")),
            );
            expect(read("\\text{1--2---3 ``q'' `s' a~b}")).toBe(written(words("1–2—3 “q” ‘s’ a\u00A0b")));
            expect(read("\\text{a\\quad b\\,c\\ d}")).toBe(written(words("a\u2003b\u2009c d")));
            expect(read("\\text{\\dots\\textellipsis}")).toBe(written(words("……")));
        });

        it("reads text in text commands, and braces in text", () => {
            expect(read("\\text{a \\textbf{b} {c}}")).toBe(written(words("a b c")));
        });

        it("reads math between dollar signs in text", () => {
            expect(read("\\text{if $x^2 > 0$ then}")).toBe(
                written(words("if "), new MathSuperScript({ children: [run("x")], superScript: [run("2")] }), run(">0"), words(" then")),
            );
        });

        it("reads text of one character with no braces", () => {
            expect(read("\\text a")).toBe(written(words("a")));
        });

        it("throws for text it can't read", () => {
            expect(() => latexToMath("\\text{\\alpha}")).toThrow("unknown command \\alpha in text");
            expect(() => latexToMath("\\text{a")).toThrow("\\text's argument has no closing }");
            expect(() => latexToMath("\\text")).toThrow("\\text needs an argument");
            expect(() => latexToMath("\\text\\alpha")).toThrow("\\text needs an argument");
            expect(() => latexToMath("\\text{$x}")).toThrow("a } has no { before it");
            expect(() => latexToMath("\\text{$x")).toThrow("math in text has no closing $");
        });

        it("leaves out colours, which Word's math has none of", () => {
            expect(read("\\color{red} x \\textcolor{blue}{y}")).toBe(written(run("xy")));
        });

        it("writes \\mathop and its like as their argument", () => {
            expect(read("\\mathop{a}\\mathbin{b}\\mathrel{c}\\mathord{d}\\mathopen{e}\\mathclose{f}\\mathpunct{g}\\mathinner{h}")).toBe(
                written(run("abcdefgh")),
            );
        });

        it("leaves out sizes, labels, lines between rows and other commands Word has no use for", () => {
            expect(
                read(
                    "\\displaystyle a \\textstyle \\scriptstyle \\scriptscriptstyle b \\label{eq} \\nonumber \\notag \\allowbreak \\nobreak \\limits c\\/",
                ),
            ).toBe(written(run("abc")));
        });

        it("writes \\hspace as a wide space", () => {
            expect(read("a\\hspace{1em}b\\hspace*{2cm}c")).toBe(written(run("a\u2003b\u2003c")));
        });
    });

    describe("environments", () => {
        const cells = (...rows: readonly (readonly string[])[]): readonly (readonly (readonly MathComponent[])[])[] =>
            rows.map((row) => row.map((text) => [run(text)]));

        it.each([
            ["matrix", "none"],
            ["smallmatrix", "none"],
            ["pmatrix", "round"],
            ["bmatrix", "square"],
            ["Bmatrix", "curly"],
            ["vmatrix", "verticalBars"],
            ["Vmatrix", "doubleVerticalBars"],
        ] as const)("writes %s as a matrix in %s brackets", (environment, brackets) => {
            expect(read(`\\begin{${environment}} 1 & 2 \\\\ 3 & 4 \\end{${environment}}`)).toBe(
                written(new MathMatrix({ brackets, rows: cells(["1", "2"], ["3", "4"]) })),
            );
        });

        it("gives short rows empty cells, and starts no row at a \\\\ at the end", () => {
            expect(read("\\begin{matrix} a & b \\\\ c \\\\ \\end{matrix}")).toBe(
                written(new MathMatrix({ rows: cells(["a", "b"], ["c"]) })),
            );
        });

        it("skips a \\\\'s space, and lines between rows", () => {
            expect(read("\\begin{matrix} a \\\\[2pt] \\hline b \\end{matrix}")).toBe(
                written(new MathMatrix({ rows: cells(["a"], ["b"]) })),
            );
        });

        it("lines up the columns of mathtools' starred matrices", () => {
            expect(read("\\begin{pmatrix*}[r] 1 & 20 \\end{pmatrix*}")).toBe(
                written(new MathMatrix({ brackets: "round", columnAlignment: "right", rows: cells(["1", "20"]) })),
            );
            expect(read("\\begin{bmatrix*} 1 \\end{bmatrix*}")).toBe(written(new MathMatrix({ brackets: "square", rows: cells(["1"]) })));
            expect(() => latexToMath("\\begin{pmatrix*}[x] 1 \\end{pmatrix*}")).toThrow('\\begin{pmatrix*} can\'t line its columns up "x"');
        });

        it("writes an array as a matrix with its columns lined up, leaving out lines and spacing", () => {
            expect(read("\\left( \\begin{array}{l|c@{\\,}rp{2cm}} a & b & c & d \\\\ e \\end{array} \\right)")).toBe(
                written(
                    new MathBrackets({
                        children: [
                            new MathMatrix({
                                columnAlignment: ["left", "center", "right", "left"],
                                rows: cells(["a", "b", "c", "d"], ["e"]),
                            }),
                        ],
                    }),
                ),
            );
            expect(read("\\begin{array}[t]{c} a & b \\end{array}")).toBe(
                written(new MathMatrix({ columnAlignment: ["center", "center"], rows: cells(["a", "b"]) })),
            );
            expect(read("\\begin{subarray}{l} a \\\\ b \\end{subarray}")).toBe(
                written(new MathMatrix({ columnAlignment: ["left"], rows: cells(["a"], ["b"]) })),
            );
        });

        it("writes \\substack as one centred column", () => {
            expect(read("\\sum_{\\substack{i<n \\\\ j<m}} a")).toBe(
                written(
                    new MathLargeOperator({
                        operator: "sum",
                        subScript: [new MathMatrix({ rows: cells(["i<n"], ["j<m"]) })],
                        children: [run("a")],
                    }),
                ),
            );
            expect(() => latexToMath("\\substack x")).toThrow("\\substack needs an argument in braces");
            expect(() => latexToMath("\\substack{a")).toThrow("\\substack's argument has no closing }");
        });

        it("writes cases, with or without conditions", () => {
            for (const environment of ["cases", "dcases", "cases*"]) {
                expect(read(`\\begin{${environment}} x & \\text{if } x \\ge 0 \\\\ 0 \\end{${environment}}`), environment).toBe(
                    written(
                        new MathCases({ cases: [{ value: [run("x")], condition: [words("if "), run("x≥0")] }, { value: [run("0")] }] }),
                    ),
                );
            }
        });

        it("throws for a case of more than two parts", () => {
            expect(() => latexToMath("\\begin{cases} a & b & c \\end{cases}")).toThrow(
                "case 1 of \\begin{cases} has 3 parts, but a case has at most two: its value & its condition",
            );
        });

        it("writes rcases with the brace on the right", () => {
            expect(read("\\begin{rcases} a \\\\ b \\end{rcases}")).toBe(
                written(
                    new MathBrackets({
                        open: "",
                        close: "}",
                        children: [new MathMatrix({ columnAlignment: "left", rows: cells(["a"], ["b"]) })],
                    }),
                ),
            );
        });

        it("writes aligned equations, each row lined up at its &s, with the number \\tag gives it", () => {
            expect(read("\\begin{align} y &= mx + b \\tag{1} \\\\ y' &= m \\tag*{(*)} \\\\ z &= 0 \\end{align}")).toBe(
                written(
                    new MathEquationArray({
                        rows: [
                            { parts: [[run("y")], [run("=mx+b")]], equationNumber: "(1)" },
                            {
                                parts: [[new MathSuperScript({ children: [run("y")], superScript: [run("′")] })], [run("=m")]],
                                equationNumber: "(*)",
                            },
                            { parts: [[run("z")], [run("=0")]] },
                        ],
                    }),
                ),
            );
        });

        it("reads every environment of aligned equations", () => {
            const array = written(new MathEquationArray({ rows: [{ parts: [[run("a")], [run("=b")]] }, { parts: [[], [run("=c")]] }] }));
            for (const environment of ["aligned", "align*", "flalign", "eqnarray", "split", "gather", "gathered", "multline"]) {
                expect(read(`\\begin{${environment}} a &= b \\\\ &= c \\end{${environment}}`), environment).toBe(array);
            }
            expect(read("\\begin{alignat}{2} a &= b \\\\ &= c \\end{alignat}")).toBe(array);
            expect(read("\\begin{alignedat}{2} a &= b \\\\ &= c \\end{alignedat}")).toBe(array);
        });

        it("writes an equation as its math, or as a numbered row when it has a \\tag", () => {
            expect(read("\\begin{equation} E = mc \\end{equation}")).toBe(written(run("E=mc")));
            expect(read("\\begin{equation*} x \\end{equation*}")).toBe(written(run("x")));
            expect(read("\\begin{equation} E = mc \\tag{2} \\label{energy} \\end{equation}")).toBe(
                written(new MathEquationArray({ rows: [{ parts: [[run("E=mc")]], equationNumber: "(2)" }] })),
            );
            expect(read("\\begin{displaymath} a \\\\ b \\end{displaymath}")).toBe(
                written(new MathEquationArray({ rows: [{ parts: [[run("a")]] }, { parts: [[run("b")]] }] })),
            );
        });

        it("leaves out a \\tag inside braces, which has no row to number", () => {
            expect(read("{a \\tag{1}}")).toBe(written(run("a")));
        });

        it("leaves dollar signs out of a \\tag", () => {
            expect(read("a \\tag{$\\ast$}")).toBe(
                written(new MathEquationArray({ rows: [{ parts: [[run("a")]], equationNumber: "(\\ast)" }] })),
            );
        });

        it("throws for an environment it doesn't know, or one that doesn't end", () => {
            expect(() => latexToMath("\\begin{tabular} a \\end{tabular}")).toThrow("unknown environment tabular");
            expect(() => latexToMath("\\begin{matrix} a")).toThrow("latexToMath: \\begin{matrix} has no \\end{matrix}, at character 1");
            expect(() => latexToMath("\\begin{matrix} a \\end{pmatrix}")).toThrow("\\begin{matrix} ends with \\end{pmatrix}");
            expect(() => latexToMath("\\begin{matrix} a }")).toThrow("a } has no { before it");
            expect(() => latexToMath("\\begin matrix")).toThrow("\\begin needs an argument in braces");
            expect(() => latexToMath("\\begin{matrix")).toThrow("\\begin's argument has no closing }");
            expect(() => latexToMath("a \\end{matrix}")).toThrow("\\end has no \\begin before it");
            expect(() => latexToMath("\\smash[t")).toThrow("a [ has no closing ]");
        });
    });

    describe("the whole equation", () => {
        it("leaves out the delimiters math comes in", () => {
            const math = written(run("x+1"));
            for (const latex of ["$x+1$", "$$x+1$$", "\\(x+1\\)", "\\[x+1\\]", "  $ x+1 $\n", "x+1"]) {
                expect(read(latex), latex).toBe(math);
            }
        });

        it("writes rows and parts outside an environment as aligned equations, as MathJax does", () => {
            expect(read("a &= b \\\\ &= c")).toBe(
                written(new MathEquationArray({ rows: [{ parts: [[run("a")], [run("=b")]] }, { parts: [[], [run("=c")]] }] })),
            );
            expect(read("E = mc^2 \\tag{3}")).toBe(
                written(
                    new MathEquationArray({
                        rows: [
                            {
                                parts: [[run("E=m"), new MathSuperScript({ children: [run("c")], superScript: [run("2")] })]],
                                equationNumber: "(3)",
                            },
                        ],
                    }),
                ),
            );
        });

        it("writes nothing for no math", () => {
            expect(latexToMath("")).toEqual([]);
            expect(latexToMath("$$")).toEqual([]);
        });
    });

    describe("errors", () => {
        it("throws for the names of JavaScript's own object properties, which aren't commands", () => {
            for (const name of ["constructor", "toString", "hasOwnProperty", "valueOf"]) {
                expect(() => latexToMath(`\\${name}`), name).toThrow(`unknown command \\${name}`);
            }
            expect(() => latexToMath("\\begin{pmatrix*}[constructor] 1 \\end{pmatrix*}")).toThrow("can't line its columns up");
            expect(() => latexToMath("\\begin{constructor} 1 \\end{constructor}")).toThrow("unknown environment constructor");
        });

        it("throws for a command it doesn't know, saying where it is", () => {
            expect(() => latexToMath("\\frac{a}{\\foo}")).toThrow(
                'latexToMath: unknown command \\foo, at character 10 of "\\frac{a}{\\foo}"',
            );
        });

        it("shows the LaTeX around where it went wrong, when there is a lot of it", () => {
            const latex = `${"a+".repeat(30)}\\foo${"+b".repeat(30)}`;
            expect(() => latexToMath(latex)).toThrow(
                `unknown command \\foo, at character 61 of "…${"a+".repeat(15)}\\foo${"+b".repeat(13)}…"`,
            );
        });

        it("throws for braces that don't match", () => {
            expect(() => latexToMath("{a")).toThrow("latexToMath: a { has no closing }, at character 1");
            expect(() => latexToMath("a}")).toThrow("a } has no { before it");
            expect(() => latexToMath("\\frac{a")).toThrow("\\frac's argument has no closing }");
        });

        it("throws for a missing argument", () => {
            expect(() => latexToMath("\\frac{a}")).toThrow("\\frac needs an argument");
            expect(() => latexToMath("\\sqrt")).toThrow("\\sqrt needs an argument");
            expect(() => latexToMath("\\hat}")).toThrow("\\hat needs an argument");
        });

        it("throws for & and \\\\ where there are no rows or cells", () => {
            expect(() => latexToMath("{a & b}")).toThrow(
                "an & can only go between the rows and cells of a matrix or of aligned equations, not inside braces, brackets or \\left and \\right",
            );
            expect(() => latexToMath("\\left( a \\\\ b \\right)")).toThrow("a \\\\ can only go between the rows and cells");
            expect(() => latexToMath("\\frac{a \\\\ b}{c}")).toThrow("a \\\\ can only go between the rows and cells");
        });

        it("throws for a dollar sign inside math, and a backslash at the end", () => {
            expect(() => latexToMath("$a$ and $b$")).toThrow("a $ can only end math that is in \\text");
            expect(() => latexToMath("a\\")).toThrow("a backslash ends the LaTeX, with no command after it");
        });

        it("throws for \\not before something that can't be struck through", () => {
            expect(() => latexToMath("\\not")).toThrow("\\not needs a symbol after it");
            expect(() => latexToMath("\\not{=}")).toThrow("\\not needs a symbol after it");
            expect(() => latexToMath("\\not\\frac")).toThrow("\\not needs a symbol after it");
        });
    });
});
