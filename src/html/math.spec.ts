import type { Element } from "domhandler";
import { parse } from "parse5";
import { adapter } from "parse5-htmlparser2-tree-adapter";
import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { stringifyXmlable } from "@util/xml";
import {
    Math,
    type MathComponent,
    MathFraction,
    MathLimitLower,
    MathLimitUpper,
    MathRadical,
    MathRun,
    MathSubScript,
    MathSubSuperScript,
    MathSuperScript,
} from "docx";
import { MathAccent, MathBar, MathBrackets, MathLargeOperator, MathMatrix, MathPhantom } from "docx/math";

import { editorLatexOf, isMathRendering, mathMlOf, mathOf } from "./math";

/** The first element with a name in parsed HTML */
const elementIn = (html: string, name: string): Element => {
    const document = parse(html, { treeAdapter: adapter }) as unknown as Element;
    const find = (node: Element): Element | undefined =>
        node.name === name
            ? node
            : node.children
                  ?.flatMap((child) => (child.type === "tag" || child.type === "script" ? [child as Element] : []))
                  .map(find)
                  .find(Boolean);
    return find(document)!;
};

const written = (...children: readonly MathComponent[]): string => stringifyXmlable(new Formatter().format(new Math({ children })));
const read = (mathMl: string): string => written(...mathOf(elementIn(`<math>${mathMl}</math>`, "math")));
const run = (text: string, options: Omit<ConstructorParameters<typeof MathRun>[0] & object, "text"> = {}): MathRun =>
    new MathRun({ text, ...options });

describe("math", () => {
    describe("MathML", () => {
        it("writes tokens as runs: numbers, identifiers and operators as math, and text as ordinary text", () => {
            expect(read("<mn>2</mn><mo>+</mo><mi>x</mi><mtext>if so</mtext><ms>s</ms>")).toBe(
                written(run("2"), run("+"), run("x"), run("if so", { normalText: true }), run('"s"', { normalText: true })),
            );
        });

        it("writes an identifier of more than one letter, such as sin, upright", () => {
            expect(read("<mi>sin</mi><mi>θ</mi>")).toBe(written(run("sin", { style: "plain" }), run("θ")));
        });

        it("writes mathvariant's styles and alphabets", () => {
            expect(
                read(
                    '<mi mathvariant="normal">a</mi><mi mathvariant="bold">b</mi><mi mathvariant="italic">c</mi><mi mathvariant="bold-italic">d</mi><mi mathvariant="double-struck">R</mi><mi mathvariant="fraktur">g</mi><mi mathvariant="bold-fraktur">h</mi><mi mathvariant="script">L</mi><mi mathvariant="bold-script">M</mi><mi mathvariant="sans-serif">s</mi><mi mathvariant="bold-sans-serif">t</mi><mi mathvariant="monospace">m</mi>',
                ),
            ).toBe(
                written(
                    run("a", { style: "plain" }),
                    run("b", { style: "bold" }),
                    run("c", { style: "italic" }),
                    run("d", { style: "boldItalic" }),
                    run("R", { script: "doubleStruck" }),
                    run("g", { script: "fraktur" }),
                    run("h", { script: "fraktur", style: "bold" }),
                    run("L", { script: "script" }),
                    run("M", { script: "script", style: "bold" }),
                    run("s", { script: "sansSerif" }),
                    run("t", { script: "sansSerif", style: "bold" }),
                    run("m", { script: "monospace" }),
                ),
            );
        });

        it("leaves out empty tokens, annotations and <none>", () => {
            expect(read('<mi> </mi><annotation encoding="text/plain">x</annotation><annotation-xml>y</annotation-xml><mn>1</mn>')).toBe(
                written(run("1")),
            );
        });

        it("writes a space", () => {
            expect(read('<mi>a</mi><mspace width="1em"/><mi>b</mi>')).toBe(written(run("a"), run(" ", { normalText: true }), run("b")));
        });

        it("writes fractions, and those with no bar", () => {
            expect(
                read(
                    '<mfrac><mi>a</mi><mi>b</mi></mfrac><mfrac linethickness="0"><mi>n</mi><mi>k</mi></mfrac><mfrac linethickness="0px"><mi>p</mi><mi>q</mi></mfrac>',
                ),
            ).toBe(
                written(
                    new MathFraction({ numerator: [run("a")], denominator: [run("b")] }),
                    new MathFraction({ numerator: [run("n")], denominator: [run("k")], type: "noBar" }),
                    new MathFraction({ numerator: [run("p")], denominator: [run("q")], type: "noBar" }),
                ),
            );
        });

        it("writes a fraction that is missing its parts with empty ones", () => {
            expect(read("<mfrac><mi>a</mi></mfrac>")).toBe(written(new MathFraction({ numerator: [run("a")], denominator: [] })));
        });

        it("writes square roots and roots of a degree", () => {
            expect(read("<msqrt><mi>x</mi><mo>+</mo><mn>1</mn></msqrt><mroot><mi>y</mi><mn>3</mn></mroot>")).toBe(
                written(
                    new MathRadical({ children: [run("x"), run("+"), run("1")] }),
                    new MathRadical({ children: [run("y")], degree: [run("3")] }),
                ),
            );
        });

        it("writes superscripts, subscripts and both", () => {
            expect(
                read("<msup><mi>x</mi><mn>2</mn></msup><msub><mi>a</mi><mi>i</mi></msub><msubsup><mi>b</mi><mn>0</mn><mn>1</mn></msubsup>"),
            ).toBe(
                written(
                    new MathSuperScript({ children: [run("x")], superScript: [run("2")] }),
                    new MathSubScript({ children: [run("a")], subScript: [run("i")] }),
                    new MathSubSuperScript({ children: [run("b")], subScript: [run("0")], superScript: [run("1")] }),
                ),
            );
        });

        it("writes the scripts after the base of <mmultiscripts>", () => {
            expect(read("<mmultiscripts><mi>F</mi><mi>a</mi><mi>b</mi><mprescripts/><mi>c</mi><mi>d</mi></mmultiscripts>")).toBe(
                written(new MathSubSuperScript({ children: [run("F")], subScript: [run("a")], superScript: [run("b")] })),
            );
        });

        it("writes large operators with limits", () => {
            expect(
                read(
                    "<munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mi>i</mi><munder><mo>⋃</mo><mi>k</mi></munder><mover><mo>∫</mo><mn>1</mn></mover>",
                ),
            ).toBe(
                written(
                    new MathLargeOperator({
                        operator: "sum",
                        children: [],
                        subScript: [run("i"), run("="), run("1")],
                        superScript: [run("n")],
                    }),
                    run("i"),
                    new MathLargeOperator({ operator: "union", children: [], subScript: [run("k")], superScript: [] }),
                    new MathLargeOperator({ operator: "integral", children: [], subScript: [], superScript: [run("1")] }),
                ),
            );
        });

        it("writes accents over a base, in their spacing and combining forms", () => {
            expect(
                read(
                    "<mover><mi>a</mi><mo>^</mo></mover><mover><mi>v</mi><mo>→</mo></mover><mover><mi>x</mi><mo>̇</mo></mover><mover><mi>y</mi><mo>~</mo></mover>",
                ),
            ).toBe(
                written(
                    new MathAccent({ accent: "hat", children: [run("a")] }),
                    new MathAccent({ accent: "rightArrow", children: [run("v")] }),
                    new MathAccent({ accent: "dot", children: [run("x")] }),
                    new MathAccent({ accent: "tilde", children: [run("y")] }),
                ),
            );
        });

        it("writes bars over and under a base", () => {
            expect(read("<mover><mi>z</mi><mo>¯</mo></mover><munder><mi>w</mi><mo>_</mo></munder>")).toBe(
                written(new MathBar({ position: "above", children: [run("z")] }), new MathBar({ position: "below", children: [run("w")] })),
            );
        });

        it("writes other limits under and over a base", () => {
            expect(
                read(
                    "<munder><mi>lim</mi><mrow><mi>x</mi><mo>→</mo><mn>0</mn></mrow></munder><mover><mi>a</mi><mi>b</mi></mover><munderover><mi>c</mi><mi>d</mi><mi>e</mi></munderover>",
                ),
            ).toBe(
                written(
                    new MathLimitLower({ children: [run("lim", { style: "plain" })], limit: [run("x"), run("→"), run("0")] }),
                    new MathLimitUpper({ children: [run("a")], limit: [run("b")] }),
                    new MathLimitUpper({ children: [new MathLimitLower({ children: [run("c")], limit: [run("d")] })], limit: [run("e")] }),
                ),
            );
        });

        it("writes a row between brackets as brackets around the rest", () => {
            expect(
                read(
                    "<mrow><mo>(</mo><mi>a</mi><mo>+</mo><mi>b</mi><mo>)</mo></mrow><mrow><mo>|</mo><mi>x</mi><mo>|</mo></mrow><mrow><mo>(</mo><mi>c</mi><mo>]</mo></mrow>",
                ),
            ).toBe(
                written(
                    new MathBrackets({ open: "(", close: ")", children: [run("a"), run("+"), run("b")] }),
                    new MathBrackets({ open: "|", close: "|", children: [run("x")] }),
                    run("("),
                    run("c"),
                    run("]"),
                ),
            );
        });

        it("writes <mfenced> as brackets with separators", () => {
            expect(
                read(
                    '<mfenced><mi>a</mi><mi>b</mi></mfenced><mfenced open="[" close="]" separators=";"><mi>c</mi><mi>d</mi></mfenced><mfenced separators=""><mi>e</mi><mi>f</mi></mfenced>',
                ),
            ).toBe(
                written(
                    new MathBrackets({ open: "(", close: ")", children: [run("a"), run(","), run("b")] }),
                    new MathBrackets({ open: "[", close: "]", children: [run("c"), run(";"), run("d")] }),
                    new MathBrackets({ open: "(", close: ")", children: [run("e"), run("f")] }),
                ),
            );
        });

        it("writes tables as matrices, leaving out labels' cells", () => {
            expect(
                read(
                    "<mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>0</mn></mtd></mtr><mlabeledtr><mtd><mtext>(1)</mtext></mtd><mtd><mn>0</mn></mtd><mtd><mn>1</mn></mtd></mlabeledtr><mi>x</mi></mtable>",
                ),
            ).toBe(
                written(
                    new MathMatrix({
                        rows: [
                            [[run("1")], [run("0")]],
                            [[run("0")], [run("1")]],
                        ],
                    }),
                ),
            );
        });

        it("writes phantoms", () => {
            expect(read("<mphantom><mi>x</mi></mphantom>")).toBe(written(new MathPhantom({ children: [run("x")] })));
        });

        it("writes the content of elements that only group or style it, and of those it doesn't know", () => {
            expect(read("<mstyle><mpadded><menclose><merror><unknown><mi>x</mi></unknown></merror></menclose></mpadded></mstyle>")).toBe(
                written(run("x")),
            );
        });

        it("reads a <semantics>' first element", () => {
            expect(read("<semantics><mi>x</mi><annotation>y</annotation></semantics>")).toBe(written(run("x")));
            expect(read("<semantics></semantics>")).toBe(written());
        });

        it("reads mathMlOf's elements", () => {
            expect(written(...mathMlOf(elementIn("<math><mi>z</mi></math>", "mi")))).toBe(written(run("z")));
        });
    });

    describe("LaTeX in MathML", () => {
        it("reads the LaTeX of an annotation of any of its encodings' names", () => {
            for (const encoding of ["application/x-tex", "TeX", "LaTeX", "application/x-latex"]) {
                expect(read(`<semantics><mi>wrong</mi><annotation encoding="${encoding}">\\alpha</annotation></semantics>`)).toBe(
                    written(run("α")),
                );
            }
        });

        it("doesn't read an annotation of another encoding as LaTeX", () => {
            expect(read('<semantics><mi>y</mi><annotation encoding="text/plain">\\alpha</annotation></semantics>')).toBe(written(run("y")));
        });

        it("reads the MathML of an empty <math>", () => {
            expect(written(...mathOf(elementIn("<math></math>", "math")))).toBe(written());
        });
    });

    describe("editors' math", () => {
        it("reads the LaTeX editors keep", () => {
            expect(editorLatexOf(elementIn('<span data-latex="a"></span>', "span"))).toBe("a");
            expect(editorLatexOf(elementIn('<span class="x ql-formula" data-value="b"></span>', "span"))).toBe("b");
            expect(editorLatexOf(elementIn('<span class="math-tex">c</span>', "span"))).toBe("c");
            expect(editorLatexOf(elementIn('<script type="math/tex; mode=display">d</script>', "script"))).toBe("d");
        });

        it("doesn't read other elements as math", () => {
            expect(editorLatexOf(elementIn('<span class="ql-formula"></span>', "span"))).toBeUndefined();
            expect(editorLatexOf(elementIn("<span>e</span>", "span"))).toBeUndefined();
            expect(editorLatexOf(elementIn('<script type="text/javascript">f</script>', "script"))).toBeUndefined();
            expect(editorLatexOf(elementIn("<script>g</script>", "script"))).toBeUndefined();
        });

        it("knows KaTeX's HTML, which shows the math it has as MathML", () => {
            expect(isMathRendering(elementIn('<span class="katex-html"></span>', "span"))).toBe(true);
            expect(isMathRendering(elementIn('<span class="katex"></span>', "span"))).toBe(false);
        });
    });
});
