/**
 * Shape canvas run module for WordprocessingML documents.
 *
 * This module provides support for drawing canvases: areas of a document that hold shapes,
 * where connectors stay attached to the shapes they join when the shapes are moved.
 *
 * @module
 */
import { type DocPropertiesOptions, Drawing, type DrawingLinkOptions, type IFloating, Run, docPropertiesUniqueNumericId } from "docx";

import { createAlternateContent } from "./drawing/alternate-content";
import { CANVAS_URI, GROUP_URI, type ShapeDrawingChildMediaData, createShapeDrawingChild } from "./drawing/shape-drawing-child";
import { createShapeGroup } from "./drawing/shape-group";
import { createWpcCanvas } from "./drawing/wpc-canvas";
import { type ShapeFill, type ShapeLine, getShapeLineOverhang } from "./preset-shape";
import { type IShapeGroupChildOptions, getGroupEffectExtent, layoutShapeDrawing } from "./shape-drawing";
import type { ShapeLayout } from "./shape-layout";
import { createUniformEffectExtent } from "./shape-run-data";

/**
 * A shape, picture, group or connector on a canvas. It takes the same options as a child of a {@link ShapeGroupRun}.
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
export type IShapeCanvasOptions = DrawingLinkOptions & {
    /** The shapes, pictures and groups on the canvas, and the connectors between them */
    readonly children: readonly IShapeCanvasChildOptions[];
    /**
     * Size of the canvas in pixels. Defaults to reaching from the top-left corner to the right and bottom
     * of the shapes, including their lines and effects, so an `offset` leaves space above and to the left of a shape.
     * The shapes are not scaled.
     */
    readonly transformation?: {
        readonly width: number;
        readonly height: number;
    };
    /** The canvas's background. Default is none */
    readonly fill?: ShapeFill;
    /** The canvas's outline. Default is none */
    readonly line?: ShapeLine;
    /**
     * Places the shapes, pictures and groups that have no `offset`: in levels along their connectors like a flowchart,
     * as a tree like an org chart, or in a grid
     */
    readonly layout?: ShapeLayout;
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
 * The shapes are positioned with `transformation.offset`, in pixels from the canvas's top-left corner, or by a `layout`.
 *
 * Applications that can't draw canvases, such as Apple Pages, draw the same shapes as a group instead: the canvas is
 * written in `mc:AlternateContent`, with the group as its fallback.
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

        // Canvas coordinates start at its top-left corner, and Word cuts off anything outside the canvas, so everything
        // that is drawn, including lines, arrowheads and effects, is moved onto it
        const { children, reach } = layoutShapeDrawing(options.children, { keepPositive: true, layout: options.layout });
        const emus = options.transformation
            ? {
                  x: Math.round(options.transformation.width * EMUS_PER_PIXEL),
                  y: Math.round(options.transformation.height * EMUS_PER_PIXEL),
              }
            : { x: Math.ceil(reach.right), y: Math.ceil(reach.bottom) };

        const transformation = { pixels: { x: Math.round(emus.x / EMUS_PER_PIXEL), y: Math.round(emus.y / EMUS_PER_PIXEL) }, emus };
        const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;
        const drawingOptions = {
            floating: options.floating,
            docProperties: options.altText,
            link: options.link,
            decorative: options.decorative,
        };

        const canvas = new Drawing(
            {
                type: "graphic",
                uri: CANVAS_URI,
                transformation,
                content: createWpcCanvas({
                    children: children.map((child) => createShapeDrawingChild(child, "wpg:wgp")),
                    fill: options.fill,
                    line: options.line,
                }),
            },
            // Only the canvas's own outline reaches past its edges
            { ...drawingOptions, effectExtent: createUniformEffectExtent(lineOverhang) },
        );

        // Applications that can't draw canvases, such as Apple Pages, draw the same diagram as a group. It is laid out
        // again so its shapes have ids of their own, and a rectangle behind them draws the canvas's background and outline
        const fallback = layoutShapeDrawing(options.children, { keepPositive: true, layout: options.layout });
        const backgroundId = docPropertiesUniqueNumericId();
        const background: ShapeDrawingChildMediaData = {
            type: "wps",
            transformation: { offset: { pixels: { x: 0, y: 0 }, emus: { x: 0, y: 0 } }, ...transformation },
            data: {
                geometry: { type: "rectangle" },
                fill: options.fill,
                line: options.line ?? "none",
                nonVisualDrawingProperties: { id: backgroundId, name: `Canvas ${backgroundId}` },
            },
        };
        const groupReach = {
            left: Math.min(-lineOverhang, fallback.reach.left),
            top: Math.min(-lineOverhang, fallback.reach.top),
            right: Math.max(emus.x + lineOverhang, fallback.reach.right),
            bottom: Math.max(emus.y + lineOverhang, fallback.reach.bottom),
        };
        const group = new Drawing(
            {
                type: "graphic",
                uri: GROUP_URI,
                transformation,
                content: createShapeGroup({
                    transformation,
                    childOffset: { x: 0, y: 0 },
                    childExtent: emus,
                    children: [background, ...fallback.children].map((child) => createShapeDrawingChild(child, "wpg:grpSp")),
                }),
            },
            {
                ...drawingOptions,
                effectExtent: getGroupEffectExtent({ reach: groupReach }, { x: 0, y: 0 }, emus, { width: emus.x, height: emus.y }),
            },
        );

        this.root.push(createAlternateContent({ requires: "wpc", choice: canvas, fallback: group }));
    }
}
