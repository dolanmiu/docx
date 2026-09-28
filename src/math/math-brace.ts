/**
 * Braces over or under math, with a label, such as LaTeX's `\overbrace` and `\underbrace`.
 *
 * @module
 */
// cspell:ignore underparen
import { BuilderElement, type MathComponent, createMathBase } from "docx";

import { type MathPosition, POSITIONS } from "./math-bar";
import { checkArgument, checkOneOf, createArgument, createNamedArgument, createValueElement } from "./math-elements";

/**
 * The shape of a brace:
 *
 * - `"curly"`: ⏞ and ⏟, as LaTeX's `\overbrace` and `\underbrace`;
 * - `"square"`: ⎴ and ⎵, as `\overbracket` and `\underbracket`;
 * - `"round"`: ⏜ and ⏝, as `\overparen` and `\underparen`.
 */
export type MathBraceShape = "curly" | "square" | "round";

/**
 * Options for {@link MathBrace}.
 */
export type MathBraceOptions = {
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

const BRACES: Readonly<Record<MathBraceShape, Readonly<Record<MathPosition, string>>>> = {
    curly: { above: "⏞", below: "⏟" },
    square: { above: "⎴", below: "⎵" },
    round: { above: "⏜", below: "⏝" },
};

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
export class MathBrace extends BuilderElement {
    public constructor({ position = "above", brace = "curly", children, label }: MathBraceOptions) {
        checkOneOf("MathBrace", "position", position, POSITIONS);
        checkOneOf("MathBrace", "brace", brace, Object.keys(BRACES));
        checkArgument("MathBrace", "children", children);
        if (label !== undefined) {
            checkArgument("MathBrace", "label", label);
        }

        const above = position === "above";
        const group = {
            name: "m:groupChr",
            children: [
                new BuilderElement({
                    name: "m:groupChrPr",
                    children: [
                        createValueElement("m:chr", BRACES[brace][position]),
                        createValueElement("m:pos", above ? "top" : "bot"),
                        // Lines the brace up with the text by its side nearest what it goes over
                        createValueElement("m:vertJc", above ? "bot" : "top"),
                    ],
                }),
                createArgument(children),
            ],
        };

        super(
            label === undefined
                ? group
                : {
                      name: above ? "m:limUpp" : "m:limLow",
                      children: [createMathBase({ children: [new BuilderElement(group)] }), createNamedArgument("m:lim", label)],
                  },
        );
    }
}
