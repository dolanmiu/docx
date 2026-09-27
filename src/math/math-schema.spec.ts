import { describe, expect, it } from "vitest";
import xml from "xml";
import { type Element, xml2js } from "xml-js";

import { Formatter } from "@export/formatter";
import { Math, type MathComponent, MathFraction, MathRun, MathSuperScript } from "docx";

import { MathBrackets } from "./math-brackets";
import { MathCases } from "./math-cases";
import { MathEquationArray } from "./math-equation-array";
import { MathMatrix, type MathMatrixBrackets } from "./math-matrix";
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
