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

        it("should create with colors of the document's theme", () => {
            const shading = createShading({
                type: ShadingType.PERCENT_20,
                color: { theme: "dark1", lighter: 50 },
                fill: { theme: "accent1", lighter: 80 },
            });
            const tree = new Formatter().format(shading);
            expect(tree).to.deep.equal({
                "w:shd": {
                    _attr: {
                        "w:fill": "D9E2F3",
                        "w:themeFill": "accent1",
                        "w:themeFillTint": "33",
                        "w:color": "7F7F7F",
                        "w:themeColor": "dark1",
                        "w:themeTint": "80",
                        "w:val": "pct20",
                    },
                },
            });
        });
    });
});
