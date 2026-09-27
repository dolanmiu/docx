/**
 * Cases, such as LaTeX's `cases`: values, each with its condition, in a brace.
 *
 * @module
 */
import { BuilderElement, type MathComponent, createMathBase } from "docx";

import { bracketsElement } from "./math-elements";
import { matrixElement } from "./math-matrix";

/**
 * One case: a value, and the condition it holds under.
 */
export type MathCase = {
    /** The value, such as `−x,` */
    readonly value: readonly MathComponent[];
    /**
     * The condition, such as `if x < 0`. Words such as "if" and "otherwise" read best as normal text:
     * `new MathRun({ text: "if ", normalText: true })`.
     */
    readonly condition?: readonly MathComponent[];
};

/**
 * Options for {@link MathCases}.
 */
export type MathCasesOptions = {
    /** The cases, one to a line. Word allows at most 256 */
    readonly cases: readonly MathCase[];
};

/**
 * Cases, as LaTeX's `cases`: values, each with its condition, one to a line, in a brace on the left. The values and
 * the conditions each line up on the left.
 *
 * They are written as pandoc writes them: a matrix of two columns in a brace with no closing bracket. Word's own
 * equation editor lines the conditions up with an `&` instead, which LibreOffice draws.
 *
 * @example
 * ```typescript
 * new MathCases({
 *   cases: [
 *     { value: [new MathRun("x,")], condition: [new MathRun({ text: "if ", normalText: true }), new MathRun("x≥0")] },
 *     { value: [new MathRun("−x,")], condition: [new MathRun({ text: "otherwise", normalText: true })] },
 *   ],
 * });
 * ```
 */
export class MathCases extends BuilderElement {
    public constructor({ cases }: MathCasesOptions) {
        const conditions = cases.some((one) => one.condition !== undefined);
        const matrix = matrixElement(
            "MathCases",
            {
                rows: cases.map(({ value, condition }) => (conditions ? [value, condition ?? []] : [value])),
                columnAlignment: "left",
            },
            { rowsName: "cases", cellName: (row, column) => `case ${row + 1}'s ${column === 0 ? "value" : "condition"}` },
        );

        super(bracketsElement({ open: "{", close: "" }, [createMathBase({ children: [new BuilderElement(matrix)] })]));
    }
}
