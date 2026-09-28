/**
 * Phantoms: math that takes up room without being seen, or is seen without taking up room, such as LaTeX's
 * `\phantom` and `\smash`.
 *
 * @module
 */
import { BuilderElement, type MathComponent } from "docx";

import { checkArgument, createArgument, createValueElement } from "./math-elements";

/**
 * Options for {@link MathPhantom}.
 */
export type MathPhantomOptions = {
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
export class MathPhantom extends BuilderElement {
    public constructor({ children, visible = false, width = true, height = true, depth = true }: MathPhantomOptions) {
        checkArgument("MathPhantom", "children", children);

        super({
            name: "m:phant",
            children: [
                new BuilderElement({
                    name: "m:phantPr",
                    children: [
                        createValueElement("m:show", visible ? 1 : 0),
                        ...(width ? [] : [createValueElement("m:zeroWid", 1)]),
                        ...(height ? [] : [createValueElement("m:zeroAsc", 1)]),
                        ...(depth ? [] : [createValueElement("m:zeroDesc", 1)]),
                    ],
                }),
                createArgument(children),
            ],
        });
    }
}
