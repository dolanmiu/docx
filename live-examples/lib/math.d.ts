import { BuilderElement } from 'docx';
import { createMathAccentCharacter } from 'docx';
import { createMathBase } from 'docx';
import { createMathLimitLocation } from 'docx';
import { createMathNAryProperties } from 'docx';
import { createMathPreSubSuperScriptProperties } from 'docx';
import { createMathSubScriptElement } from 'docx';
import { createMathSubScriptProperties } from 'docx';
import { createMathSubSuperScriptProperties } from 'docx';
import { createMathSuperScriptElement } from 'docx';
import { createMathSuperScriptProperties } from 'docx';
import { IMathFractionOptions } from 'docx';
import { IMathFunctionOptions } from 'docx';
import { IMathIntegralOptions } from 'docx';
import { IMathLimitLowerOptions } from 'docx';
import { IMathLimitUpperOptions } from 'docx';
import { IMathOptions } from 'docx';
import { IMathPreSubSuperScriptOptions } from 'docx';
import { IMathRadicalOptions } from 'docx';
import { IMathSubScriptOptions } from 'docx';
import { IMathSubSuperScriptOptions } from 'docx';
import { IMathSumOptions } from 'docx';
import { IMathSuperScriptOptions } from 'docx';
import { Math as Math_2 } from 'docx';
import { MathAngledBrackets } from 'docx';
import { MathComponent } from 'docx';
import { MathCurlyBrackets } from 'docx';
import { MathDegree } from 'docx';
import { MathDenominator } from 'docx';
import { MathFraction } from 'docx';
import { MathFunction } from 'docx';
import { MathFunctionName } from 'docx';
import { MathFunctionProperties } from 'docx';
import { MathIntegral } from 'docx';
import { MathLimit } from 'docx';
import { MathLimitLower } from 'docx';
import { MathLimitUpper } from 'docx';
import { MathNumerator } from 'docx';
import { MathPreSubSuperScript } from 'docx';
import { MathRadical } from 'docx';
import { MathRadicalProperties } from 'docx';
import { MathRoundBrackets } from 'docx';
import { MathRun } from 'docx';
import { MathRunOptions } from 'docx';
import { MathSquareBrackets } from 'docx';
import { MathSubScript } from 'docx';
import { MathSubSuperScript } from 'docx';
import { MathSum } from 'docx';
import { MathSuperScript } from 'docx';

export { createMathAccentCharacter }

export { createMathBase }

export { createMathLimitLocation }

export { createMathNAryProperties }

export { createMathPreSubSuperScriptProperties }

export { createMathSubScriptElement }

export { createMathSubScriptProperties }

export { createMathSubSuperScriptProperties }

export { createMathSuperScriptElement }

export { createMathSuperScriptProperties }

export { IMathFractionOptions }

export { IMathFunctionOptions }

export { IMathIntegralOptions }

export { IMathLimitLowerOptions }

export { IMathLimitUpperOptions }

export { IMathOptions }

export { IMathPreSubSuperScriptOptions }

export { IMathRadicalOptions }

export { IMathSubScriptOptions }

export { IMathSubSuperScriptOptions }

export { IMathSumOptions }

export { IMathSuperScriptOptions }

export { Math_2 as Math }

export { MathAngledBrackets }

/**
 * Brackets of any characters around math (`m:d`), such as |x|, ‖v‖, ⟨a|b⟩ or a brace on one side only. They grow
 * with what they hold.
 *
 * `MathRoundBrackets`, `MathSquareBrackets`, `MathCurlyBrackets` and `MathAngledBrackets` are fixed pairs of these.
 *
 * @example
 * ```typescript
 * new MathBrackets({ open: "|", close: "|", children: [new MathRun("x")] });
 * new MathBrackets({ open: "⟨", close: "⟩", items: [[new MathRun("a")], [new MathRun("b")]] });
 * new MathBrackets({ open: "{", close: "", children: [new MathRun("x")] });
 * ```
 */
export declare class MathBrackets extends BuilderElement {
    constructor(options: MathBracketsOptions);
}

/**
 * Options for {@link MathBrackets}: the brackets, and what goes between them.
 */
export declare type MathBracketsOptions = {
    /**
     * The opening bracket: one character, such as `"|"` or `"⟨"`, or `""` for none (`m:begChr`).
     * @default "("
     */
    readonly open?: string;
    /**
     * The closing bracket: one character, or `""` for none (`m:endChr`).
     * @default ")"
     */
    readonly close?: string;
    /**
     * The character between `items`, such as `","` (`m:sepChr`).
     * @default "|"
     */
    readonly separator?: string;
    /**
     * Whether the brackets grow to the height of what they hold (`m:grow`). LibreOffice and Pages always grow them.
     * @default true
     */
    readonly grow?: boolean;
} & ({
    /** What goes between the brackets */
    readonly children: readonly MathComponent[];
    readonly items?: never;
} | {
    /** Several things between the brackets, with `separator` between them, such as ⟨a|b⟩ */
    readonly items: readonly (readonly MathComponent[])[];
    readonly children?: never;
});

/**
 * One case: a value, and the condition it holds under.
 */
export declare type MathCase = {
    /** The value, such as `−x,` */
    readonly value: readonly MathComponent[];
    /**
     * The condition, such as `if x < 0`. Words such as "if" and "otherwise" read best as normal text:
     * `new MathRun({ text: "if ", normalText: true })`.
     */
    readonly condition?: readonly MathComponent[];
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
export declare class MathCases extends BuilderElement {
    constructor({ cases }: MathCasesOptions);
}

/**
 * Options for {@link MathCases}.
 */
export declare type MathCasesOptions = {
    /** The cases, one to a line. Word allows at most 256 */
    readonly cases: readonly MathCase[];
};

/** Where the cells of a column go across it (`m:mcJc`). LibreOffice and Pages centre them all */
export declare type MathColumnAlignment = "left" | "center" | "right";

export { MathComponent }

export { MathCurlyBrackets }

export { MathDegree }

export { MathDenominator }

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
export declare class MathEquationArray extends BuilderElement {
    constructor({ rows, verticalAlignment }: MathEquationArrayOptions);
}

/**
 * Options for {@link MathEquationArray}.
 */
export declare type MathEquationArrayOptions = {
    /** The rows, one to a line. Word allows at most 64 */
    readonly rows: readonly MathEquationArrayRow[];
    /**
     * Where the array sits on its line.
     * @default "center"
     */
    readonly verticalAlignment?: MathVerticalAlignment;
};

/**
 * One row of an equation array.
 */
export declare type MathEquationArrayRow = {
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

export { MathFraction }

export { MathFunction }

export { MathFunctionName }

export { MathFunctionProperties }

export { MathIntegral }

export { MathLimit }

export { MathLimitLower }

export { MathLimitUpper }

/**
 * A matrix (`m:m`), in brackets or none (`m:d`): LaTeX's `matrix`, `pmatrix`, `bmatrix`, `Bmatrix`, `vmatrix` and
 * `Vmatrix`.
 *
 * Word lines up each column's cells as `columnAlignment` says, and hides the placeholders of empty cells. LibreOffice
 * and Pages centre every column.
 *
 * @example
 * ```typescript
 * new MathMatrix({
 *   brackets: "round",
 *   rows: [
 *     [[new MathRun("1")], [new MathRun("2")]],
 *     [[new MathRun("3")], [new MathRun("4")]],
 *   ],
 * });
 * ```
 */
export declare class MathMatrix extends BuilderElement {
    constructor({ brackets, ...options }: MathMatrixOptions);
}

/**
 * The brackets around a matrix:
 *
 * - `"none"`: none, as LaTeX's `matrix`;
 * - `"round"`: ( ), as `pmatrix`;
 * - `"square"`: [ ], as `bmatrix`;
 * - `"curly"`: { }, as `Bmatrix`;
 * - `"angled"`: ⟨ ⟩;
 * - `"verticalBars"`: | |, as `vmatrix`, for determinants;
 * - `"doubleVerticalBars"`: ‖ ‖, as `Vmatrix`, for norms.
 */
export declare type MathMatrixBrackets = "none" | "round" | "square" | "curly" | "angled" | "verticalBars" | "doubleVerticalBars";

/**
 * Options for {@link MathMatrix}.
 */
export declare type MathMatrixOptions = {
    /**
     * The rows, each a list of cells, and each cell the math in it (`m:mr`, `m:e`). A row shorter than the longest gets
     * empty cells at its end. Word allows at most 256 rows and 64 cells in a row.
     */
    readonly rows: readonly (readonly (readonly MathComponent[])[])[];
    /**
     * The brackets around the matrix.
     * @default "none"
     */
    readonly brackets?: MathMatrixBrackets;
    /**
     * Where the cells go across their columns: one alignment for every column, or one for each column.
     * @default "center"
     */
    readonly columnAlignment?: MathColumnAlignment | readonly MathColumnAlignment[];
    /**
     * Where the matrix sits on its line.
     * @default "center"
     */
    readonly verticalAlignment?: MathVerticalAlignment;
};

export { MathNumerator }

export { MathPreSubSuperScript }

export { MathRadical }

export { MathRadicalProperties }

export { MathRoundBrackets }

export { MathRun }

export { MathRunOptions }

export { MathSquareBrackets }

export { MathSubScript }

export { MathSubSuperScript }

export { MathSum }

export { MathSuperScript }

/** Where a matrix or equation array sits on its line (`m:baseJc`): its top, its middle or its bottom on the line */
export declare type MathVerticalAlignment = "top" | "center" | "bottom";

export { }
