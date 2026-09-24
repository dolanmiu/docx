/**
 * Picture frame shape type preset.
 *
 * Word renders legacy pictures, including picture watermarks, as a "picture frame"
 * preset shape (type 75) carrying a `v:imagedata` child. This module reproduces the
 * shape type definition that Word itself writes.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createVmlFormulas } from "./vml-formulas";
import { createVmlLock } from "./vml-lock";
import { createVmlPath } from "./vml-path";
import { createVmlShapeType } from "./vml-shape-type";
import { createVmlStroke } from "./vml-stroke";

/** Identifier of the picture frame shape type. Shapes reference it as `#_x0000_t75`. */
export const PICTURE_FRAME_SHAPE_TYPE_ID = "_x0000_t75";

/** Office preset shape number for a picture frame. */
const PICTURE_FRAME_PRESET_SHAPE_TYPE = 75;

/**
 * Creates the picture frame shape type as emitted by Microsoft Word.
 *
 * The resulting shape type has the identifier `_x0000_t75`. Shapes using it must
 * set `type: "#_x0000_t75"` and supply a `v:imagedata` child referencing the image.
 *
 * @returns An XmlComponent representing the v:shapetype element
 *
 * @example
 * ```typescript
 * createPict({
 *   children: [
 *     createPictureFrameShapeType(),
 *     createVmlShape({
 *       id: "picture",
 *       type: `#${PICTURE_FRAME_SHAPE_TYPE_ID}`,
 *       children: [createVmlImageData({ relationshipId: "rId1" })],
 *     }),
 *   ],
 * });
 * ```
 */
export const createPictureFrameShapeType = (): XmlComponent =>
    createVmlShapeType({
        id: PICTURE_FRAME_SHAPE_TYPE_ID,
        coordinateSize: "21600,21600",
        presetShapeType: PICTURE_FRAME_PRESET_SHAPE_TYPE,
        preferRelative: true,
        path: "m@4@5l@4@11@9@11@9@5xe",
        filled: false,
        stroked: false,
        children: [
            createVmlStroke({ joinStyle: "miter" }),
            createVmlFormulas([
                "if lineDrawn pixelLineWidth 0",
                "sum @0 1 0",
                "sum 0 0 @1",
                "prod @2 1 2",
                "prod @3 21600 pixelWidth",
                "prod @3 21600 pixelHeight",
                "sum @0 0 1",
                "prod @6 1 2",
                "prod @7 21600 pixelWidth",
                "sum @8 21600 0",
                "prod @7 21600 pixelHeight",
                "sum @10 21600 0",
            ]),
            createVmlPath({ extrusionOk: false, gradientShapeOk: true, connectType: "rect" }),
            createVmlLock({ aspectRatio: true }),
        ],
    });
