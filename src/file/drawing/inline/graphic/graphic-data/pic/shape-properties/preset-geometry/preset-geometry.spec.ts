import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { PresetGeometry } from "./preset-geometry";

describe("PresetGeometry", () => {
    it("should write a rectangle with no adjustments", () => {
        const tree = new Formatter().format(new PresetGeometry());
        expect(tree).to.deep.equal({
            "a:prstGeom": [{ _attr: { prst: "rect" } }, { "a:avLst": {} }],
        });
    });
});
