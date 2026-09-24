/**
 * The box a preset shape's text is written in, such as the middle of an ellipse or a diamond.
 *
 * Reference: ECMA-376 Part 1, 20.1.9.22 rect (Shape Text Rectangle)
 *
 * @module
 */
import { evaluateShapeGuides } from "../connector/shape-guides";
import { PRESET_SHAPE_GEOMETRY } from "../preset-shape/preset-shape-geometry";
import type { PresetShapeType } from "../preset-shape/preset-shape-type";

/**
 * A box in a shape's own coordinates.
 */
export type TextRectangle = {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
};

/**
 * The box a preset shape of the given size writes its text in, before the text's margins. Shapes without
 * a text box of their own, and custom shapes, write their text across the whole shape.
 *
 * @param adjustments - The shape's adjustment guide values, such as `{ adj: 25000 }`. Missing values take their defaults
 */
export const getTextRectangle = (
    type: PresetShapeType | "custom",
    width: number,
    height: number,
    adjustments?: Readonly<Record<string, number>>,
): TextRectangle => {
    const definition = type === "custom" ? undefined : PRESET_SHAPE_GEOMETRY[type];
    if (!definition?.text) {
        return { left: 0, top: 0, right: width, bottom: height };
    }
    const value = evaluateShapeGuides(definition, width, height, adjustments);
    const [left, top, right, bottom] = definition.text.split(" ").map(value);
    return { left, top, right, bottom };
};
