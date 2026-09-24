import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createShapeGroup } from "./shape-group";

describe("createShapeGroup", () => {
    it("should map the children's coordinate space onto the group's own size by default", () => {
        const tree = new Formatter().format(
            createShapeGroup({ children: [], transformation: { pixels: { x: 100, y: 50 }, emus: { x: 952500, y: 476250 } } }),
        );

        expect(tree).to.deep.equal({
            "wpg:wgp": [
                { "wpg:cNvGrpSpPr": {} },
                {
                    "wpg:grpSpPr": [
                        {
                            "a:xfrm": [
                                { _attr: {} },
                                { "a:off": { _attr: { x: 0, y: 0 } } },
                                { "a:ext": { _attr: { cx: 952500, cy: 476250 } } },
                                { "a:chOff": { _attr: { x: 0, y: 0 } } },
                                { "a:chExt": { _attr: { cx: 952500, cy: 476250 } } },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("should write the children's coordinate space, rotation and flip", () => {
        const tree = new Formatter().format(
            createShapeGroup({
                children: [],
                transformation: {
                    pixels: { x: 100, y: 50 },
                    emus: { x: 952500, y: 476250 },
                    rotation: 5400000,
                    flip: { horizontal: true },
                },
                childOffset: { x: -9525, y: 19050 },
                childExtent: { x: 1905000, y: 952500 },
            }),
        );

        expect(tree["wpg:wgp"][1]["wpg:grpSpPr"][0]).to.deep.equal({
            "a:xfrm": [
                { _attr: { flipH: true, rot: 5400000 } },
                { "a:off": { _attr: { x: 0, y: 0 } } },
                { "a:ext": { _attr: { cx: 952500, cy: 476250 } } },
                { "a:chOff": { _attr: { x: -9525, y: 19050 } } },
                { "a:chExt": { _attr: { cx: 1905000, cy: 952500 } } },
            ],
        });
    });
});

describe("createShapeGroup inside a group", () => {
    it("should write a group inside a group as wpg:grpSp, with its id and name first", () => {
        const tree = new Formatter().format(
            createShapeGroup({
                name: "wpg:grpSp",
                nonVisualDrawingProperties: { id: 4, name: "Group 4" },
                children: [],
                transformation: { pixels: { x: 10, y: 10 }, emus: { x: 95250, y: 95250 } },
            }),
        );

        expect(Object.keys(tree)).to.deep.equal(["wpg:grpSp"]);
        expect(tree["wpg:grpSp"].slice(0, 2)).to.deep.equal([
            { "wpg:cNvPr": { _attr: { id: 4, name: "Group 4" } } },
            { "wpg:cNvGrpSpPr": {} },
        ]);
    });
});
