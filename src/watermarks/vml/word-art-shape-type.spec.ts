import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { WORD_ART_SHAPE_TYPE_ID, createWordArtShapeType } from "./word-art-shape-type";

describe("createWordArtShapeType", () => {
    it("should reproduce the plain text WordArt shape type written by Word", () => {
        const tree = new Formatter().format(createWordArtShapeType());

        expect(tree).toStrictEqual({
            "v:shapetype": [
                {
                    _attr: {
                        id: WORD_ART_SHAPE_TYPE_ID,
                        coordsize: "21600,21600",
                        "o:spt": 136,
                        adj: "10800",
                        path: "m@7,l@8,m@5,21600l@6,21600e",
                    },
                },
                {
                    "v:formulas": [
                        { "v:f": { _attr: { eqn: "sum #0 0 10800" } } },
                        { "v:f": { _attr: { eqn: "prod #0 2 1" } } },
                        { "v:f": { _attr: { eqn: "sum 21600 0 @1" } } },
                        { "v:f": { _attr: { eqn: "sum 0 0 @2" } } },
                        { "v:f": { _attr: { eqn: "sum 21600 0 @3" } } },
                        { "v:f": { _attr: { eqn: "if @0 @3 0" } } },
                        { "v:f": { _attr: { eqn: "if @0 21600 @1" } } },
                        { "v:f": { _attr: { eqn: "if @0 0 @2" } } },
                        { "v:f": { _attr: { eqn: "if @0 @4 21600" } } },
                        { "v:f": { _attr: { eqn: "mid @5 @6" } } },
                        { "v:f": { _attr: { eqn: "mid @8 @5" } } },
                        { "v:f": { _attr: { eqn: "mid @7 @8" } } },
                        { "v:f": { _attr: { eqn: "mid @6 @7" } } },
                        { "v:f": { _attr: { eqn: "sum @6 0 @5" } } },
                    ],
                },
                {
                    "v:path": {
                        _attr: {
                            textpathok: "t",
                            "o:connecttype": "custom",
                            "o:connectlocs": "@9,0;@10,10800;@11,21600;@12,10800",
                            "o:connectangles": "270,180,90,0",
                        },
                    },
                },
                { "v:textpath": { _attr: { on: "t", fitshape: "t" } } },
                { "v:handles": [{ "v:h": { _attr: { position: "#0,bottomRight", xrange: "6629,14971" } } }] },
                { "o:lock": { _attr: { "v:ext": "edit", text: "t", shapetype: "t" } } },
            ],
        });
    });

    it("should expose the shape type id used by shapes", () => {
        expect(WORD_ART_SHAPE_TYPE_ID).toBe("_x0000_t136");
    });
});
