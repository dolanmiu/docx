// cspell:ignore DEEBF Ghvd
import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { File, IContext } from "docx";

import { createShapeFill } from "./shape-fill";

const createContext = (addImage = vi.fn()): IContext =>
    ({ file: { Media: { addImage } } as unknown as File, stack: [] }) as unknown as IContext;

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

    describe("pattern", () => {
        it("should write a black pattern on white by default, with the OOXML name of the pattern", () => {
            expect(new Formatter().format(createShapeFill({ type: "pattern", pattern: "smallCheckerBoard" }))).to.deep.equal({
                "a:pattFill": [
                    { _attr: { prst: "smCheck" } },
                    { "a:fgClr": [{ "a:srgbClr": { _attr: { val: "000000" } } }] },
                    { "a:bgClr": [{ "a:srgbClr": { _attr: { val: "FFFFFF" } } }] },
                ],
            });
        });

        it("should write the pattern and background colours", () => {
            const tree = new Formatter().format(
                createShapeFill({ type: "pattern", pattern: "percent20", color: "#1F4E79", backgroundColor: "DEEBF7" }),
            );
            expect(tree).to.deep.equal({
                "a:pattFill": [
                    { _attr: { prst: "pct20" } },
                    { "a:fgClr": [{ "a:srgbClr": { _attr: { val: "1F4E79" } } }] },
                    { "a:bgClr": [{ "a:srgbClr": { _attr: { val: "DEEBF7" } } }] },
                ],
            });
        });
    });

    describe("picture", () => {
        const image = { type: "png", data: Buffer.from("photo") } as const;

        it("should stretch the picture over the shape, turning with it, and add the picture to the document", () => {
            const addImage = vi.fn();
            const tree = new Formatter().format(createShapeFill({ type: "picture", image }), createContext(addImage));

            expect(tree).toEqual({
                "a:blipFill": [
                    { _attr: { rotWithShape: true } },
                    { "a:blip": { _attr: { "r:embed": expect.stringMatching(/^rId\{[0-9a-f]+\.png\}$/) } } },
                    { "a:srcRect": {} },
                    { "a:stretch": [{ "a:fillRect": {} }] },
                ],
            });
            expect(addImage).toHaveBeenCalledWith(
                expect.stringMatching(/^[0-9a-f]+\.png$/),
                expect.objectContaining({ type: "png", data: Buffer.from("photo") }),
            );
        });

        it("should crop the picture and make it transparent", () => {
            const tree = new Formatter().format(
                createShapeFill({ type: "picture", image, crop: { left: 10, bottom: 25 }, transparency: 40 }),
                createContext(),
            );
            expect(tree["a:blipFill"][1]["a:blip"][1]).to.deep.equal({ "a:alphaModFix": { _attr: { amt: 60000 } } });
            expect(tree["a:blipFill"][2]).to.deep.equal({ "a:srcRect": { _attr: { l: 10000, b: 25000 } } });
        });

        it("should tile the picture from the top-left corner at its own size by default", () => {
            const tree = new Formatter().format(createShapeFill({ type: "picture", image, tile: {} }), createContext());
            expect(tree["a:blipFill"][2]).to.deep.equal({ "a:srcRect": {} });
            expect(tree["a:blipFill"][3]).to.deep.equal({
                "a:tile": { _attr: { tx: 0, ty: 0, sx: 100000, sy: 100000, flip: "none", algn: "tl" } },
            });
        });

        it("should write the tile scale, alignment and mirroring, and ignore the crop", () => {
            const tree = new Formatter().format(
                createShapeFill({
                    type: "picture",
                    image,
                    tile: { scale: 50, alignment: "bottomRight", mirror: "both" },
                    crop: { left: 10 },
                }),
                createContext(),
            );
            expect(tree["a:blipFill"][2]).to.deep.equal({ "a:srcRect": {} });
            expect(tree["a:blipFill"][3]).to.deep.equal({
                "a:tile": { _attr: { tx: 0, ty: 0, sx: 50000, sy: 50000, flip: "xy", algn: "br" } },
            });
        });

        it("should reject a tile scale that isn't greater than 0", () => {
            expect(() => createShapeFill({ type: "picture", image, tile: { scale: 0 } })).to.throw("Invalid picture tile scale 0");
        });

        it("should reject a transparency outside 0 to 100", () => {
            expect(() => new Formatter().format(createShapeFill({ type: "picture", image, transparency: 101 }), createContext())).to.throw(
                "Invalid transparency 101",
            );
        });

        it("should embed an SVG picture through its fallback and add both pictures to the document", () => {
            const addImage = vi.fn();
            const tree = new Formatter().format(
                createShapeFill({
                    type: "picture",
                    image: { type: "svg", data: Buffer.from("<svg/>"), fallback: { type: "png", data: Buffer.from("fallback") } },
                }),
                createContext(addImage),
            );

            const blip = tree["a:blipFill"][1]["a:blip"];
            expect(blip[0]).toEqual({ _attr: { "r:embed": expect.stringMatching(/^rId\{[0-9a-f]+\.png\}$/) } });
            expect(blip[1]["a:extLst"][0]["a:ext"][1]["asvg:svgBlip"]._attr["r:embed"]).to.match(/^rId\{[0-9a-f]+\.svg\}$/);
            expect(addImage).toHaveBeenCalledTimes(2);
            expect(addImage).toHaveBeenCalledWith(expect.stringMatching(/\.svg$/), expect.objectContaining({ type: "svg" }));
            expect(addImage).toHaveBeenCalledWith(expect.stringMatching(/\.png$/), expect.objectContaining({ type: "png" }));
        });

        it("should read a picture given as a base64 data URI", () => {
            const addImage = vi.fn();
            new Formatter().format(
                createShapeFill({ type: "picture", image: { type: "png", data: "data:image/png;base64,cGhvdG8=" } }),
                createContext(addImage),
            );
            expect(addImage.mock.calls[0][1].data).to.deep.equal(new Uint8Array([112, 104, 111, 116, 111]));
        });
    });
});
