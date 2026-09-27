/**
 * Math for docx documents: equations, such as fractions, sums, integrals, radicals, scripts, brackets, matrices, cases
 * and aligned equations with numbers, written as Office Math, which Word shows and edits as equations.
 *
 * Math comes with the `docx` package, from `docx/math`. Everything else, such as the document and its paragraphs,
 * comes from `docx`. `docx` still exports the math it had before `docx/math`, as the same classes, not copies, so the
 * two can be mixed. Matrices, cases, equation arrays and brackets of any characters come from `docx/math` only.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Document, Packer, Paragraph } from "docx";
 * import { Math, MathFraction, MathRun } from "docx/math";
 *
 * const doc = new Document({
 *   sections: [
 *     {
 *       children: [
 *         new Paragraph({
 *           children: [
 *             new Math({
 *               children: [
 *                 new MathRun("2+2"),
 *                 new MathFraction({ numerator: [new MathRun("hi")], denominator: [new MathRun("2")] }),
 *               ],
 *             }),
 *           ],
 *         }),
 *       ],
 *     },
 *   ],
 * });
 *
 * const buffer = await Packer.toBuffer(doc);
 * ```
 */
export {
    Math,
    MathAngledBrackets,
    MathCurlyBrackets,
    MathDegree,
    MathDenominator,
    MathFraction,
    MathFunction,
    MathFunctionName,
    MathFunctionProperties,
    MathIntegral,
    MathLimit,
    MathLimitLower,
    MathLimitUpper,
    MathNumerator,
    MathPreSubSuperScript,
    MathRadical,
    MathRadicalProperties,
    MathRoundBrackets,
    MathRun,
    MathSquareBrackets,
    MathSubScript,
    MathSubSuperScript,
    MathSum,
    MathSuperScript,
    createMathAccentCharacter,
    createMathBase,
    createMathLimitLocation,
    createMathNAryProperties,
    createMathPreSubSuperScriptProperties,
    createMathSubScriptElement,
    createMathSubScriptProperties,
    createMathSubSuperScriptProperties,
    createMathSuperScriptElement,
    createMathSuperScriptProperties,
} from "docx";
export type {
    IMathFractionOptions,
    IMathFunctionOptions,
    IMathIntegralOptions,
    IMathLimitLowerOptions,
    IMathLimitUpperOptions,
    IMathOptions,
    IMathPreSubSuperScriptOptions,
    IMathRadicalOptions,
    IMathSubScriptOptions,
    IMathSubSuperScriptOptions,
    IMathSumOptions,
    IMathSuperScriptOptions,
    MathComponent,
    MathRunOptions,
} from "docx";
export { MathBrackets, type MathBracketsOptions } from "./math-brackets";
export { MathCases, type MathCase, type MathCasesOptions } from "./math-cases";
export { MathEquationArray, type MathEquationArrayOptions, type MathEquationArrayRow } from "./math-equation-array";
export {
    MathMatrix,
    type MathColumnAlignment,
    type MathMatrixBrackets,
    type MathMatrixOptions,
    type MathVerticalAlignment,
} from "./math-matrix";
