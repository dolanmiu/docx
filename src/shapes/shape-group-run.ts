/**
 * Shape group run module for WordprocessingML documents.
 *
 * This module provides support for groups of preset shapes that are laid out,
 * moved and resized together as one drawing.
 *
 * Reference: http://officeopenxml.com/drwSp-group.php
 *
 * @module
 */
import {
    type DocPropertiesOptions,
    Drawing,
    type DrawingLinkOptions,
    type IFloating,
    type IMediaDataTransformation,
    type IMediaTransformation,
    Run,
    createTransformation,
} from "docx";

import { GROUP_URI, createShapeDrawingChild } from "./drawing/shape-drawing-child";
import { createShapeGroup } from "./drawing/shape-group";
import { createStyledDrawing } from "./drawing/styled-drawing";
import { describeDrawing } from "./shape-description";
import {
    type IShapeGroupChildOptions,
    createShapeDrawingNodes,
    drawingStyledParagraphs,
    getGroupEffectExtent,
    layoutShapeDrawing,
} from "./shape-drawing";
import type { ShapeLayout } from "./shape-layout";
import { createDrawingProperties } from "./shape-run-data";
import type { TextStyles } from "./shape-text-styles";

export type { IShapeGroupChildOptions, IShapeNestedGroupOptions, IShapePictureOptions } from "./shape-drawing";
export type { ShapeFlowLayout, ShapeGridLayout, ShapeLane, ShapeLayout, ShapeLayoutDirection, ShapeTreeLayout } from "./shape-layout";

/**
 * Options for creating a group of shapes.
 *
 * @see {@link ShapeGroupRun}
 * @publicApi
 */
export type IShapeGroupOptions = DrawingLinkOptions & {
    /** The shapes, pictures and groups in the group, and the connectors between them */
    readonly children: readonly IShapeGroupChildOptions[];
    /**
     * Size of the group in pixels, with optional rotation and flip. Defaults to the size of
     * the box around the children. A different size scales every shape in the group.
     */
    readonly transformation?: IMediaTransformation;
    /**
     * Places the shapes, pictures and groups that have no `offset`: in levels along their connectors like a flowchart,
     * as a tree like an org chart, or in a grid
     */
    readonly layout?: ShapeLayout;
    /** Floats the group on the page instead of placing it inline with text */
    readonly floating?: IFloating;
    /** Name, description and title used by screen readers */
    readonly altText?: DocPropertiesOptions;
};

const EMUS_PER_PIXEL = 9525;

/**
 * Represents a group of shapes in a WordprocessingML document.
 *
 * The shapes are positioned with `transformation.offset`, in pixels, and the group is
 * as big as the box around them. Give the group its own `transformation` to scale,
 * rotate or flip all of them together.
 *
 * Connectors are drawn between the shapes they name. Word only keeps connectors attached
 * when shapes are moved on a {@link ShapeCanvasRun}; in a group they stay where they are drawn.
 *
 * Reference: http://officeopenxml.com/drwSp-group.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ShapeGroupRun({
 *   children: [
 *     { id: "start", type: "rectangle", transformation: { width: 120, height: 48 }, fill: "4472C4" },
 *     { id: "end", type: "ellipse", transformation: { offset: { left: 160 }, width: 120, height: 48 }, fill: "ED7D31" },
 *     { type: "connector", from: "start", to: "end", line: { endArrow: "triangle" } },
 *   ],
 * });
 * ```
 */
export class ShapeGroupRun extends Run {
    public constructor(options: IShapeGroupOptions) {
        super({});

        // The children's drawing ids come before the group's
        const nodes = createShapeDrawingNodes(options.children, options.layout);
        // Without a description of its own, the group is described from its shapes' text and connectors
        const drawingOptions = createDrawingProperties({ ...options, altText: describeDrawing(options) });

        const create = (styles: TextStyles): Drawing => {
            const layout = layoutShapeDrawing(nodes, { layout: options.layout, styles });
            const { children, bounds } = layout;

            // The children's coordinate space is the box around them, in EMUs
            const childOffset = { x: Math.round(bounds.left), y: Math.round(bounds.top) };
            const childExtent = { x: Math.round(bounds.right) - childOffset.x, y: Math.round(bounds.bottom) - childOffset.y };

            const groupTransformation: IMediaDataTransformation = options.transformation
                ? createTransformation({ ...options.transformation, offset: undefined })
                : {
                      pixels: { x: Math.round(childExtent.x / EMUS_PER_PIXEL), y: Math.round(childExtent.y / EMUS_PER_PIXEL) },
                      emus: childExtent,
                  };

            return new Drawing(
                {
                    type: "graphic",
                    uri: GROUP_URI,
                    transformation: groupTransformation,
                    content: createShapeGroup({
                        transformation: groupTransformation,
                        childOffset,
                        childExtent,
                        children: children.map((child) => createShapeDrawingChild(child, "wpg:grpSp")),
                    }),
                },
                {
                    ...drawingOptions,
                    // Lines, effects and rotated shapes can reach past the group's box
                    effectExtent: getGroupEffectExtent(layout, childOffset, childExtent, {
                        width: groupTransformation.emus.x,
                        height: groupTransformation.emus.y,
                        rotation: options.transformation?.rotation,
                        flip: options.transformation?.flip,
                    }),
                },
            );
        };

        // A group whose shapes fit their text is laid out in the document's styles when it is written
        this.root.push(createStyledDrawing(create, drawingStyledParagraphs(options.children, options.layout)));
    }
}
