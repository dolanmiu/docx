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
import { MathFractionType } from 'docx';
import { MathFunction } from 'docx';
import { MathFunctionName } from 'docx';
import { MathFunctionProperties } from 'docx';
import { MathIntegral } from 'docx';
import { MathLimit } from 'docx';
import { MathLimitLower } from 'docx';
import { MathLimitsPosition } from 'docx';
import { MathLimitUpper } from 'docx';
import { MathNumerator } from 'docx';
import { MathPreSubSuperScript } from 'docx';
import { MathRadical } from 'docx';
import { MathRadicalProperties } from 'docx';
import { MathRoundBrackets } from 'docx';
import { MathRun } from 'docx';
import { MathRunOptions } from 'docx';
import { MathRunScript } from 'docx';
import { MathRunStyle } from 'docx';
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

/**
 * Turns LaTeX math into docx's math, to go in a `Math`, as Word's own equations, which it shows and edits as it does
 * those typed into it.
 *
 * It reads the math that LaTeX, MathJax and KaTeX write: fractions, scripts, roots, sums, integrals and other large
 * operators, functions such as sin and lim, brackets that grow with `\left` and `\right`, accents, braces, boxes,
 * fonts such as `\mathbb` and `\mathrm`, `\text`, Greek letters and symbols, and the environments for matrices,
 * cases and aligned equations, with `\tag` for their numbers. The math can be given in `$…$`, `$$…$$`, `\(…\)` or
 * `\[…\]`, which are left out.
 *
 * Colours, sizes and spacing that Word works out for itself are left out.
 *
 * @param latex - The LaTeX, such as `"\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"`
 * @returns The math, to be the children of a `Math`, or to go among other math components
 * @throws If the LaTeX has a command or an environment it doesn't know, or isn't well formed, such as a `{` with no
 * `}`. The error says where
 *
 * @example
 * ```typescript
 * new Math({ children: latexToMath("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}") });
 * ```
 */
export declare const latexToMath: (latex: string) => readonly MathComponent[];

export { Math_2 as Math }

/**
 * An accent over math (`m:acc`), such as a hat, a tilde, dots or a vector's arrow, as LaTeX's `\hat`, `\tilde`,
 * `\dot` and `\vec`. Word stretches the accent over what it goes over.
 *
 * For a line over or under math, as LaTeX's `\overline` and `\underline`, use a `MathBar`.
 *
 * @example
 * ```typescript
 * new MathAccent({ accent: "rightArrow", children: [new MathRun("v")] });
 * ```
 */
export declare class MathAccent extends BuilderElement {
    constructor({ accent, children }: MathAccentOptions);
}

/**
 * An accent over math, as LaTeX writes it:
 *
 * - `"hat"`: x̂, `\hat` and `\widehat`;
 * - `"check"`: x̌, `\check`;
 * - `"tilde"`: x̃, `\tilde` and `\widetilde`;
 * - `"acute"`: x́, `\acute`;
 * - `"grave"`: x̀, `\grave`;
 * - `"dot"`: ẋ, `\dot`;
 * - `"doubleDot"`: ẍ, `\ddot`;
 * - `"tripleDot"`: x⃛, `\dddot`;
 * - `"breve"`: x̆, `\breve`;
 * - `"bar"`: x̅, `\bar`;
 * - `"ring"`: x̊, `\mathring`;
 * - `"rightArrow"`: x⃗, `\vec` and `\overrightarrow`;
 * - `"leftArrow"`: x⃖, `\overleftarrow`;
 * - `"leftRightArrow"`: x⃡, `\overleftrightarrow`;
 * - `"rightHarpoon"`: x⃑, `\overrightharpoon`;
 * - `"leftHarpoon"`: x⃐, `\overleftharpoon`.
 */
export declare type MathAccentName = "hat" | "check" | "tilde" | "acute" | "grave" | "dot" | "doubleDot" | "tripleDot" | "breve" | "bar" | "ring" | "rightArrow" | "leftArrow" | "leftRightArrow" | "rightHarpoon" | "leftHarpoon";

/**
 * Options for {@link MathAccent}.
 */
export declare type MathAccentOptions = {
    /**
     * The accent.
     * @default "hat"
     */
    readonly accent?: MathAccentName;
    /** What the accent goes over */
    readonly children: readonly MathComponent[];
};

export { MathAngledBrackets }

/**
 * A line over or under math (`m:bar`), as LaTeX's `\overline` and `\underline`, as long as what it goes over.
 *
 * @example
 * ```typescript
 * new MathBar({ children: [new MathRun("AB")] });
 * new MathBar({ position: "below", children: [new MathRun("x")] });
 * ```
 */
export declare class MathBar extends BuilderElement {
    constructor({ position, children }: MathBarOptions);
}

/**
 * Options for {@link MathBar}.
 */
export declare type MathBarOptions = {
    /**
     * Whether the line goes above or below.
     * @default "above"
     */
    readonly position?: MathPosition;
    /** What the line goes over or under */
    readonly children: readonly MathComponent[];
};

/**
 * A box around math (`m:borderBox`), as LaTeX's `\boxed`, with lines struck through it, as `\cancel`, `\bcancel` and
 * `\xcancel`. Any of its sides can be left out.
 *
 * @example
 * ```typescript
 * new MathBox({ children: [new MathRun("E=mc²")] });
 * new MathBox({ borders: [], strikes: ["diagonalUp"], children: [new MathRun("x")] });
 * ```
 */
export declare class MathBox extends BuilderElement {
    constructor({ children, borders, strikes }: MathBoxOptions);
}

/**
 * Options for {@link MathBox}.
 */
export declare type MathBoxOptions = {
    /** What goes in the box */
    readonly children: readonly MathComponent[];
    /**
     * The sides of the box that are drawn. `[]` draws none, for lines struck through math with no box.
     * @default ["top", "bottom", "left", "right"]
     */
    readonly borders?: readonly MathBoxSide[];
    /**
     * Lines struck through the box, such as `["diagonalUp"]` to cancel a term.
     * @default []
     */
    readonly strikes?: readonly MathBoxStrike[];
};

/** A side of a box */
export declare type MathBoxSide = "top" | "bottom" | "left" | "right";

/**
 * A line struck through a box:
 *
 * - `"horizontal"`: across its middle;
 * - `"vertical"`: down its middle;
 * - `"diagonalUp"`: from its bottom left corner to its top right, as LaTeX's `\cancel`;
 * - `"diagonalDown"`: from its top left corner to its bottom right, as `\bcancel`.
 */
export declare type MathBoxStrike = "horizontal" | "vertical" | "diagonalUp" | "diagonalDown";

/**
 * A brace over or under math (`m:groupChr`), as long as what it goes over, as LaTeX's `\overbrace` and
 * `\underbrace`. A label goes on the brace's other side, as Word writes it: in a limit above (`m:limUpp`) or below
 * (`m:limLow`).
 *
 * @example
 * ```typescript
 * new MathBrace({
 *   position: "below",
 *   children: [new MathRun("1+2+⋯+n")],
 *   label: [new MathRun("n terms")],
 * });
 * ```
 */
export declare class MathBrace extends BuilderElement {
    constructor({ position, brace, children, label }: MathBraceOptions);
}

/**
 * Options for {@link MathBrace}.
 */
export declare type MathBraceOptions = {
    /**
     * Whether the brace goes above or below.
     * @default "above"
     */
    readonly position?: MathPosition;
    /**
     * The shape of the brace.
     * @default "curly"
     */
    readonly brace?: MathBraceShape;
    /** What the brace goes over or under */
    readonly children: readonly MathComponent[];
    /** A label on the brace's other side, such as `n times` */
    readonly label?: readonly MathComponent[];
};

/**
 * The shape of a brace:
 *
 * - `"curly"`: ⏞ and ⏟, as LaTeX's `\overbrace` and `\underbrace`;
 * - `"square"`: ⎴ and ⎵, as `\overbracket` and `\underbracket`;
 * - `"round"`: ⏜ and ⏝, as `\overparen` and `\underparen`.
 */
export declare type MathBraceShape = "curly" | "square" | "round";

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

export { MathFractionType }

export { MathFunction }

export { MathFunctionName }

export { MathFunctionProperties }

export { MathIntegral }

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
export declare class MathLargeOperator extends BuilderElement {
    constructor({ operator, children, subScript, superScript, limits }: MathLargeOperatorOptions);
}

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
export declare type MathLargeOperatorName = "sum" | "product" | "coproduct" | "union" | "intersection" | "squareUnion" | "multisetUnion" | "logicalOr" | "logicalAnd" | "directSum" | "tensorProduct" | "circledDot" | "integral" | "doubleIntegral" | "tripleIntegral" | "quadrupleIntegral" | "contourIntegral" | "surfaceIntegral" | "volumeIntegral";

/**
 * Options for {@link MathLargeOperator}.
 */
export declare type MathLargeOperatorOptions = {
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

export { MathLimit }

export { MathLimitLower }

export { MathLimitsPosition }

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

/**
 * A phantom (`m:phant`): math that takes up room without being seen, as LaTeX's `\phantom`, to leave space for it or
 * line things up with it. Or math that is seen but takes up no room, or less, as `\smash`.
 *
 * @example
 * ```typescript
 * // As much space as "x+y" takes up
 * new MathPhantom({ children: [new MathRun("x+y")] });
 *
 * // A tall fraction that doesn't push its line apart
 * new MathPhantom({ visible: true, height: false, depth: false, children: [fraction] });
 * ```
 */
export declare class MathPhantom extends BuilderElement {
    constructor({ children, visible, width, height, depth }: MathPhantomOptions);
}

/**
 * Options for {@link MathPhantom}.
 */
export declare type MathPhantomOptions = {
    /** The math */
    readonly children: readonly MathComponent[];
    /**
     * Whether the math is seen (`m:show`).
     * @default false
     */
    readonly visible?: boolean;
    /**
     * Whether it takes up its width. False gives it none (`m:zeroWid`), as LaTeX's `\vphantom`.
     * @default true
     */
    readonly width?: boolean;
    /**
     * Whether it takes up its height above the line. False gives it none (`m:zeroAsc`), as LaTeX's `\hphantom` and
     * `\smash`.
     * @default true
     */
    readonly height?: boolean;
    /**
     * Whether it takes up its depth below the line. False gives it none (`m:zeroDesc`), as LaTeX's `\hphantom` and
     * `\smash`.
     * @default true
     */
    readonly depth?: boolean;
};

/** Whether something goes above or below the math it is on */
export declare type MathPosition = "above" | "below";

export { MathPreSubSuperScript }

export { MathRadical }

export { MathRadicalProperties }

export { MathRoundBrackets }

export { MathRun }

export { MathRunOptions }

export { MathRunScript }

export { MathRunStyle }

export { MathSquareBrackets }

export { MathSubScript }

export { MathSubSuperScript }

export { MathSum }

export { MathSuperScript }

/** Where a matrix or equation array sits on its line (`m:baseJc`): its top, its middle or its bottom on the line */
export declare type MathVerticalAlignment = "top" | "center" | "bottom";

export { }
