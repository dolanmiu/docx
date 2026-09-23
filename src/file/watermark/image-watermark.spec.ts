import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { Paragraph } from "@file/paragraph";
import type { IContext } from "@file/xml-components";

import { ImageWatermark } from "./image-watermark";

const createContext = (addImage = vi.fn()): IContext => ({
    file: {
        Media: {
            addImage,
        },
    } as unknown as File,
    viewWrapper: {} as unknown as IViewWrapper,
    stack: [],
});

type ShapeAttributes = Readonly<Record<string, string | number>>;

// Digs the v:shape attributes and children out of the formatted run.
const getShape = (watermark: ImageWatermark): { readonly attributes: ShapeAttributes; readonly children: readonly unknown[] } => {
    const tree = new Formatter().format(watermark, createContext());
    const [, shape] = tree["w:r"][0]["w:pict"];
    const [attributes, ...children] = shape["v:shape"];

    return { attributes: attributes._attr, children };
};

describe("ImageWatermark", () => {
    describe("#constructor()", () => {
        it("should produce the same markup as Word for a washed out picture watermark", () => {
            const tree = new Formatter().format(
                new ImageWatermark({
                    type: "png",
                    data: Buffer.from("logo"),
                    transformation: { width: 400, height: 200 },
                    title: "logo",
                }),
                createContext(),
            );

            expect(tree).toStrictEqual({
                "w:r": [
                    {
                        "w:pict": [
                            {
                                "v:shapetype": expect.arrayContaining([
                                    { _attr: expect.objectContaining({ id: "_x0000_t75", "o:spt": 75 }) },
                                ]),
                            },
                            {
                                "v:shape": [
                                    {
                                        _attr: {
                                            id: expect.stringMatching(/^WordPictureWatermark/),
                                            type: "#_x0000_t75",
                                            style: "position:absolute;margin-left:0;margin-top:0;width:300pt;height:150pt;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin",
                                            "o:allowincell": "f",
                                        },
                                    },
                                    {
                                        "v:imagedata": {
                                            _attr: {
                                                "r:id": expect.stringMatching(/^rId\{[0-9a-f]+\.png\}$/),
                                                "o:title": "logo",
                                                gain: "19661f",
                                                blacklevel: "22938f",
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
        });

        it("should give each watermark a unique id", () => {
            const options = { type: "png", data: Buffer.from("logo"), transformation: { width: 100, height: 100 } } as const;
            const first = getShape(new ImageWatermark(options));
            const second = getShape(new ImageWatermark(options));

            expect(first.attributes.id).not.toBe(second.attributes.id);
        });

        it("should not apply the washout adjustments when washout is disabled", () => {
            const { children } = getShape(
                new ImageWatermark({ type: "jpg", data: Buffer.from("logo"), transformation: { width: 100, height: 100 }, washout: false }),
            );

            expect(children[0]).toStrictEqual({
                "v:imagedata": { _attr: { "r:id": expect.stringMatching(/^rId\{[0-9a-f]+\.jpg\}$/) } },
            });
        });

        it("should convert the pixel size to points", () => {
            const { attributes } = getShape(
                new ImageWatermark({ type: "gif", data: Buffer.from("logo"), transformation: { width: 33, height: 66 } }),
            );

            expect(attributes.style).toContain("width:24.75pt;height:49.5pt;");
        });

        it("should be usable as a paragraph child", () => {
            const tree = new Formatter().format(
                new Paragraph({
                    children: [new ImageWatermark({ type: "bmp", data: Buffer.from("logo"), transformation: { width: 10, height: 10 } })],
                }),
                createContext(),
            );

            expect(tree["w:p"]).toHaveLength(1);
            expect(tree["w:p"][0]).toHaveProperty("w:r");
        });
    });

    describe("#prepForXml()", () => {
        it("should register the image with the document media using a hashed file name", () => {
            const addImage = vi.fn();
            const data = Buffer.from("logo");

            new Formatter().format(
                new ImageWatermark({ type: "png", data, transformation: { width: 400, height: 200 } }),
                createContext(addImage),
            );

            expect(addImage).toHaveBeenCalledTimes(1);
            expect(addImage).toHaveBeenCalledWith(
                expect.stringMatching(/^[0-9a-f]+\.png$/),
                expect.objectContaining({
                    type: "png",
                    data,
                    fileName: expect.stringMatching(/^[0-9a-f]+\.png$/),
                    transformation: {
                        pixels: { x: 400, y: 200 },
                        emus: { x: 3810000, y: 1905000 },
                    },
                }),
            );
        });

        it("should decode base64 data URIs before registering them", () => {
            const addImage = vi.fn();

            new Formatter().format(
                new ImageWatermark({
                    type: "png",
                    data: "data:image/png;base64,bG9nbw==",
                    transformation: { width: 10, height: 10 },
                }),
                createContext(addImage),
            );

            expect(addImage).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ data: expect.any(Uint8Array) }));
        });
    });
});
