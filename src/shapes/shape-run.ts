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
import { Drawing, Run, createTransformation } from "docx";

import { SHAPE_URI } from "./drawing/shape-drawing-child";
import { createStyledDrawing } from "./drawing/styled-drawing";
import { createPresetShape } from "./preset-shape/preset-shape";
import { shapeStyledParagraphs } from "./shape-drawing";
import { type ShapeFloating, relativeSizeBase, toImageFloating, withRelativePlacement } from "./shape-floating";
import {
    type ShapeBaseOptions,
    type WithPresetShape,
    createDrawingProperties,
    createPresetShapeData,
    getShapeEffectExtent,
} from "./shape-run-data";
import { resolveShapeSize } from "./shape-text-size";

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
    ShapeColor,
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
    ShapeThemeColor,
    ShapeThemeColorName,
    SolidShapeFill,
} from "./preset-shape";
export type {
    CustomShapeConnectionPoint,
    CustomShapeGeometry,
    CustomShapePath,
    CustomShapePathFill,
    CustomShapeTextArea,
} from "./custom-geometry";
export type { ShapeSize, ShapeTransformation } from "./shape-text-size";
export type {
    ShapeFloating,
    ShapeHeightRelativeTo,
    ShapeHorizontalPosition,
    ShapePercentage,
    ShapeVerticalPosition,
    ShapeWidthRelativeTo,
} from "./shape-floating";

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
        /**
         * Floats the shape on the page instead of placing it inline with text. A floating shape's size and offsets can be
         * percentages of the page, its margins or the space between them
         */
        readonly floating?: ShapeFloating;
        /**
         * The name of a text flow the shape is in: text that flows from one shape to the next, such as an article that
         * continues on another page. The first shape of the flow in the document holds the text, from its `text` and
         * `children`, and the text that doesn't fit flows on into the next shape of the flow, and so on
         */
        readonly textFlow?: string;
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

        const floating = options.floating && toImageFloating(options.floating);
        const drawingOptions = createDrawingProperties({ ...options, floating });
        this.root.push(
            // A shape that fits its text is sized in the document's styles when it is written
            createStyledDrawing((styles) => {
                const transformation = resolveShapeSize(options, styles, options.floating && relativeSizeBase(options.floating));
                // A shape on its own is positioned by the run (or `floating`), not by an offset
                const drawingTransformation = createTransformation({ ...transformation, offset: undefined });
                // A percentage size or offset is written as the size or offset on the library's default page, then as a percentage
                return withRelativePlacement(
                    new Drawing(
                        {
                            type: "graphic",
                            uri: SHAPE_URI,
                            transformation: drawingTransformation,
                            content: createPresetShape({
                                ...createPresetShapeData(options, styles),
                                textFlow: options.textFlow,
                                transformation: drawingTransformation,
                            }),
                        },
                        { ...drawingOptions, effectExtent: getShapeEffectExtent({ ...options, transformation }) },
                    ),
                    options.floating,
                    options.transformation,
                );
            }, shapeStyledParagraphs(options)),
        );
    }
}
