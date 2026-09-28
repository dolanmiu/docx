/**
 * Large operators with limits, such as products, unions and contour integrals, as well as sums and integrals.
 *
 * @module
 */
// cspell:ignore bigodot bigoplus bigotimes bigsqcup biguplus coproduct
import {
    BuilderElement,
    type MathComponent,
    type MathLimitsPosition,
    createMathNAryProperties,
    createMathSubScriptElement,
    createMathSuperScriptElement,
} from "docx";

import { checkArgument, checkOneOf, createArgument } from "./math-elements";

/**
 * A large operator, as LaTeX writes it:
 *
 * - `"sum"`: ∑, `\sum`;
 * - `"product"`: ∏, `\prod`;
 * - `"coproduct"`: ∐, `\coprod`;
 * - `"union"`: ⋃, `\bigcup`;
 * - `"intersection"`: ⋂, `\bigcap`;
 * - `"squareUnion"`: ⨆, `\bigsqcup`;
 * - `"multisetUnion"`: ⨄, `\biguplus`;
 * - `"logicalOr"`: ⋁, `\bigvee`;
 * - `"logicalAnd"`: ⋀, `\bigwedge`;
 * - `"directSum"`: ⨁, `\bigoplus`;
 * - `"tensorProduct"`: ⨂, `\bigotimes`;
 * - `"circledDot"`: ⨀, `\bigodot`;
 * - `"integral"`: ∫, `\int`;
 * - `"doubleIntegral"`: ∬, `\iint`;
 * - `"tripleIntegral"`: ∭, `\iiint`;
 * - `"quadrupleIntegral"`: ⨌, `\iiiint`;
 * - `"contourIntegral"`: ∮, `\oint`;
 * - `"surfaceIntegral"`: ∯, `\oiint`;
 * - `"volumeIntegral"`: ∰, `\oiiint`.
 */
export type MathLargeOperatorName =
    | "sum"
    | "product"
    | "coproduct"
    | "union"
    | "intersection"
    | "squareUnion"
    | "multisetUnion"
    | "logicalOr"
    | "logicalAnd"
    | "directSum"
    | "tensorProduct"
    | "circledDot"
    | "integral"
    | "doubleIntegral"
    | "tripleIntegral"
    | "quadrupleIntegral"
    | "contourIntegral"
    | "surfaceIntegral"
    | "volumeIntegral";

/**
 * Options for {@link MathLargeOperator}.
 */
export type MathLargeOperatorOptions = {
    /** The operator */
    readonly operator: MathLargeOperatorName;
    /** What the operator applies to, such as the terms of a sum */
    readonly children: readonly MathComponent[];
    /** The lower limit, such as `i=1` */
    readonly subScript?: readonly MathComponent[];
    /** The upper limit, such as `n` */
    readonly superScript?: readonly MathComponent[];
    /**
     * Where the limits go: above and below the operator, or to its right.
     * @default "side" for integrals, and "aboveBelow" for the others, as Word puts them
     */
    readonly limits?: MathLimitsPosition;
};

export const LARGE_OPERATORS: Readonly<Record<MathLargeOperatorName, string>> = {
    sum: "∑",
    product: "∏",
    coproduct: "∐",
    union: "⋃",
    intersection: "⋂",
    squareUnion: "⨆",
    multisetUnion: "⨄",
    logicalOr: "⋁",
    logicalAnd: "⋀",
    directSum: "⨁",
    tensorProduct: "⨂",
    circledDot: "⨀",
    integral: "∫",
    doubleIntegral: "∬",
    tripleIntegral: "∭",
    quadrupleIntegral: "⨌",
    contourIntegral: "∮",
    surfaceIntegral: "∯",
    volumeIntegral: "∰",
};

const LIMITS: readonly MathLimitsPosition[] = ["aboveBelow", "side"];

/**
 * A large operator with limits (`m:nary`), such as ∏, ⋃ or ∮, as LaTeX's `\prod`, `\bigcup` and `\oint`, over what
 * it applies to. `MathSum` and `MathIntegral` are two of these.
 *
 * @example
 * ```typescript
 * new MathLargeOperator({
 *   operator: "product",
 *   subScript: [new MathRun("i=1")],
 *   superScript: [new MathRun("n")],
 *   children: [new MathRun("i")],
 * });
 * ```
 */
export class MathLargeOperator extends BuilderElement {
    public constructor({ operator, children, subScript, superScript, limits }: MathLargeOperatorOptions) {
        checkOneOf("MathLargeOperator", "operator", operator, Object.keys(LARGE_OPERATORS));
        if (limits !== undefined) {
            checkOneOf("MathLargeOperator", "limits", limits, LIMITS);
        }
        checkArgument("MathLargeOperator", "children", children);
        if (subScript !== undefined) {
            checkArgument("MathLargeOperator", "subScript", subScript);
        }
        if (superScript !== undefined) {
            checkArgument("MathLargeOperator", "superScript", superScript);
        }

        const side = limits === undefined ? operator.endsWith("ntegral") : limits === "side";

        super({
            name: "m:nary",
            children: [
                createMathNAryProperties({
                    accent: LARGE_OPERATORS[operator],
                    hasSubScript: subScript !== undefined,
                    hasSuperScript: superScript !== undefined,
                    limitLocationVal: side ? "subSup" : "undOvr",
                }),
                // The schema needs both limits, so a hidden one is written empty
                createMathSubScriptElement({ children: subScript ?? [] }),
                createMathSuperScriptElement({ children: superScript ?? [] }),
                createArgument(children),
            ],
        });
    }
}
