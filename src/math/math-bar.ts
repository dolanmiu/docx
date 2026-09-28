/**
 * Lines over or under math, such as LaTeX's `\overline` and `\underline`.
 *
 * @module
 */
import { BuilderElement, type MathComponent } from "docx";

import { checkArgument, checkOneOf, createArgument, createValueElement } from "./math-elements";

/** Whether something goes above or below the math it is on */
export type MathPosition = "above" | "below";

export const POSITIONS: readonly MathPosition[] = ["above", "below"];

/**
 * Options for {@link MathBar}.
 */
export type MathBarOptions = {
    /**
     * Whether the line goes above or below.
     * @default "above"
     */
    readonly position?: MathPosition;
    /** What the line goes over or under */
    readonly children: readonly MathComponent[];
};

/**
 * A line over or under math (`m:bar`), as LaTeX's `\overline` and `\underline`, as long as what it goes over.
 *
 * @example
 * ```typescript
 * new MathBar({ children: [new MathRun("AB")] });
 * new MathBar({ position: "below", children: [new MathRun("x")] });
 * ```
 */
export class MathBar extends BuilderElement {
    public constructor({ position = "above", children }: MathBarOptions) {
        checkOneOf("MathBar", "position", position, POSITIONS);
        checkArgument("MathBar", "children", children);

        super({
            name: "m:bar",
            children: [
                // Written either way, as the schema's default is below, and Word's own bar is above
                new BuilderElement({ name: "m:barPr", children: [createValueElement("m:pos", position === "above" ? "top" : "bot")] }),
                createArgument(children),
            ],
        });
    }
}
