import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import { Math, type MathComponent, MathFraction, MathIntegral, MathRun, MathSum, MathSuperScript } from "docx";

import { latexToMath } from "./latex-to-math";
import { MathAccent } from "./math-accent";
import { MathBar } from "./math-bar";
import { MathBox } from "./math-box";
import { MathBrace } from "./math-brace";
import { MathBrackets } from "./math-brackets";
import { MathCases } from "./math-cases";
import { MathEquationArray } from "./math-equation-array";
import { MathLargeOperator } from "./math-large-operator";
import { MathMatrix, type MathMatrixBrackets } from "./math-matrix";
import { MathPhantom } from "./math-phantom";
// @ts-expect-error -- Vite reads the schema as text, which TypeScript has no type for
import mathSchema from "../../ooxml-schemas/ISO-IEC29500-4_2016/shared-math.xsd?raw";

// The math schema, which docx/math's elements are checked against: each element's children are ones its type has, in
// its type's order. The Open XML SDK validator checks this too, for the demos only
const schema = xml2js(mathSchema as string) as Element;

const definitions = new Map(
    schema
        .elements![0].elements!.filter(({ name }) => name === "xsd:complexType" || name === "xsd:group")
        .map((definition) => [`${definition.name}:${definition.attributes!.name}`, definition]),
);

type Child = {
    /** Its type, such as CT_D, or a type of another schema, such as s:ST_String */
    readonly type: string;
    /** Where it comes in its parent: children of one rank come before those of the next, and a choice's are all one rank */
    readonly rank: number;
};

/**
 * The children a complex type or group has, by name, with their types and ranks, from the rank given. Groups of
 * WordprocessingML, such as the run properties a math run can have, are left out: docx/math writes none of them.
 */
const childrenOf = (definition: Element, first = 0): { readonly children: ReadonlyMap<string, Child>; readonly next: number } =>
    (definition.elements ?? []).reduce<{ readonly children: ReadonlyMap<string, Child>; readonly next: number }>(
        ({ children, next }, part) => {
            switch (part.name) {
                case "xsd:element":
                    return {
                        children: new Map([
                            ...children,
                            [String(part.attributes!.name), { type: String(part.attributes!.type), rank: next }],
                        ]),
                        next: next + 1,
                    };
                case "xsd:group": {
                    const ref = String(part.attributes!.ref);
                    if (ref.includes(":")) {
                        return { children, next: next + 1 };
                    }
                    const group = childrenOf(definitions.get(`xsd:group:${ref}`)!, next);
                    return { children: new Map([...children, ...group.children]), next: group.next };
                }
                case "xsd:sequence": {
                    const sequence = childrenOf(part, next);
                    return { children: new Map([...children, ...sequence.children]), next: sequence.next };
                }
                case "xsd:choice": {
                    // Each of a choice's options takes the same place
                    const options = (part.elements ?? []).map((option) => childrenOf({ elements: [option] }, next));
                    return {
                        children: new Map([...children, ...options.flatMap((option) => [...option.children])]),
                        next: globalThis.Math.max(next + 1, ...options.map((option) => option.next)),
                    };
                }
                default:
                    return { children, next };
            }
        },
        { children: new Map(), next: first },
    );

/**
 * The problems with an element's children and theirs: children its type doesn't have, or children out of order.
 */
const problemsIn = (element: Element, type: string, path: string): readonly string[] => {
    const definition = definitions.get(`xsd:complexType:${type}`);
    if (definition === undefined) {
        return [`${path}: unknown type ${type}`];
    }
    const { children } = childrenOf(definition);
    const elements = (element.elements ?? []).filter((child) => child.type === "element");
    return elements.flatMap((child, index) => {
        const declared = child.name!.startsWith("m:") ? children.get(child.name!.slice(2)) : undefined;
        const at = `${path} > ${child.name}`;
        if (declared === undefined) {
            return [`${at}: not a child of ${type}`];
        }
        const before = elements.slice(0, index).map((one) => children.get(one.name!.slice(2))?.rank ?? -1);
        const order = before.some((rank) => rank > declared.rank) ? [`${at}: out of the order of ${type}`] : [];
        // Simple types, and types of other schemas, have no children to check
        return [...order, ...(declared.type.includes(":") || declared.type.startsWith("ST_") ? [] : problemsIn(child, declared.type, at))];
    });
};

const problemsOf = (children: readonly MathComponent[]): readonly string[] => {
    const written = xml(new Formatter().format(new Math({ children })));
    return problemsIn((xml2js(written) as Element).elements![0], "CT_OMath", "m:oMath");
};

const run = (text: string): MathRun => new MathRun(text);
const cell = (text: string): readonly MathComponent[] => [run(text)];

// LaTeX of every kind latexToMath reads, as the demo has it
const LATEX: readonly string[] = [
    "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\quad \\sqrt[3]{x} \\quad \\binom{n}{k} \\quad \\nicefrac12 \\quad {a \\atop b}",
    "{}^{14}_{6}\\mathrm{C} \\quad f''(x) \\quad x_i^2 \\quad a \\& b \\# c",
    "\\sum_{i=1}^{n} i^2 \\quad \\int\\limits_0^1 f(x)\\,dx \\quad \\bigcup_{i} A_i \\quad \\oint",
    "\\sin^2\\theta \\quad \\lim_{h \\to 0} \\frac{1}{h} \\quad \\sup_a^b f \\quad \\operatorname*{arg\\,max}_x f \\quad a \\pmod{n}",
    "\\left\\langle \\psi \\middle| \\phi \\right\\rangle \\left( a \\middle| b \\middle/ c \\right) \\left. x \\right|",
    "\\hat{x} \\vec{v} \\overline{AB} \\underline{x} \\overbrace{a}^{n} \\underbrace{b}_{m} \\overset{!}{=} \\xrightarrow[g]{f}",
    "\\boxed{x} \\cancel{y} \\xcancel{z} \\phantom{x} \\smash[t]{y} \\vphantom{z}",
    "\\mathbb{R} \\mathbf{\\mathcal{A}} \\boldsymbol{\\alpha} \\Gamma \\text{if $x$ then} \\not\\in",
    "\\begin{pmatrix} 1 & 2 \\\\ 3 \\end{pmatrix} \\begin{array}{lc} a & b \\end{array} \\sum_{\\substack{i \\\\ j}} a",
    "|x| = \\begin{cases} x & \\text{if } x \\ge 0 \\\\ -x \\end{cases} \\begin{rcases} a \\end{rcases}",
    "\\begin{align} y &= mx + b \\tag{1} \\\\ y' &= m \\end{align}",
    "a &= b \\\\ &= c \\tag{2}",
];

const BRACKETS: readonly MathMatrixBrackets[] = ["none", "round", "square", "curly", "angled", "verticalBars", "doubleVerticalBars"];

const EQUATIONS: readonly (readonly [string, () => readonly MathComponent[]])[] = [
    ...BRACKETS.map(
        (brackets) =>
            [
                `a matrix in ${brackets} brackets, with every option`,
                () => [
                    new MathMatrix({
                        brackets,
                        rows: [[cell("1"), cell("2"), []], [cell("3")], []],
                        columnAlignment: ["left", "right", "center"],
                        verticalAlignment: "top",
                    }),
                ],
            ] as const,
    ),
    [
        "brackets of every kind",
        () => [
            new MathBrackets({ open: "|", close: "|", children: [run("x")] }),
            new MathBrackets({ open: "⟨", close: "⟩", separator: "|", grow: false, items: [cell("a"), cell("b"), []] }),
            new MathBrackets({ open: "{", close: "", items: [cell("x")] }),
            new MathBrackets({ children: [] }),
        ],
    ],
    [
        "cases, with normal text, and without conditions",
        () => [
            new MathCases({
                cases: [
                    { value: cell("1,"), condition: [new MathRun({ text: "if ", normalText: true }), run("x>0")] },
                    { value: cell("0,") },
                    { value: [], condition: [new MathRun({ text: "otherwise", normalText: true })] },
                ],
            }),
            new MathCases({ cases: [{ value: cell("a") }] }),
        ],
    ],
    [
        "an equation array with numbers, several points and empty parts",
        () => [
            new MathEquationArray({
                verticalAlignment: "bottom",
                rows: [
                    { parts: [cell("a"), cell("=b"), cell("c"), cell("=d")], equationNumber: "(1)" },
                    { parts: [[], cell("=e")], equationNumber: "(2)" },
                    { parts: [[]] },
                ],
            }),
        ],
    ],
    [
        "runs in every style and alphabet, literal, and as normal text",
        () => [
            new MathRun({ text: "R", literal: true, script: "doubleStruck", style: "bold" }),
            new MathRun({ text: "&", literal: true, normalText: true }),
            new MathRun({ text: "x", style: "boldItalic" }),
        ],
    ],
    [
        "fractions of every type, and sums and integrals with their limits either way",
        () => [
            ...(["stacked", "skewed", "linear", "noBar"] as const).map(
                (type) => new MathFraction({ numerator: cell("a"), denominator: cell("b"), type }),
            ),
            new MathSum({ children: cell("i"), subScript: cell("i"), limits: "side" }),
            new MathIntegral({ children: cell("x"), superScript: cell("1"), limits: "aboveBelow" }),
        ],
    ],
    [
        "accents, bars, braces with and without labels, boxes, phantoms and large operators",
        () => [
            new MathAccent({ accent: "doubleDot", children: cell("x") }),
            new MathBar({ position: "below", children: [] }),
            new MathBrace({ children: cell("a") }),
            new MathBrace({ position: "below", brace: "square", children: cell("a"), label: cell("n") }),
            new MathBrace({ label: [], children: [] }),
            new MathBox({ children: cell("x") }),
            new MathBox({ borders: ["top"], strikes: ["horizontal", "vertical", "diagonalUp", "diagonalDown"], children: cell("x") }),
            new MathPhantom({ visible: true, width: false, height: false, depth: false, children: cell("x") }),
            new MathLargeOperator({ operator: "product", subScript: cell("i"), superScript: cell("n"), limits: "side", children: [] }),
        ],
    ],
    ...LATEX.map((latex) => [`the LaTeX ${latex}`, () => latexToMath(latex)] as const),
    [
        "everything inside everything",
        () => [
            new MathFraction({
                numerator: [
                    new MathMatrix({
                        brackets: "round",
                        rows: [[[new MathCases({ cases: [{ value: cell("x"), condition: cell("y") }] })]]],
                    }),
                ],
                denominator: [
                    new MathEquationArray({
                        rows: [
                            {
                                parts: [
                                    [
                                        new MathSuperScript({
                                            children: [new MathBrackets({ children: cell("a+b") })],
                                            superScript: cell("2"),
                                        }),
                                    ],
                                    [run("="), new MathMatrix({ rows: [[cell("1")]] })],
                                ],
                                equationNumber: "(3)",
                            },
                        ],
                    }),
                ],
            }),
        ],
    ],
];

describe("docx/math against the schema", () => {
    it.each(EQUATIONS)("writes %s as shared-math.xsd has it", (_, equation) => {
        expect(problemsOf(equation())).toEqual([]);
    });

    it("finds a child out of order, and one its type doesn't have", () => {
        // A check of the check: m:sepChr after m:endChr, and m:e in m:dPr
        const wrong = {
            elements: [
                {
                    type: "element",
                    name: "m:dPr",
                    elements: [
                        { type: "element", name: "m:endChr" },
                        { type: "element", name: "m:sepChr" },
                        { type: "element", name: "m:e" },
                    ],
                },
            ],
        } as Element;
        expect(problemsIn(wrong, "CT_D", "m:d")).toEqual([
            "m:d > m:dPr > m:sepChr: out of the order of CT_DPr",
            "m:d > m:dPr > m:e: not a child of CT_DPr",
        ]);
        expect(problemsIn(wrong, "CT_Unknown", "m:d")).toEqual(["m:d: unknown type CT_Unknown"]);
    });
});
