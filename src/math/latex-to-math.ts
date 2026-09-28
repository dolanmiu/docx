/**
 * LaTeX math, as docx's math: `latexToMath`.
 *
 * @module
 */
// cspell:ignore mathbb mathrm
import type { MathComponent } from "docx";

import { atomsToMath } from "./latex/latex-atoms";
import { equationArrayOf, parseLatex } from "./latex/latex-parser";

// The delimiters math can come in, which are left out. $$ comes before $, so it isn't read as $ and $
const DELIMITERS: readonly (readonly [string, string])[] = [
    ["$$", "$$"],
    ["\\[", "\\]"],
    ["\\(", "\\)"],
    ["$", "$"],
];

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
export const latexToMath = (latex: string): readonly MathComponent[] => {
    const start = latex.length - latex.trimStart().length;
    const end = latex.trimEnd().length;
    const [open, close] = DELIMITERS.find(
        ([opening, closing]) =>
            end - start >= opening.length + closing.length && latex.startsWith(opening, start) && latex.endsWith(closing, end),
    ) ?? ["", ""];

    const rows = parseLatex(latex, start + open.length, end - close.length);

    return rows.length === 1 && rows[0].cells.length === 1 && rows[0].tag === undefined
        ? atomsToMath(rows[0].cells[0])
        : [equationArrayOf(rows)];
};
