import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createVmlImageData } from "./vml-image-data";

describe("createVmlImageData", () => {
    it("should create empty image data when no options are given", () => {
        const tree = new Formatter().format(createVmlImageData());

        expect(tree).toStrictEqual({ "v:imagedata": { _attr: {} } });
    });

    it("should write the washout adjustments in fixed-point notation", () => {
        const tree = new Formatter().format(createVmlImageData({ relationshipId: "rId1", title: "logo", gain: 0.3, blackLevel: 0.35 }));

        expect(tree).toStrictEqual({
            "v:imagedata": { _attr: { "r:id": "rId1", "o:title": "logo", gain: "19661f", blacklevel: "22938f" } },
        });
    });

    it("should emit every attribute using the VML attribute names", () => {
        const tree = new Formatter().format(
            createVmlImageData({
                relationshipId: "rId2",
                title: "photo",
                gain: 1,
                blackLevel: 0,
                gamma: 0.5,
                grayscale: true,
                biLevel: false,
                chromaKey: "white",
            }),
        );

        expect(tree).toStrictEqual({
            "v:imagedata": {
                _attr: {
                    "r:id": "rId2",
                    "o:title": "photo",
                    gain: "65536f",
                    blacklevel: "0f",
                    gamma: "32768f",
                    grayscale: "t",
                    bilevel: "f",
                    chromakey: "white",
                },
            },
        });
    });
});
