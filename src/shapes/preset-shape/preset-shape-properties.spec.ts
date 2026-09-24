import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createPresetShapeProperties } from "./preset-shape-properties";

describe("createPresetShapeProperties", () => {
    it("should write the transform, geometry, fill and line in schema order", () => {
        const tree = new Formatter().format(
            createPresetShapeProperties({
                transformation: { pixels: { x: 100, y: 50 }, emus: { x: 952500, y: 476250 }, rotation: 2700000, flip: { vertical: true } },
                geometry: { type: "roundedRectangle", adjustments: { cornerRadius: 25 } },
                fill: "FFC000",
                line: { color: "7F6000", width: 2 },
            }),
        );

        expect(tree).to.deep.equal({
            "wps:spPr": [
                {
                    "a:xfrm": [
                        { _attr: { flipV: true, rot: 2700000 } },
                        { "a:off": { _attr: { x: 0, y: 0 } } },
                        { "a:ext": { _attr: { cx: 952500, cy: 476250 } } },
                    ],
                },
                {
                    "a:prstGeom": [
                        { _attr: { prst: "roundRect" } },
                        { "a:avLst": [{ "a:gd": { _attr: { name: "adj", fmla: "val 25000" } } }] },
                    ],
                },
                { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FFC000" } } }] },
                { "a:ln": [{ _attr: { w: 25400 } }, { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "7F6000" } } }] }] },
            ],
        });
    });

    it("should default to no fill and a 1pt black line", () => {
        const tree = new Formatter().format(
            createPresetShapeProperties({
                transformation: { pixels: { x: 100, y: 50 }, emus: { x: 952500, y: 476250 } },
                geometry: { type: "ellipse" },
            }),
        );

        expect(tree["wps:spPr"].slice(2)).to.deep.equal([
            { "a:noFill": {} },
            { "a:ln": [{ _attr: { w: 12700 } }, { "a:solidFill": [{ "a:srgbClr": { _attr: { val: "000000" } } }] }] },
        ]);
    });
});
