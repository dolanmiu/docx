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
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { DrawingLinkOptions } from "@file/drawing/doc-properties/non-visual-drawing-properties";

import { type IShapeGroupChildOptions, getGroupEffectExtent, layoutShapeDrawing } from "./shape-drawing";
import { createTransformation } from "./wps-shape-run";
import { Drawing, type IFloating } from "../../drawing";
import type { IMediaDataTransformation, IMediaTransformation } from "../../media";
import { Run } from "../run";

export type { IShapeGroupChildOptions, IShapeNestedGroupOptions, IShapePictureOptions } from "./shape-drawing";

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

        const layout = layoutShapeDrawing(options.children);
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

        this.root.push(
            new Drawing(
                { type: "wpg", transformation: groupTransformation, children, childOffset, childExtent },
                {
                    floating: options.floating,
                    docProperties: options.altText,
                    link: options.link,
                    decorative: options.decorative,
                    // Lines, effects and rotated shapes can reach past the group's box
                    effectExtent: getGroupEffectExtent(layout, childOffset, childExtent, {
                        width: groupTransformation.emus.x,
                        height: groupTransformation.emus.y,
                        rotation: options.transformation?.rotation,
                        flip: options.transformation?.flip,
                    }),
                },
            ),
        );
    }
}
