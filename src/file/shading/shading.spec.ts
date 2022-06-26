import { expect } from "chai";

import { Formatter } from "@export/formatter";

import { Shading, ShadingType } from "./shading";

describe("Shading", () => {
    describe("#constructor", () => {
        it("should create", () => {
            const shading = new Shading({});
            const tree = new Formatter().format(shading);
            expect(tree).to.deep.equal({
                "w:shd": {
                    _attr: {},
                },
            });
        });

        it("should create with params", () => {
            const shading = new Shading({ type: ShadingType.PERCENT_40, color: "FF0000", fill: "555555" });
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
