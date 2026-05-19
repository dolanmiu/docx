import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { ShadingType, createShading } from "./shading";

describe("Shading", () => {
    describe("#createShading", () => {
        it("should create", () => {
            const shading = createShading({});
            const tree = new Formatter().format(shading);
            expect(tree).to.deep.equal({
                "w:shd": {
                    _attr: {},
                },
            });
        });

        it("should create with params", () => {
            const shading = createShading({ type: ShadingType.PERCENT_40, color: "FF0000", fill: "555555" });
            const tree = new Formatter().format(shading);
            expect(tree).to.deep.equal({
                "w:shd": {
                    _attr: {
                        "w:color": "FF0000",
                        "w:fill": "555555",
                        "w:val": "pct40",
                    },
                },
            });
        });
    });
});
