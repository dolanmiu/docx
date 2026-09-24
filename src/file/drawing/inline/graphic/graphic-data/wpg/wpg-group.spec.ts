import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createWpgGroup } from "./wpg-group";

describe("createWpgGroup", () => {
    it("should map the children's coordinate space onto the group's own size by default", () => {
        const tree = new Formatter().format(
            createWpgGroup({ children: [], transformation: { pixels: { x: 100, y: 50 }, emus: { x: 952500, y: 476250 } } }),
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
            createWpgGroup({
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
