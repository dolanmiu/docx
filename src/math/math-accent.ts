/**
 * Accents over math, such as a hat, a tilde, dots or a vector's arrow.
 *
 * @module
 */
import { BuilderElement, type MathComponent } from "docx";

import { checkArgument, checkOneOf, createArgument, createValueElement } from "./math-elements";

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
export type MathAccentName =
    | "hat"
    | "check"
    | "tilde"
    | "acute"
    | "grave"
    | "dot"
    | "doubleDot"
    | "tripleDot"
    | "breve"
    | "bar"
    | "ring"
    | "rightArrow"
    | "leftArrow"
    | "leftRightArrow"
    | "rightHarpoon"
    | "leftHarpoon";

/**
 * Options for {@link MathAccent}.
 */
export type MathAccentOptions = {
    /**
     * The accent.
     * @default "hat"
     */
    readonly accent?: MathAccentName;
    /** What the accent goes over */
    readonly children: readonly MathComponent[];
};

// The combining characters of Word's accents
const ACCENTS: Readonly<Record<MathAccentName, string>> = {
    hat: "\u0302",
    check: "\u030C",
    tilde: "\u0303",
    acute: "\u0301",
    grave: "\u0300",
    dot: "\u0307",
    doubleDot: "\u0308",
    tripleDot: "\u20DB",
    breve: "\u0306",
    bar: "\u0305",
    ring: "\u030A",
    rightArrow: "\u20D7",
    leftArrow: "\u20D6",
    leftRightArrow: "\u20E1",
    rightHarpoon: "\u20D1",
    leftHarpoon: "\u20D0",
};

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
export class MathAccent extends BuilderElement {
    public constructor({ accent = "hat", children }: MathAccentOptions) {
        checkOneOf("MathAccent", "accent", accent, Object.keys(ACCENTS));
        checkArgument("MathAccent", "children", children);

        super({
            name: "m:acc",
            children: [
                new BuilderElement({ name: "m:accPr", children: [createValueElement("m:chr", ACCENTS[accent])] }),
                createArgument(children),
            ],
        });
    }
}
