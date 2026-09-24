/**
 * WordArt shape type preset.
 *
 * Word renders text watermarks as WordArt: a "plain text" preset shape (type 136)
 * whose text path stretches the text to fill the shape's bounding box. This module
 * reproduces the shape type definition that Word itself writes, so that Word,
 * LibreOffice and other consumers recognize the shape.
 *
 * @module
 */
import type { XmlComponent } from "docx";

import { createVmlFormulas } from "./vml-formulas";
import { createVmlHandles } from "./vml-handles";
import { createVmlLock } from "./vml-lock";
import { createVmlPath } from "./vml-path";
import { createVmlShapeType } from "./vml-shape-type";
import { createVmlTextPath } from "./vml-text-path";

/** Identifier of the WordArt (plain text) shape type. Shapes reference it as `#_x0000_t136`. */
export const WORD_ART_SHAPE_TYPE_ID = "_x0000_t136";

/** Office preset shape number for plain WordArt text. */
const WORD_ART_PRESET_SHAPE_TYPE = 136;

/**
 * Creates the WordArt (plain text) shape type as emitted by Microsoft Word.
 *
 * The resulting shape type has the identifier `_x0000_t136`. Shapes using it must
 * set `type: "#_x0000_t136"` and supply a `v:textpath` child carrying the text.
 *
 * @returns An XmlComponent representing the v:shapetype element
 *
 * @example
 * ```typescript
 * createPict({
 *   children: [
 *     createWordArtShapeType(),
 *     createVmlShape({
 *       id: "watermark",
 *       type: `#${WORD_ART_SHAPE_TYPE_ID}`,
 *       children: [createVmlTextPath({ text: "DRAFT" })],
 *     }),
 *   ],
 * });
 * ```
 */
export const createWordArtShapeType = (): XmlComponent =>
    createVmlShapeType({
        id: WORD_ART_SHAPE_TYPE_ID,
        coordinateSize: "21600,21600",
        presetShapeType: WORD_ART_PRESET_SHAPE_TYPE,
        adjustment: "10800",
        path: "m@7,l@8,m@5,21600l@6,21600e",
        children: [
            createVmlFormulas([
                "sum #0 0 10800",
                "prod #0 2 1",
                "sum 21600 0 @1",
                "sum 0 0 @2",
                "sum 21600 0 @3",
                "if @0 @3 0",
                "if @0 21600 @1",
                "if @0 0 @2",
                "if @0 @4 21600",
                "mid @5 @6",
                "mid @8 @5",
                "mid @7 @8",
                "mid @6 @7",
                "sum @6 0 @5",
            ]),
            createVmlPath({
                textPathOk: true,
                connectType: "custom",
                connectLocations: "@9,0;@10,10800;@11,21600;@12,10800",
                connectAngles: "270,180,90,0",
            }),
            createVmlTextPath({ on: true, fitShape: true }),
            createVmlHandles([{ position: "#0,bottomRight", xRange: "6629,14971" }]),
            createVmlLock({ text: true, shapeType: true }),
        ],
    });
