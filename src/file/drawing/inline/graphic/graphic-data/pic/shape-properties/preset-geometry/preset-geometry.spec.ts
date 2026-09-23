import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { PresetGeometry } from "./preset-geometry";

describe("PresetGeometry", () => {
    it("should default to a rectangle with no adjustments", () => {
        const tree = new Formatter().format(new PresetGeometry());
        expect(tree).to.deep.equal({
            "a:prstGeom": [{ _attr: { prst: "rect" } }, { "a:avLst": {} }],
        });
    });

    it("should write the preset and its adjustments as shape guides, rounding the values", () => {
        const tree = new Formatter().format(new PresetGeometry({ type: "rightArrow", adjustments: { adj1: 50000, adj2: 33333.4 } }));
        expect(tree).to.deep.equal({
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
