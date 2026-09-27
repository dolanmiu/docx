/**
 * Brackets of any characters around math, such as |x|, ‖v‖, ⟨a|b⟩ or a brace on one side.
 *
 * @module
 */
import { BuilderElement, type MathComponent } from "docx";

import { bracketsElement, checkArgument, checkCharacter, createArgument } from "./math-elements";

/**
 * Options for {@link MathBrackets}: the brackets, and what goes between them.
 */
export type MathBracketsOptions = {
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
} & (
    | {
          /** What goes between the brackets */
          readonly children: readonly MathComponent[];
          readonly items?: never;
      }
    | {
          /** Several things between the brackets, with `separator` between them, such as ⟨a|b⟩ */
          readonly items: readonly (readonly MathComponent[])[];
          readonly children?: never;
      }
);

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
export class MathBrackets extends BuilderElement {
    public constructor(options: MathBracketsOptions) {
        const { open = "(", close = ")", separator, grow } = options;
        const items = options.items ?? [options.children];

        checkCharacter("MathBrackets", "open", open);
        checkCharacter("MathBrackets", "close", close);
        if (separator !== undefined) {
            checkCharacter("MathBrackets", "separator", separator);
        }
        if (items.length === 0) {
            throw new Error("MathBrackets: items is empty. Give at least one item, or use children");
        }
        items.forEach((item, index) => checkArgument("MathBrackets", options.items ? `item ${index + 1}` : "children", item));

        super(bracketsElement({ open, close, separator, grow }, items.map(createArgument)));
    }
}
