/**
 * Equation arrays: rows of math lined up at points, such as LaTeX's `align` and `aligned`, with equation numbers.
 *
 * @module
 */
import { BuilderElement, type MathComponent, MathRun } from "docx";

import { MAX_EQUATION_ARRAY_ROWS, checkArgument, checkOneOf, createArgument, createValueElement } from "./math-elements";
import { type MathVerticalAlignment, VERTICAL_ALIGNMENTS } from "./math-matrix";

/**
 * One row of an equation array.
 */
export type MathEquationArrayRow = {
    /**
     * The row's parts. Word lines up the points between them with the same points in the other rows, as LaTeX's `&`
     * does: the first, third and every other point line up (such as at an `=`), and the space goes at the others, as
     * between the columns of `align`. A part can be empty, such as the first part of a row that goes on from the row
     * before.
     */
    readonly parts: readonly (readonly MathComponent[])[];
    /**
     * The row's equation number, such as `"(1)"`, which Word 2016 and later put at the right margin. Word 2013 and
     * older, LibreOffice and Pages show it after a `#`.
     */
    readonly equationNumber?: string;
};

/**
 * Options for {@link MathEquationArray}.
 */
export type MathEquationArrayOptions = {
    /** The rows, one to a line. Word allows at most 64 */
    readonly rows: readonly MathEquationArrayRow[];
    /**
     * Where the array sits on its line.
     * @default "center"
     */
    readonly verticalAlignment?: MathVerticalAlignment;
};

/**
 * An equation array (`m:eqArr`): rows of math, one to a line, lined up at the points between their parts, as LaTeX's
 * `align` and `aligned`, with an equation number at the end of any row.
 *
 * Word marks the points with an `&`, and the number with a `#`, in the text. So an `&` or a `#` in a `MathRun` in the
 * array is taken as one too. LibreOffice shows the `&` and `#`, and centres the rows; Pages lines them up, but shows
 * the `#`.
 *
 * @example
 * ```typescript
 * new MathEquationArray({
 *   rows: [
 *     { parts: [[new MathRun("y")], [new MathRun("=mx+b")]], equationNumber: "(1)" },
 *     { parts: [[new MathRun("y′")], [new MathRun("=m")]], equationNumber: "(2)" },
 *   ],
 * });
 * ```
 */
export class MathEquationArray extends BuilderElement {
    public constructor({ rows, verticalAlignment }: MathEquationArrayOptions) {
        if (rows.length === 0) {
            throw new Error("MathEquationArray: there are no rows. Give at least one");
        }
        if (rows.length > MAX_EQUATION_ARRAY_ROWS) {
            throw new Error(`MathEquationArray: there are ${rows.length} rows, but Word allows at most ${MAX_EQUATION_ARRAY_ROWS}`);
        }
        if (verticalAlignment !== undefined) {
            checkOneOf("MathEquationArray", "verticalAlignment", verticalAlignment, VERTICAL_ALIGNMENTS);
        }
        rows.forEach(({ parts }, row) => {
            if (parts.length === 0) {
                throw new Error(`MathEquationArray: row ${row + 1} has no parts. Give at least one, which can be empty`);
            }
            parts.forEach((part, index) => checkArgument("MathEquationArray", `row ${row + 1}, part ${index + 1}`, part));
        });

        super({
            name: "m:eqArr",
            children: [
                ...(verticalAlignment === undefined
                    ? []
                    : [new BuilderElement({ name: "m:eqArrPr", children: [createValueElement("m:baseJc", verticalAlignment)] })]),
                ...rows.map(({ parts, equationNumber }) =>
                    createArgument([
                        ...parts.flatMap((part, index) => (index === 0 ? part : [new MathRun("&"), ...part])),
                        ...(equationNumber ? [new MathRun("#"), new MathRun(equationNumber)] : []),
                    ]),
                ),
            ],
        });
    }
}
