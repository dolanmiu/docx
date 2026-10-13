/**
 * Math in HTML, as Word's own equations: MathML's `<math>`, and the LaTeX that editors and KaTeX keep in the HTML.
 *
 * `<math>` that KaTeX writes, and other MathML with its LaTeX in an `<annotation encoding="application/x-tex">`, is
 * read from its LaTeX with docx/math's `latexToMath`, which is more faithful than its MathML. Other MathML is read
 * element by element: tokens, rows, fractions, roots, scripts, limits and large operators, accents, brackets, tables
 * and phantoms. Editors' math, such as Quill's `.ql-formula`, TipTap's `data-latex` and CKEditor's `.math-tex`, is
 * read from its LaTeX.
 *
 * @module
 */
// cspell:ignore mfrac mfenced mi mmultiscripts mn mo mover mpadded mphantom mprescripts mroot mrow msqrt mstyle msub msubsup msup mtable mtd mtext mtr munder munderover mlabeledtr menclose mspace merror mathvariant linethickness mglyph coproduct katex
import type { Element } from "domhandler";

import {
    type MathComponent,
    MathFraction,
    MathLimitLower,
    MathLimitUpper,
    MathRadical,
    MathRun,
    type MathRunOptions,
    MathSubScript,
    MathSubSuperScript,
    MathSuperScript,
} from "docx";
import {
    MathAccent,
    type MathAccentName,
    MathBar,
    MathBrackets,
    MathLargeOperator,
    type MathLargeOperatorName,
    MathMatrix,
    MathPhantom,
    latexToMath,
} from "docx/math";

import { elementsOf, hasClass, textOf } from "./dom";

// The large operators MathML writes as an `<mo>` under and over limits, by their characters
const LARGE_OPERATORS: ReadonlyMap<string, MathLargeOperatorName> = new Map([
    ["∑", "sum"],
    ["∏", "product"],
    ["∐", "coproduct"],
    ["⋃", "union"],
    ["⋂", "intersection"],
    ["⨆", "squareUnion"],
    ["⨄", "multisetUnion"],
    ["⋁", "logicalOr"],
    ["⋀", "logicalAnd"],
    ["⨁", "directSum"],
    ["⨂", "tensorProduct"],
    ["⨀", "circledDot"],
    ["∫", "integral"],
    ["∬", "doubleIntegral"],
    ["∭", "tripleIntegral"],
    ["⨌", "quadrupleIntegral"],
    ["∮", "contourIntegral"],
    ["∯", "surfaceIntegral"],
    ["∰", "volumeIntegral"],
]);

// The accents MathML writes as an `<mo>` over its base, by their characters, in their spacing and combining forms
const ACCENTS: ReadonlyMap<string, MathAccentName> = new Map([
    ["^", "hat"],
    ["ˆ", "hat"],
    ["̂", "hat"],
    ["ˇ", "check"],
    ["̌", "check"],
    ["~", "tilde"],
    ["˜", "tilde"],
    ["̃", "tilde"],
    ["´", "acute"],
    ["́", "acute"],
    ["`", "grave"],
    ["̀", "grave"],
    ["˙", "dot"],
    ["̇", "dot"],
    ["¨", "doubleDot"],
    ["̈", "doubleDot"],
    ["⃛", "tripleDot"],
    ["˘", "breve"],
    ["̆", "breve"],
    ["˚", "ring"],
    ["̊", "ring"],
    ["→", "rightArrow"],
    ["⃗", "rightArrow"],
    ["←", "leftArrow"],
    ["⃖", "leftArrow"],
    ["↔", "leftRightArrow"],
    ["⃡", "leftRightArrow"],
    ["⇀", "rightHarpoon"],
    ["⃑", "rightHarpoon"],
    ["↼", "leftHarpoon"],
    ["⃐", "leftHarpoon"],
]);

// Bars over or under their base
const BARS: ReadonlySet<string> = new Set(["¯", "̅", "_", "―", "‾", "̲"]);

// MathML's mathvariant values, as Word's styles and alphabets
const VARIANTS: ReadonlyMap<string, Omit<MathRunOptions, "text">> = new Map([
    ["normal", { style: "plain" }],
    ["bold", { style: "bold" }],
    ["italic", { style: "italic" }],
    ["bold-italic", { style: "boldItalic" }],
    ["double-struck", { script: "doubleStruck" }],
    ["fraktur", { script: "fraktur" }],
    ["bold-fraktur", { script: "fraktur", style: "bold" }],
    ["script", { script: "script" }],
    ["bold-script", { script: "script", style: "bold" }],
    ["sans-serif", { script: "sansSerif" }],
    ["bold-sans-serif", { script: "sansSerif", style: "bold" }],
    ["monospace", { script: "monospace" }],
]);

// The closing bracket of each opening one
const OPENING_FENCES: ReadonlyMap<string, string> = new Map([
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
    ["|", "|"],
    ["‖", "‖"],
    ["⟨", "⟩"],
    ["⌈", "⌉"],
    ["⌊", "⌋"],
]);

/** A token's text as a math run, in its mathvariant: an `<mi>` of more than one letter, such as "sin", is upright */
const tokenOf = (element: Element): readonly MathComponent[] => {
    const text = textOf(element).trim();
    if (text === "") {
        return [];
    }
    const variant = VARIANTS.get(element.attribs.mathvariant ?? "");
    if (element.name === "mtext" || element.name === "ms") {
        return [new MathRun({ text: element.name === "ms" ? `"${text}"` : text, normalText: true })];
    }
    return element.name === "mi" && variant === undefined && [...text].length > 1
        ? [new MathRun({ text, style: "plain" })]
        : [new MathRun({ text, ...variant })];
};

/** A row's math: each of its elements', with a bracket at each end, such as `(` and `)`, written as brackets around the rest */
const rowOf = (elements: readonly Element[]): readonly MathComponent[] => {
    const first = elements[0] as Element | undefined;
    const last = elements[elements.length - 1];
    const open = first?.name === "mo" ? textOf(first).trim() : undefined;
    const close = last?.name === "mo" && elements.length > 1 ? textOf(last).trim() : undefined;
    return open !== undefined && close !== undefined && OPENING_FENCES.get(open) === close
        ? [new MathBrackets({ open, close, children: elements.slice(1, -1).flatMap(mathMlOf) })]
        : elements.flatMap(mathMlOf);
};

/** The math of an argument of a fraction, a script or another, which is an element that may be a row */
const argumentOf = (element: Element | undefined): readonly MathComponent[] => (element ? mathMlOf(element) : []);

/** An `<munder>`, `<mover>` or `<munderover>`: a large operator with limits, an accent or a bar, or a limit */
const underOverOf = (element: Element, [base, first, second]: readonly Element[]): readonly MathComponent[] => {
    const under = element.name === "mover" ? undefined : first;
    const over = element.name === "munder" ? undefined : element.name === "mover" ? first : second;
    const operator = base?.name === "mo" ? LARGE_OPERATORS.get(textOf(base).trim()) : undefined;
    if (operator) {
        return [new MathLargeOperator({ operator, children: [], subScript: argumentOf(under), superScript: argumentOf(over) })];
    }
    const overText = over ? textOf(over).trim() : "";
    const underText = under ? textOf(under).trim() : "";
    const accent = ACCENTS.get(overText);
    if (over && !under && accent) {
        return [new MathAccent({ accent, children: argumentOf(base) })];
    }
    if ((over && !under && BARS.has(overText)) || (under && !over && BARS.has(underText))) {
        return [new MathBar({ position: over ? "above" : "below", children: argumentOf(base) })];
    }
    const withUnder = under ? [new MathLimitLower({ children: argumentOf(base), limit: argumentOf(under) })] : argumentOf(base);
    return over ? [new MathLimitUpper({ children: withUnder, limit: argumentOf(over) })] : withUnder;
};

/**
 * MathML's presentation markup as docx's math components. Elements it doesn't know have their content read, so their
 * text is kept.
 */
export const mathMlOf = (element: Element): readonly MathComponent[] => {
    const children = elementsOf(element);
    const [first, second, third] = children;
    switch (element.name) {
        case "mi":
        case "mn":
        case "mo":
        case "mtext":
        case "ms":
            return tokenOf(element);
        case "mspace":
            return [new MathRun({ text: " ", normalText: true })];
        case "semantics":
            return argumentOf(first);
        case "annotation":
        case "annotation-xml":
        case "mprescripts":
        case "none":
            return [];
        case "mfrac":
            return [
                new MathFraction({
                    numerator: argumentOf(first),
                    denominator: argumentOf(second),
                    ...(/^0(?:\D|$)/.test(element.attribs.linethickness ?? "") ? { type: "noBar" as const } : {}),
                }),
            ];
        case "msqrt":
            return [new MathRadical({ children: rowOf(children) })];
        case "mroot":
            return [new MathRadical({ children: argumentOf(first), degree: argumentOf(second) })];
        case "msup":
            return [new MathSuperScript({ children: argumentOf(first), superScript: argumentOf(second) })];
        case "msub":
            return [new MathSubScript({ children: argumentOf(first), subScript: argumentOf(second) })];
        case "msubsup":
            return [new MathSubSuperScript({ children: argumentOf(first), subScript: argumentOf(second), superScript: argumentOf(third) })];
        case "mmultiscripts":
            // The scripts after the base; those before it, after <mprescripts>, are rare and left out
            return [new MathSubSuperScript({ children: argumentOf(first), subScript: argumentOf(second), superScript: argumentOf(third) })];
        case "munder":
        case "mover":
        case "munderover":
            return underOverOf(element, children);
        case "mfenced": {
            const open = element.attribs.open ?? "(";
            const close = element.attribs.close ?? ")";
            const separator = (element.attribs.separators ?? ",").trim().charAt(0);
            const parts = children.flatMap((child, index) => [
                ...(index > 0 && separator ? [new MathRun({ text: separator })] : []),
                ...mathMlOf(child),
            ]);
            return [new MathBrackets({ open, close, children: parts })];
        }
        case "mtable":
            return [
                new MathMatrix({
                    rows: children
                        .filter((row) => row.name === "mtr" || row.name === "mlabeledtr")
                        .map((row) =>
                            elementsOf(row)
                                .slice(row.name === "mlabeledtr" ? 1 : 0)
                                .map((cell) => rowOf(elementsOf(cell))),
                        ),
                }),
            ];
        case "mphantom":
            return [new MathPhantom({ children: rowOf(children) })];
        default:
            // <math>, <mrow>, <mstyle>, <mpadded>, <menclose>, <merror> and elements MathML doesn't have
            return rowOf(children);
    }
};

/** The LaTeX an element of math keeps, such as KaTeX's annotation, or undefined if it keeps none */
const latexIn = (math: Element): string | undefined => {
    const annotation = math.children.length === 0 ? undefined : findAnnotation(math);
    return annotation && textOf(annotation);
};

const findAnnotation = (element: Element): Element | undefined => {
    for (const child of elementsOf(element)) {
        if (child.name === "annotation" && /^(?:application\/x-tex|tex|latex|application\/x-latex)$/i.test(child.attribs.encoding ?? "")) {
            return child;
        }
        const found = findAnnotation(child);
        if (found) {
            return found;
        }
    }
    return undefined;
};

/**
 * A `<math>`'s components: from its LaTeX, if it keeps it, or its MathML. The error of LaTeX that can't be read is
 * thrown, and its MathML is used instead.
 */
export const mathOf = (math: Element): readonly MathComponent[] => {
    const latex = latexIn(math);
    if (latex !== undefined) {
        try {
            return latexToMath(latex);
        } catch {
            // The MathML is read instead
        }
    }
    return mathMlOf(math);
};

/**
 * The LaTeX of an editor's element of math, if it is one: Quill's `.ql-formula` and TipTap's math keep it in an
 * attribute, CKEditor's `.math-tex` and `<script type="math/tex">` in their text.
 */
export const editorLatexOf = (element: Element): string | undefined => {
    const { attribs } = element;
    if (attribs["data-latex"] !== undefined) {
        return attribs["data-latex"];
    }
    if (hasClass(element, "ql-formula") && attribs["data-value"] !== undefined) {
        return attribs["data-value"];
    }
    return hasClass(element, "math-tex") || (element.name === "script" && /^math\/tex\b/i.test(attribs.type ?? ""))
        ? textOf(element)
        : undefined;
};

/** Whether an element shows math that the HTML also has as MathML, such as KaTeX's HTML, which is left out */
export const isMathRendering = (element: Element): boolean => hasClass(element, "katex-html");
