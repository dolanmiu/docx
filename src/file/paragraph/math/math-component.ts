/**
 * Math component types module.
 *
 * This module defines the union type of all valid math components
 * that can appear within a Math element.
 *
 * @module
 */
import { MathAngledBrackets, MathCurlyBrackets, MathRoundBrackets, MathSquareBrackets } from "./brackets";
import { MathFraction } from "./fraction";
import { MathFunction } from "./function";
import { MathRun } from "./math-run";
import { MathIntegral, MathSum } from "./n-ary";
import { MathRadical } from "./radical";
import { MathSubScript, MathSubSuperScript, MathSuperScript } from "./script";

/**
 * Union type of all valid math components.
 *
 * MathComponent represents any element that can appear within a Math equation,
 * including runs, fractions, radicals, integrals, sums, scripts, and brackets.
 */
export type MathComponent =
    | MathRun
    | MathFraction
    | MathSum
    | MathIntegral
    | MathSuperScript
    | MathSubScript
    | MathSubSuperScript
    | MathRadical
    | MathFunction
    | MathRoundBrackets
    | MathCurlyBrackets
    | MathAngledBrackets
    | MathSquareBrackets;

// Needed because of: https://github.com/s-panferov/awesome-typescript-loader/issues/432
/**
 * @ignore
 */
export const WORKAROUND4 = "";
