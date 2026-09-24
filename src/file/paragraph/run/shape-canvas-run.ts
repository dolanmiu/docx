/**
 * Shape canvas run module for WordprocessingML documents.
 *
 * This module provides support for drawing canvases: areas of a document that hold shapes,
 * where connectors stay attached to the shapes they join when the shapes are moved.
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { ShapeFill, ShapeLine } from "@file/drawing/inline/graphic/graphic-data/wps";

import { type IShapeGroupChildOptions, layoutShapeDrawing } from "./shape-drawing";
import { createUniformEffectExtent } from "./shape-run-data";
import { Drawing, type IFloating } from "../../drawing";
import { Run } from "../run";

/**
 * A shape or connector on a canvas. It takes the same options as a shape or connector in a {@link ShapeGroupRun}.
 *
 * @see {@link ShapeCanvasRun}
 * @publicApi
 */
export type IShapeCanvasChildOptions = IShapeGroupChildOptions;

/**
 * Options for creating a drawing canvas.
 *
 * @see {@link ShapeCanvasRun}
 * @publicApi
 */
export type IShapeCanvasOptions = {
    /** The shapes on the canvas, and the connectors between them */
    readonly children: readonly IShapeCanvasChildOptions[];
    /**
     * Size of the canvas in pixels. Defaults to reaching from the top-left corner to the right and bottom
     * of the shapes, so an `offset` leaves space above and to the left of a shape. The shapes are not scaled.
     */
    readonly transformation?: {
        readonly width: number;
        readonly height: number;
    };
    /** The canvas's background. Default is none */
    readonly fill?: ShapeFill;
    /** The canvas's outline. Default is none */
    readonly line?: ShapeLine;
    /** Floats the canvas on the page instead of placing it inline with text */
    readonly floating?: IFloating;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

const EMUS_PER_PIXEL = 9525;

/**
 * Represents a drawing canvas in a WordprocessingML document.
 *
 * A canvas holds shapes like a {@link ShapeGroupRun}, but its shapes keep their own size, and Word
 * keeps connectors attached to their shapes when the shapes are moved. Use it for flowcharts and
 * diagrams that people will edit.
 *
 * The shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ShapeCanvasRun({
 *   children: [
 *     { id: "start", type: "flowChartTerminator", transformation: { width: 120, height: 48 } },
 *     { id: "step", type: "flowChartProcess", transformation: { offset: { top: 100 }, width: 120, height: 48 } },
 *     { type: "connector", from: "start", to: "step", route: "elbow", line: { endArrow: "triangle" } },
 *   ],
 * });
 * ```
 */
export class ShapeCanvasRun extends Run {
    public constructor(options: IShapeCanvasOptions) {
        super({});

        // Canvas coordinates start at its top-left corner, so nothing can be above or to the left of it
        const { children, bounds, overhang } = layoutShapeDrawing(options.children, true);
        const emus = options.transformation
            ? {
                  x: Math.round(options.transformation.width * EMUS_PER_PIXEL),
                  y: Math.round(options.transformation.height * EMUS_PER_PIXEL),
              }
            : { x: Math.round(bounds.right), y: Math.round(bounds.bottom) };

        this.root.push(
            new Drawing(
                {
                    type: "wpc",
                    transformation: { pixels: { x: Math.round(emus.x / EMUS_PER_PIXEL), y: Math.round(emus.y / EMUS_PER_PIXEL) }, emus },
                    children,
                    fill: options.fill,
                    line: options.line,
                },
                {
                    floating: options.floating,
                    docProperties: options.altText,
                    effectExtent: createUniformEffectExtent(overhang),
                },
            ),
        );
    }
}
