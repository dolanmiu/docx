import { MathAngledBrackets, MathCurlyBrackets, MathRoundBrackets, MathSquareBrackets } from "./brackets";
import { MathFraction } from "./fraction";
import { MathFunction } from "./function";
import { MathRun } from "./math-run";
import { MathSum } from "./n-ary";
import { MathRadical } from "./radical";
import { MathSubScript, MathSubSuperScript, MathSuperScript } from "./script";
export declare type MathComponent = MathRun | MathFraction | MathSum | MathSuperScript | MathSubScript | MathSubSuperScript | MathRadical | MathFunction | MathRoundBrackets | MathCurlyBrackets | MathAngledBrackets | MathSquareBrackets;
export declare const WORKAROUND4 = "";
