import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import type { IViewWrapper } from "@file/document-wrapper";
import type { File } from "@file/file";
import { Paragraph } from "@file/index";
import type { IMediaData } from "@file/media";

import { WpgGroupRun } from "./wpg-group-run";

describe("WpgGroupRun", () => {
    describe("#constructor()", () => {
        it("should create a WpgGroupRun with image children", () => {
            const imageChild: IMediaData = {
                type: "png",
                fileName: "test-image.png",
                data: Buffer.from(""),
                transformation: {
                    pixels: { x: 100, y: 100 },
                    emus: { x: 952500, y: 952500 },
                },
            };

            const run = new WpgGroupRun({
                type: "wpg",
                children: [imageChild],
                transformation: {
                    width: 200,
                    height: 200,
                },
            });

            const addImageMock = vi.fn();
            const tree = new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty("w:r");
        });

        it("should create a WpgGroupRun with wps shape children", () => {
            const run = new WpgGroupRun({
                type: "wpg",
                children: [
                    {
                        type: "wps",
                        transformation: {
                            pixels: { x: 100, y: 100 },
                            emus: { x: 952500, y: 952500 },
                        },
                        data: {
                            children: [new Paragraph("Shape text")],
                        },
                    },
                ],
                transformation: {
                    width: 300,
                    height: 300,
                },
            });

            const tree = new Formatter().format(run, {
                file: {
                    Media: {},
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty("w:r");
        });

        it("should create a WpgGroupRun with mixed children", () => {
            const imageChild: IMediaData = {
                type: "png",
                fileName: "mixed-image.png",
                data: Buffer.from(""),
                transformation: {
                    pixels: { x: 150, y: 150 },
                    emus: { x: 1428750, y: 1428750 },
                },
            };

            const run = new WpgGroupRun({
                type: "wpg",
                children: [
                    imageChild,
                    {
                        type: "wps",
                        transformation: {
                            pixels: { x: 100, y: 100 },
                            emus: { x: 952500, y: 952500 },
                        },
                        data: {
                            children: [new Paragraph("Text in shape")],
                        },
                    },
                ],
                transformation: {
                    width: 400,
                    height: 400,
                },
            });

            const addImageMock = vi.fn();
            const tree = new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty("w:r");
        });

        it("should support floating positioning", () => {
            const run = new WpgGroupRun({
                type: "wpg",
                children: [],
                transformation: {
                    width: 200,
                    height: 200,
                },
                floating: {
                    zIndex: 5,
                    horizontalPosition: {
                        offset: 1014400,
                    },
                    verticalPosition: {
                        offset: 1014400,
                    },
                },
            });

            const tree = new Formatter().format(run, {
                file: {
                    Media: {},
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty("w:r");

            const drawing = (tree as Record<string, readonly unknown[]>)["w:r"];
            const drawingElement = drawing.find((el) => typeof el === "object" && el !== null && "w:drawing" in el);
            expect(drawingElement).toBeDefined();
        });

        it("should support transformation with offset and rotation", () => {
            const run = new WpgGroupRun({
                type: "wpg",
                children: [],
                transformation: {
                    width: 200,
                    height: 100,
                    offset: { left: 10, top: 20 },
                    rotation: 90,
                },
            });

            const tree = new Formatter().format(run, {
                file: {
                    Media: {},
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty("w:r");
        });

        it("should support altText option", () => {
            const run = new WpgGroupRun({
                type: "wpg",
                children: [],
                transformation: {
                    width: 200,
                    height: 200,
                },
                altText: {
                    title: "Group Title",
                    description: "Group Description",
                    name: "Group Name",
                },
            });

            const tree = new Formatter().format(run, {
                file: {
                    Media: {},
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(tree).toBeDefined();
            expect(tree).toHaveProperty("w:r");
        });
    });

    describe("#prepForXml()", () => {
        it("should add image children to context.file.Media", () => {
            const imageChild: IMediaData = {
                type: "png",
                fileName: "test.png",
                data: Buffer.from("image-data"),
                transformation: {
                    pixels: { x: 100, y: 100 },
                    emus: { x: 952500, y: 952500 },
                },
            };

            const run = new WpgGroupRun({
                type: "wpg",
                children: [imageChild],
                transformation: {
                    width: 200,
                    height: 200,
                },
            });

            const addImageMock = vi.fn();
            new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(addImageMock).toHaveBeenCalledWith("test.png", imageChild);
        });

        it("should not call addImage for wps children", () => {
            const run = new WpgGroupRun({
                type: "wpg",
                children: [
                    {
                        type: "wps",
                        transformation: {
                            pixels: { x: 100, y: 100 },
                            emus: { x: 952500, y: 952500 },
                        },
                        data: {
                            children: [new Paragraph("Test")],
                        },
                    },
                ],
                transformation: {
                    width: 200,
                    height: 200,
                },
            });

            const addImageMock = vi.fn();
            new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(addImageMock).not.toHaveBeenCalled();
        });

        it("should add SVG fallback image to media", () => {
            const svgChild: IMediaData = {
                type: "svg",
                fileName: "test.svg",
                data: Buffer.from("svg-data"),
                transformation: {
                    pixels: { x: 100, y: 100 },
                    emus: { x: 952500, y: 952500 },
                },
                fallback: {
                    type: "png",
                    fileName: "test-fallback.png",
                    data: Buffer.from("fallback-data"),
                    transformation: {
                        pixels: { x: 100, y: 100 },
                        emus: { x: 952500, y: 952500 },
                    },
                },
            };

            const run = new WpgGroupRun({
                type: "wpg",
                children: [svgChild],
                transformation: {
                    width: 200,
                    height: 200,
                },
            });

            const addImageMock = vi.fn();
            new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(addImageMock).toHaveBeenCalledTimes(2);
            expect(addImageMock).toHaveBeenCalledWith("test.svg", svgChild);
            expect(addImageMock).toHaveBeenCalledWith("test-fallback.png", svgChild.fallback);
        });

        it("should add multiple image children to media", () => {
            const imageChild1: IMediaData = {
                type: "png",
                fileName: "image1.png",
                data: Buffer.from("data1"),
                transformation: {
                    pixels: { x: 100, y: 100 },
                    emus: { x: 952500, y: 952500 },
                },
            };

            const imageChild2: IMediaData = {
                type: "jpg",
                fileName: "image2.jpg",
                data: Buffer.from("data2"),
                transformation: {
                    pixels: { x: 200, y: 200 },
                    emus: { x: 1905000, y: 1905000 },
                },
            };

            const run = new WpgGroupRun({
                type: "wpg",
                children: [imageChild1, imageChild2],
                transformation: {
                    width: 400,
                    height: 400,
                },
            });

            const addImageMock = vi.fn();
            new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(addImageMock).toHaveBeenCalledTimes(2);
            expect(addImageMock).toHaveBeenCalledWith("image1.png", imageChild1);
            expect(addImageMock).toHaveBeenCalledWith("image2.jpg", imageChild2);
        });

        it("should only add non-wps children to media when mixed", () => {
            const imageChild: IMediaData = {
                type: "png",
                fileName: "image.png",
                data: Buffer.from("data"),
                transformation: {
                    pixels: { x: 100, y: 100 },
                    emus: { x: 952500, y: 952500 },
                },
            };

            const run = new WpgGroupRun({
                type: "wpg",
                children: [
                    imageChild,
                    {
                        type: "wps",
                        transformation: {
                            pixels: { x: 100, y: 100 },
                            emus: { x: 952500, y: 952500 },
                        },
                        data: {
                            children: [new Paragraph("Text")],
                        },
                    },
                ],
                transformation: {
                    width: 400,
                    height: 400,
                },
            });

            const addImageMock = vi.fn();
            new Formatter().format(run, {
                file: {
                    Media: {
                        addImage: addImageMock,
                    },
                } as unknown as File,
                viewWrapper: {} as unknown as IViewWrapper,
                stack: [],
            });

            expect(addImageMock).toHaveBeenCalledTimes(1);
            expect(addImageMock).toHaveBeenCalledWith("image.png", imageChild);
        });
    });
});
