/**
 * Shape run module for WordprocessingML documents.
 *
 * This module provides support for preset DrawingML shapes, such as rectangles,
 * ellipses, lines and arrows, drawn inline with text or floating on the page.
 *
 * Reference: http://officeopenxml.com/drwSp.php
 *
 * @module
 */
import { type ShapeBaseOptions, type WithPresetShape, createPresetShapeData, getShapeEffectExtent } from "./shape-run-data";
import { createTransformation } from "./wps-shape-run";
import { Drawing, type IFloating } from "../../drawing";
import { Run } from "../run";

export type {
    Arrowhead,
    ArrowheadSize,
    ArrowheadType,
    CustomLineDash,
    GradientPath,
    GradientShapeFill,
    GradientStop,
    ImageSource,
    LineDash,
    PatternShapeFill,
    PictureShapeFill,
    PictureTile,
    PictureTileAlignment,
    PictureTileMirror,
    PresetShapeAdjustments,
    PresetShapeType,
    ShapeAdjustments,
    ShapeCompoundLine,
    ShapeEffects,
    ShapeFill,
    ShapeGlow,
    ShapeLine,
    ShapeLineCap,
    ShapeLineJoin,
    ShapeLineOptions,
    ShapePattern,
    ShapeReflection,
    ShapeShadow,
    ShapeTextDirection,
    ShapeTextOptions,
    ShapeTextVerticalAlignment,
    ShapeTextWarp,
    SolidShapeFill,
} from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";

/**
 * Options for creating a shape.
 *
 * `adjustments` depends on `type`: each shape has its own, such as `cornerRadius` for a `"roundedRectangle"`
 * or `startAngle` and `endAngle` for a `"pie"`.
 *
 * @see {@link ShapeRun}
 * @publicApi
 */
export type IShapeOptions = WithPresetShape<
    ShapeBaseOptions & {
        /** Floats the shape on the page instead of placing it inline with text */
        readonly floating?: IFloating;
    }
>;

/**
 * Represents a shape in a WordprocessingML document.
 *
 * A shape is one of the 187 DrawingML presets, such as a rectangle, ellipse, line,
 * arrow, star, callout or flowchart symbol. It can have a fill, a line with dashes
 * and arrowheads, and text inside it. It sits inline with text unless `floating` is set.
 *
 * Reference: http://officeopenxml.com/drwSp.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // A black bar inline with text
 * new Paragraph({
 *   children: [
 *     new TextRun("Name: "),
 *     new ShapeRun({ type: "rectangle", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
 *   ],
 * });
 *
 * // An arrow
 * new ShapeRun({
 *   type: "line",
 *   transformation: { width: 300, height: 0 },
 *   line: { color: "C00000", width: 2, endArrow: "triangle" },
 * });
 * ```
 */
export class ShapeRun extends Run {
    public constructor(options: IShapeOptions) {
        super({});

        this.root.push(
            new Drawing(
                {
                    type: "wps",
                    // A shape on its own is positioned by the run (or `floating`), not by an offset
                    transformation: createTransformation({ ...options.transformation, offset: undefined }),
                    data: createPresetShapeData(options),
                },
                {
                    floating: options.floating,
                    docProperties: options.altText,
                    link: options.link,
                    decorative: options.decorative,
                    effectExtent: getShapeEffectExtent(options),
                },
            ),
        );
    }
}
