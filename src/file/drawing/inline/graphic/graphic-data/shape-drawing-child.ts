/**
 * Writes the shapes, pictures and groups inside a ShapeGroupRun or ShapeCanvasRun.
 *
 * @module
 */
import type { ShapeDrawingChildMediaData } from "@file/media";
import type { XmlComponent } from "@file/xml-components";

import { createWpgGroup } from "./wpg/wpg-group";
import { createShapePicture } from "./wps/picture/shape-picture";
import { createWpsShape } from "./wps/wps-shape";

/**
 * Creates the element for a shape (`wps:wsp`), picture (`pic:pic`) or group in a drawing.
 *
 * @param groupName - The element for a group: `wpg:wgp` on a canvas, and `wpg:grpSp` inside another group
 */
export const createShapeDrawingChild = (child: ShapeDrawingChildMediaData, groupName: "wpg:wgp" | "wpg:grpSp"): XmlComponent => {
    switch (child.type) {
        case "wps":
            return createWpsShape({ ...child.data, transformation: child.transformation });
        case "picture":
            return createShapePicture({ ...child.data, transformation: child.transformation });
        default:
            return createWpgGroup({
                name: groupName,
                nonVisualDrawingProperties: child.nonVisualDrawingProperties,
                transformation: child.transformation,
                childOffset: child.childOffset,
                childExtent: child.childExtent,
                children: child.children.map((grandchild) => createShapeDrawingChild(grandchild, "wpg:grpSp")),
            });
    }
};
