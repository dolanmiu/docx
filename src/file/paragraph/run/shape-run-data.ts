/**
 * Helpers shared by ShapeRun and ShapeGroupRun. Not part of the public API.
 *
 * @module
 */
import type { EffectExtentAttributes } from "@file/drawing/effect-extent/effect-extent";
import type { PresetShapeCoreOptions } from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";

import type { IShapeOptions } from "./shape-run";

/**
 * Maps shape options to the data used to write a `wps:wsp` element.
 */
export const createPresetShapeData = (options: Omit<IShapeOptions, "floating">): PresetShapeCoreOptions => ({
    geometry: { type: options.type, adjustments: options.adjustments },
    fill: options.fill,
    line: options.line,
    children: options.children,
    bodyProperties: options.bodyProperties,
});

/**
 * An effect extent reaching the same distance past every side of a drawing.
 */
export const createUniformEffectExtent = (overhang: number): EffectExtentAttributes => ({
    top: overhang,
    right: overhang,
    bottom: overhang,
    left: overhang,
});
