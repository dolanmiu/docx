import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";
import { BuilderElement } from "docx";

import { createPresetGeometry, createSourceRectangle, createTextBox, createTransform } from "./drawing-parts";

describe("createPresetGeometry", () => {
    it("should default to a rectangle with no adjustments", () => {
        expect(new Formatter().format(createPresetGeometry())).to.deep.equal({
            "a:prstGeom": [{ _attr: { prst: "rect" } }, { "a:avLst": {} }],
        });
    });

    it("should write the preset and its adjustments as shape guides, rounding the values", () => {
        expect(new Formatter().format(createPresetGeometry("rightArrow", { adj1: 50000, adj2: 33333.4 }))).to.deep.equal({
            "a:prstGeom": [
                { _attr: { prst: "rightArrow" } },
                {
                    "a:avLst": [
                        { "a:gd": { _attr: { name: "adj1", fmla: "val 50000" } } },
                        { "a:gd": { _attr: { name: "adj2", fmla: "val 33333" } } },
                    ],
                },
            ],
        });
    });
});

describe("createSourceRectangle", () => {
    it("should show the whole picture without a crop", () => {
        expect(new Formatter().format(createSourceRectangle())).to.deep.equal({ "a:srcRect": {} });
    });

    it("should write the crop in thousandths of a percent, leaving out the sides that aren't cropped", () => {
        expect(new Formatter().format(createSourceRectangle({ left: 10, bottom: 2.5 }))).to.deep.equal({
            "a:srcRect": { _attr: { l: 10000, b: 2500 } },
        });
    });
});

describe("createTransform", () => {
    it("should write the offset and size, with the rotation and flip, then any other children", () => {
        const tree = new Formatter().format(
            createTransform(
                {
                    pixels: { x: 10, y: 20 },
                    emus: { x: 95250, y: 190500 },
                    offset: { pixels: { x: 1, y: 2 }, emus: { x: 9525, y: 19050 } },
                    rotation: 5400000,
                    flip: { vertical: true },
                },
                [new BuilderElement({ name: "a:chOff" })],
            ),
        );
        expect(tree).to.deep.equal({
            "a:xfrm": [
                { _attr: { flipV: true, rot: 5400000 } },
                { "a:off": { _attr: { x: 9525, y: 19050 } } },
                { "a:ext": { _attr: { cx: 95250, cy: 190500 } } },
                { "a:chOff": {} },
            ],
        });
    });

    it("should put a shape without an offset at 0,0", () => {
        const tree = new Formatter().format(createTransform({ pixels: { x: 10, y: 20 }, emus: { x: 95250, y: 190500 } }));
        expect(tree["a:xfrm"][1]).to.deep.equal({ "a:off": { _attr: { x: 0, y: 0 } } });
    });
});

describe("createTextBox", () => {
    it("should put the paragraphs in w:txbxContent", () => {
        expect(new Formatter().format(createTextBox([]))).to.deep.equal({ "wps:txbx": [{ "w:txbxContent": {} }] });
    });
});
