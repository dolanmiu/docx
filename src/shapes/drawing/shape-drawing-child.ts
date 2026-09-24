/**
 * Writes the shapes, pictures and groups inside a ShapeGroupRun or ShapeCanvasRun.
 *
 * @module
 */
import type { IMediaDataTransformation, XmlComponent } from "docx";

import { createShapeGroup } from "./shape-group";
import { type ShapePictureCoreOptions, createShapePicture } from "../picture/shape-picture";
import { type PresetShapeCoreOptions, type PresetShapeNonVisualProperties, createPresetShape } from "../preset-shape/preset-shape";

/** The `a:graphicData` URI of a shape (`wps:wsp`) */
export const SHAPE_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingShape";
/** The `a:graphicData` URI of a group (`wpg:wgp`) */
export const GROUP_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup";
/** The `a:graphicData` URI of a drawing canvas (`wpc:wpc`) */
export const CANVAS_URI = "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas";

/**
 * A shape in a ShapeGroupRun or ShapeCanvasRun, written as `wps:wsp`.
 */
export type ShapeMediaData = {
    readonly type: "wps";
    readonly transformation: IMediaDataTransformation;
    readonly data: PresetShapeCoreOptions;
};

/**
 * A picture in a ShapeGroupRun or ShapeCanvasRun, written as `pic:pic`.
 */
export type ShapePictureMediaData = {
    readonly type: "picture";
    readonly transformation: IMediaDataTransformation;
    readonly data: ShapePictureCoreOptions;
};

/**
 * A group inside a ShapeGroupRun or ShapeCanvasRun, written as `wpg:grpSp` in a group or `wpg:wgp` on a canvas.
 */
export type ShapeNestedGroupMediaData = {
    readonly type: "group";
    readonly transformation: IMediaDataTransformation;
    /** Top-left corner (in EMUs) of the coordinate space the children are positioned in */
    readonly childOffset: {
        readonly x: number;
        readonly y: number;
    };
    /** Size (in EMUs) of the coordinate space the children are positioned in */
    readonly childExtent: {
        readonly x: number;
        readonly y: number;
    };
    readonly children: readonly ShapeDrawingChildMediaData[];
    readonly nonVisualDrawingProperties: PresetShapeNonVisualProperties;
};

/**
 * A shape, picture or group in a ShapeGroupRun or ShapeCanvasRun.
 */
export type ShapeDrawingChildMediaData = ShapeMediaData | ShapePictureMediaData | ShapeNestedGroupMediaData;

/**
 * Creates the element for a shape (`wps:wsp`), picture (`pic:pic`) or group in a drawing.
 *
 * @param groupName - The element for a group: `wpg:wgp` on a canvas, and `wpg:grpSp` inside another group
 */
export const createShapeDrawingChild = (child: ShapeDrawingChildMediaData, groupName: "wpg:wgp" | "wpg:grpSp"): XmlComponent => {
    switch (child.type) {
        case "wps":
            return createPresetShape({ ...child.data, transformation: child.transformation });
        case "picture":
            return createShapePicture({ ...child.data, transformation: child.transformation });
        default:
            return createShapeGroup({
                name: groupName,
                nonVisualDrawingProperties: child.nonVisualDrawingProperties,
                transformation: child.transformation,
                childOffset: child.childOffset,
                childExtent: child.childExtent,
                children: child.children.map((grandchild) => createShapeDrawingChild(grandchild, "wpg:grpSp")),
            });
    }
};
