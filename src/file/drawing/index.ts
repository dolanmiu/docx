/**
 * Drawing module exports.
 *
 * @module
 */
export * from "./drawing";
export * from "./text-wrap";
export * from "./floating";
export { SchemeColor } from "./inline/graphic/graphic-data/pic/shape-properties/outline/scheme-color";
// The option types of drawings, and what docx/shapes uses to write the shapes inside them
export type { DocPropertiesOptions } from "./doc-properties/doc-properties";
export {
    type DrawingLinkOptions,
    NonVisualDrawingProperties,
    type NonVisualDrawingPropertiesOptions,
} from "./doc-properties/non-visual-drawing-properties";
export type { EffectExtentAttributes } from "./effect-extent/effect-extent";
export type { ICropOptions } from "./inline/graphic/graphic-data/pic/blip/source-rectangle";
