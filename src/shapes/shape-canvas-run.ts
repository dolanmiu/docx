/**
 * Shape canvas run module for WordprocessingML documents.
 *
 * This module provides support for drawing canvases: areas of a document that hold shapes,
 * where connectors stay attached to the shapes they join when the shapes are moved.
 *
 * @module
 */
import {
    type DocPropertiesOptions,
    Drawing,
    type DrawingLinkOptions,
    type IFloating,
    Run,
    type XmlComponent,
    docPropertiesUniqueNumericId,
} from "docx";

import { createAlternateContent } from "./drawing/alternate-content";
import { CANVAS_URI, GROUP_URI, type ShapeDrawingChildMediaData, createShapeDrawingChild } from "./drawing/shape-drawing-child";
import { createShapeGroup } from "./drawing/shape-group";
import { createStyledDrawing } from "./drawing/styled-drawing";
import { createWpcCanvas } from "./drawing/wpc-canvas";
import { type ShapeFill, type ShapeLine, getShapeLineOverhang } from "./preset-shape";
import { describeDrawing } from "./shape-description";
import {
    type IShapeGroupChildOptions,
    createShapeDrawingNodes,
    drawingStyledParagraphs,
    getGroupEffectExtent,
    layoutShapeDrawing,
} from "./shape-drawing";
import type { ShapeLayout } from "./shape-layout";
import { createDrawingProperties, createUniformEffectExtent } from "./shape-run-data";
import type { TextStyles } from "./shape-text-styles";

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
    /**
     * Whether to write the same diagram as a group too, for applications that can't draw canvases, such as Apple Pages.
     * Default is `true`. Without it, the canvas takes up half as much of the document, and those applications draw nothing
     */
    readonly fallback?: boolean;
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
 * written in `mc:AlternateContent`, with the group as its fallback, unless `fallback` is `false`.
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

        // Drawing ids, in the order they are written: the canvas's shapes, the canvas, then the fallback's shapes, its
        // background and the group
        // Without a description of its own, the canvas is described from its shapes' text and connectors
        const altText = describeDrawing(options);
        const canvasNodes = createShapeDrawingNodes(options.children, options.layout);
        const canvasOptions = createDrawingProperties({ ...options, altText });
        const fallback =
            options.fallback === false
                ? undefined
                : {
                      nodes: createShapeDrawingNodes(options.children, options.layout),
                      backgroundId: docPropertiesUniqueNumericId(),
                      options: createDrawingProperties({ ...options, altText }),
                  };

        const create = (styles: TextStyles): XmlComponent => {
            // Canvas coordinates start at its top-left corner, and Word cuts off anything outside the canvas, so everything
            // that is drawn, including lines, arrowheads and effects, is moved onto it
            const { children, reach } = layoutShapeDrawing(canvasNodes, { keepPositive: true, layout: options.layout, styles });
            const emus = options.transformation
                ? {
                      x: Math.round(options.transformation.width * EMUS_PER_PIXEL),
                      y: Math.round(options.transformation.height * EMUS_PER_PIXEL),
                  }
                : { x: Math.ceil(reach.right), y: Math.ceil(reach.bottom) };

            const transformation = { pixels: { x: Math.round(emus.x / EMUS_PER_PIXEL), y: Math.round(emus.y / EMUS_PER_PIXEL) }, emus };
            const lineOverhang = options.line ? getShapeLineOverhang(options.line) : 0;

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
                { ...canvasOptions, effectExtent: createUniformEffectExtent(lineOverhang) },
            );

            if (!fallback) {
                return canvas;
            }

            // Applications that can't draw canvases, such as Apple Pages, draw the same diagram as a group. Its shapes
            // have ids of their own, and a rectangle behind them draws the canvas's background and outline
            const { backgroundId } = fallback;
            const group = layoutShapeDrawing(fallback.nodes, { keepPositive: true, layout: options.layout, styles });
            const background: ShapeDrawingChildMediaData = {
                type: "wps",
                transformation: { offset: { pixels: { x: 0, y: 0 }, emus: { x: 0, y: 0 } }, ...transformation },
                data: {
                    geometry: { type: "rectangle" },
                    fill: options.fill,
                    line: options.line ?? "none",
                    // Screen readers skip it: it is only the canvas's background
                    nonVisualDrawingProperties: { id: backgroundId, name: `Canvas ${backgroundId}`, decorative: true },
                },
            };
            const groupReach = {
                left: Math.min(-lineOverhang, group.reach.left),
                top: Math.min(-lineOverhang, group.reach.top),
                right: Math.max(emus.x + lineOverhang, group.reach.right),
                bottom: Math.max(emus.y + lineOverhang, group.reach.bottom),
            };
            const groupDrawing = new Drawing(
                {
                    type: "graphic",
                    uri: GROUP_URI,
                    transformation,
                    content: createShapeGroup({
                        transformation,
                        childOffset: { x: 0, y: 0 },
                        childExtent: emus,
                        children: [background, ...group.children].map((child) => createShapeDrawingChild(child, "wpg:grpSp")),
                    }),
                },
                {
                    ...fallback.options,
                    effectExtent: getGroupEffectExtent({ reach: groupReach }, { x: 0, y: 0 }, emus, { width: emus.x, height: emus.y }),
                },
            );

            return createAlternateContent({ requires: "wpc", choice: canvas, fallback: groupDrawing });
        };

        // A canvas whose shapes fit their text is laid out in the document's styles when it is written
        this.root.push(createStyledDrawing(create, drawingStyledParagraphs(options.children, options.layout)));
    }
}
