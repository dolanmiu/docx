import { describe, expect, it } from "vitest";

import { Formatter } from "@export/formatter";

import { createShapeFill } from "./shape-fill";

const stops = [
    { position: 0, color: "5B9BD5" },
    { position: 100, color: "1F4E79" },
];

const gradientStopList = {
    "a:gsLst": [
        { "a:gs": [{ _attr: { pos: 0 } }, { "a:srgbClr": { _attr: { val: "5B9BD5" } } }] },
        { "a:gs": [{ _attr: { pos: 100000 } }, { "a:srgbClr": { _attr: { val: "1F4E79" } } }] },
    ],
};

describe("createShapeFill", () => {
    it("should write no fill by default", () => {
        expect(new Formatter().format(createShapeFill())).to.deep.equal({ "a:noFill": {} });
    });

    it("should write no fill for none", () => {
        expect(new Formatter().format(createShapeFill("none"))).to.deep.equal({ "a:noFill": {} });
    });

    it("should write a solid fill for a colour", () => {
        expect(new Formatter().format(createShapeFill("FF0000"))).to.deep.equal({
            "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FF0000" } } }],
        });
    });

    it("should write a solid fill with transparency", () => {
        expect(new Formatter().format(createShapeFill({ color: "FF0000", transparency: 40 }))).to.deep.equal({
            "a:solidFill": [{ "a:srgbClr": [{ _attr: { val: "FF0000" } }, { "a:alpha": { _attr: { val: 60000 } } }] }],
        });
    });

    it("should accept an explicit solid type", () => {
        expect(new Formatter().format(createShapeFill({ type: "solid", color: "FF0000" }))).to.deep.equal({
            "a:solidFill": [{ "a:srgbClr": { _attr: { val: "FF0000" } } }],
        });
    });

    describe("gradient", () => {
        it("should write a left-to-right linear gradient by default", () => {
            expect(new Formatter().format(createShapeFill({ type: "gradient", stops }))).to.deep.equal({
                "a:gradFill": [{ _attr: { rotWithShape: true } }, gradientStopList, { "a:lin": { _attr: { ang: 0 } } }],
            });
        });

        it("should write the angle in 60000ths of a degree", () => {
            const tree = new Formatter().format(createShapeFill({ type: "gradient", stops, angle: 90 }));
            expect(tree["a:gradFill"][2]).to.deep.equal({ "a:lin": { _attr: { ang: 5400000 } } });
        });

        it("should normalize the angle to 0 up to 360 degrees", () => {
            const negative = new Formatter().format(createShapeFill({ type: "gradient", stops, angle: -90 }));
            expect(negative["a:gradFill"][2]).to.deep.equal({ "a:lin": { _attr: { ang: 16200000 } } });

            const fullTurn = new Formatter().format(createShapeFill({ type: "gradient", stops, angle: 360 }));
            expect(fullTurn["a:gradFill"][2]).to.deep.equal({ "a:lin": { _attr: { ang: 0 } } });

            const almostFullTurn = new Formatter().format(createShapeFill({ type: "gradient", stops, angle: 359.9999999 }));
            expect(almostFullTurn["a:gradFill"][2]).to.deep.equal({ "a:lin": { _attr: { ang: 0 } } });
        });

        it("should write a radial gradient focused on the centre", () => {
            expect(new Formatter().format(createShapeFill({ type: "gradient", stops, path: "circle" }))).to.deep.equal({
                "a:gradFill": [
                    { _attr: { rotWithShape: true } },
                    gradientStopList,
                    {
                        "a:path": [
                            { _attr: { path: "circle" } },
                            { "a:fillToRect": { _attr: { l: 50000, t: 50000, r: 50000, b: 50000 } } },
                        ],
                    },
                ],
            });
        });

        it("should write the OOXML name of a rectangular radial gradient", () => {
            const tree = new Formatter().format(createShapeFill({ type: "gradient", stops, path: "rectangle" }));
            expect(tree["a:gradFill"][2]["a:path"][0]).to.deep.equal({ _attr: { path: "rect" } });
        });

        it("should sort the stops and write their transparency", () => {
            const tree = new Formatter().format(
                createShapeFill({
                    type: "gradient",
                    stops: [
                        { position: 100, color: "1F4E79", transparency: 50 },
                        { position: 0, color: "5B9BD5" },
                        { position: 42.5, color: "FFFFFF" },
                    ],
                }),
            );
            expect(tree["a:gradFill"][1]).to.deep.equal({
                "a:gsLst": [
                    { "a:gs": [{ _attr: { pos: 0 } }, { "a:srgbClr": { _attr: { val: "5B9BD5" } } }] },
                    { "a:gs": [{ _attr: { pos: 42500 } }, { "a:srgbClr": { _attr: { val: "FFFFFF" } } }] },
                    {
                        "a:gs": [
                            { _attr: { pos: 100000 } },
                            { "a:srgbClr": [{ _attr: { val: "1F4E79" } }, { "a:alpha": { _attr: { val: 50000 } } }] },
                        ],
                    },
                ],
            });
        });

        it("should reject fewer than two stops", () => {
            expect(() => createShapeFill({ type: "gradient", stops: [{ position: 0, color: "000000" }] })).to.throw(
                "Expected at least 2 stops, got 1",
            );
        });

        it("should reject a stop position outside 0 to 100", () => {
            expect(() =>
                createShapeFill({
                    type: "gradient",
                    stops: [
                        { position: 0, color: "000000" },
                        { position: 120, color: "FFFFFF" },
                    ],
                }),
            ).to.throw("Invalid gradient stop position 120");
        });
    });
});
