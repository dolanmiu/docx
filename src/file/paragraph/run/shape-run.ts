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
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { IBodyPropertiesOptions } from "@file/drawing/inline/graphic/graphic-data/wps/body-properties";
import {
    type PresetShapeType,
    type ShapeFill,
    type ShapeLine,
    getShapeLineOverhang,
} from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";
import type { Paragraph } from "@file/paragraph";

import { createPresetShapeData, createUniformEffectExtent } from "./shape-run-data";
import { createTransformation } from "./wps-shape-run";
import { Drawing, type IFloating } from "../../drawing";
import type { IMediaTransformation } from "../../media";
import { Run } from "../run";

export type {
    Arrowhead,
    ArrowheadSize,
    ArrowheadType,
    GradientShapeFill,
    GradientStop,
    LineDash,
    PresetShapeType,
    ShapeFill,
    ShapeLine,
    ShapeLineOptions,
    SolidShapeFill,
} from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";

/**
 * Options for creating a shape.
 *
 * @see {@link ShapeRun}
 * @publicApi
 */
export type IShapeOptions = {
    /** The preset shape, such as `"rect"`, `"ellipse"`, `"line"` or `"rightArrow"` */
    readonly type: PresetShapeType;
    /** Size in pixels, with optional rotation (degrees) and flip. Inside a group, `offset` positions the shape. */
    readonly transformation: IMediaTransformation;
    /** How the shape is filled. Default is no fill */
    readonly fill?: ShapeFill;
    /** The shape's line. Default is a solid black line 1pt wide */
    readonly line?: ShapeLine;
    /** Raw shape guide values, keyed by guide name (e.g. `{ adj: 25000 }` for the corners of a `"roundRect"`) */
    readonly adjustments?: Readonly<Record<string, number>>;
    /** Paragraphs of text inside the shape */
    readonly children?: readonly Paragraph[];
    /** Text layout inside the shape. Text is centred vertically unless `verticalAnchor` is set */
    readonly bodyProperties?: IBodyPropertiesOptions;
    /** Floats the shape on the page instead of placing it inline with text */
    readonly floating?: IFloating;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

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
 *     new ShapeRun({ type: "rect", transformation: { width: 200, height: 4 }, fill: "000000", line: "none" }),
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
                    effectExtent: createUniformEffectExtent(getShapeLineOverhang(options.line)),
                },
            ),
        );
    }
}
