import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { PICTURE_FRAME_SHAPE_TYPE_ID, createPictureFrameShapeType } from "./picture-frame-shape-type";

describe("createPictureFrameShapeType", () => {
    it("should reproduce the picture frame shape type written by Word", () => {
        const tree = new Formatter().format(createPictureFrameShapeType());

        expect(tree).toStrictEqual({
            "v:shapetype": [
                {
                    _attr: {
                        id: PICTURE_FRAME_SHAPE_TYPE_ID,
                        coordsize: "21600,21600",
                        "o:spt": 75,
                        "o:preferrelative": "t",
                        path: "m@4@5l@4@11@9@11@9@5xe",
                        filled: "f",
                        stroked: "f",
                    },
                },
                { "v:stroke": { _attr: { joinstyle: "miter" } } },
                {
                    "v:formulas": [
                        { "v:f": { _attr: { eqn: "if lineDrawn pixelLineWidth 0" } } },
                        { "v:f": { _attr: { eqn: "sum @0 1 0" } } },
                        { "v:f": { _attr: { eqn: "sum 0 0 @1" } } },
                        { "v:f": { _attr: { eqn: "prod @2 1 2" } } },
                        { "v:f": { _attr: { eqn: "prod @3 21600 pixelWidth" } } },
                        { "v:f": { _attr: { eqn: "prod @3 21600 pixelHeight" } } },
                        { "v:f": { _attr: { eqn: "sum @0 0 1" } } },
                        { "v:f": { _attr: { eqn: "prod @6 1 2" } } },
                        { "v:f": { _attr: { eqn: "prod @7 21600 pixelWidth" } } },
                        { "v:f": { _attr: { eqn: "sum @8 21600 0" } } },
                        { "v:f": { _attr: { eqn: "prod @7 21600 pixelHeight" } } },
                        { "v:f": { _attr: { eqn: "sum @10 21600 0" } } },
                    ],
                },
                { "v:path": { _attr: { gradientshapeok: "t", "o:extrusionok": "f", "o:connecttype": "rect" } } },
                { "o:lock": { _attr: { "v:ext": "edit", aspectratio: "t" } } },
            ],
        });
    });

    it("should expose the shape type id used by shapes", () => {
        expect(PICTURE_FRAME_SHAPE_TYPE_ID).toBe("_x0000_t75");
    });
});
