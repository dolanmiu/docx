/**
 * Boxes around math, and lines struck through it, such as LaTeX's `\boxed` and `\cancel`.
 *
 * @module
 */
// cspell:ignore ncel
import { BuilderElement, type MathComponent } from "docx";

import { checkArgument, checkOneOf, createArgument, createValueElement } from "./math-elements";

/** A side of a box */
export type MathBoxSide = "top" | "bottom" | "left" | "right";

/**
 * A line struck through a box:
 *
 * - `"horizontal"`: across its middle;
 * - `"vertical"`: down its middle;
 * - `"diagonalUp"`: from its bottom left corner to its top right, as LaTeX's `\cancel`;
 * - `"diagonalDown"`: from its top left corner to its bottom right, as `\bcancel`.
 */
export type MathBoxStrike = "horizontal" | "vertical" | "diagonalUp" | "diagonalDown";

/**
 * Options for {@link MathBox}.
 */
export type MathBoxOptions = {
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

const SIDES: Readonly<Record<MathBoxSide, string>> = { top: "m:hideTop", bottom: "m:hideBot", left: "m:hideLeft", right: "m:hideRight" };

const STRIKES: Readonly<Record<MathBoxStrike, string>> = {
    horizontal: "m:strikeH",
    vertical: "m:strikeV",
    diagonalUp: "m:strikeBLTR",
    diagonalDown: "m:strikeTLBR",
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
export class MathBox extends BuilderElement {
    public constructor({ children, borders = ["top", "bottom", "left", "right"], strikes = [] }: MathBoxOptions) {
        borders.forEach((side) => checkOneOf("MathBox", "borders", side, Object.keys(SIDES)));
        strikes.forEach((strike) => checkOneOf("MathBox", "strikes", strike, Object.keys(STRIKES)));
        checkArgument("MathBox", "children", children);

        // In the schema's order, which is the order of the records
        const properties = [
            ...Object.entries(SIDES)
                .filter(([side]) => !borders.includes(side as MathBoxSide))
                .map(([, name]) => createValueElement(name, 1)),
            ...Object.entries(STRIKES)
                .filter(([strike]) => strikes.includes(strike as MathBoxStrike))
                .map(([, name]) => createValueElement(name, 1)),
        ];

        super({
            name: "m:borderBox",
            children: [
                ...(properties.length === 0 ? [] : [new BuilderElement({ name: "m:borderBoxPr", children: properties })]),
                createArgument(children),
            ],
        });
    }
}
