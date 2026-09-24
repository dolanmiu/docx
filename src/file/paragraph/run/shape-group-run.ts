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
import { getShapeLineOverhang } from "@file/drawing/inline/graphic/graphic-data/wps/preset-shape";
import { docPropertiesUniqueNumericId } from "@util/convenience-functions";

import { type ShapeBaseOptions, type WithPresetShape, createPresetShapeData, createUniformEffectExtent } from "./shape-run-data";
import { createTransformation } from "./wps-shape-run";
import { Drawing, type IFloating } from "../../drawing";
import type { IMediaDataTransformation, IMediaTransformation, WpsMediaData } from "../../media";
import { Run } from "../run";

/**
 * A shape inside a group. `transformation.offset` positions it, in pixels,
 * relative to the other shapes in the group.
 *
 * @see {@link ShapeGroupRun}
 * @publicApi
 */
export type IShapeGroupChildOptions = WithPresetShape<ShapeBaseOptions>;

/**
 * Options for creating a group of shapes.
 *
 * @see {@link ShapeGroupRun}
 * @publicApi
 */
export type IShapeGroupOptions = {
    /** The shapes in the group */
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
 * Reference: http://officeopenxml.com/drwSp-group.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ShapeGroupRun({
 *   children: [
 *     { type: "rect", transformation: { width: 120, height: 48 }, fill: "4472C4" },
 *     { type: "straightConnector1", transformation: { offset: { left: 120, top: 24 }, width: 40, height: 0 }, line: { endArrow: "triangle" } },
 *     { type: "ellipse", transformation: { offset: { left: 160 }, width: 120, height: 48 }, fill: "ED7D31" },
 *   ],
 * });
 * ```
 */
export class ShapeGroupRun extends Run {
    public constructor(options: IShapeGroupOptions) {
        super({});

        if (options.children.length === 0) {
            throw new Error("Invalid shape group. Expected at least 1 child shape");
        }

        const children = options.children.map((child): WpsMediaData => ({
            type: "wps",
            transformation: createTransformation(child.transformation),
            data: {
                ...createPresetShapeData(child),
                // Shapes inside a group identify themselves with wps:cNvPr, which needs a unique id
                nonVisualDrawingProperties: {
                    id: docPropertiesUniqueNumericId(),
                    name: child.altText?.name ?? "",
                    description: child.altText?.description,
                    title: child.altText?.title,
                },
            },
        }));

        // The children's coordinate space is the box around them, in EMUs
        const boxes = options.children.map(({ transformation }) => {
            const x = Math.round((transformation.offset?.left ?? 0) * EMUS_PER_PIXEL);
            const y = Math.round((transformation.offset?.top ?? 0) * EMUS_PER_PIXEL);
            return {
                left: x,
                top: y,
                right: x + Math.round(transformation.width * EMUS_PER_PIXEL),
                bottom: y + Math.round(transformation.height * EMUS_PER_PIXEL),
            };
        });
        const left = Math.min(...boxes.map((box) => box.left));
        const top = Math.min(...boxes.map((box) => box.top));
        const childExtent = {
            x: Math.max(...boxes.map((box) => box.right)) - left,
            y: Math.max(...boxes.map((box) => box.bottom)) - top,
        };

        const groupTransformation: IMediaDataTransformation = options.transformation
            ? createTransformation({ ...options.transformation, offset: undefined })
            : {
                  pixels: { x: Math.round(childExtent.x / EMUS_PER_PIXEL), y: Math.round(childExtent.y / EMUS_PER_PIXEL) },
                  emus: childExtent,
              };

        this.root.push(
            new Drawing(
                { type: "wpg", transformation: groupTransformation, children, childOffset: { x: left, y: top }, childExtent },
                {
                    floating: options.floating,
                    docProperties: options.altText,
                    effectExtent: createUniformEffectExtent(Math.max(...options.children.map((child) => getShapeLineOverhang(child.line)))),
                },
            ),
        );
    }
}
