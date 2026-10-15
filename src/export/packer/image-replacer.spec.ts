import { describe, expect, it } from "vitest";

import type { Media } from "@file/media";

import { ImageReplacer } from "./image-replacer";

describe("ImageReplacer", () => {
    describe("#replace()", () => {
        it("should replace properly", () => {
            const imageReplacer = new ImageReplacer();
            const result = imageReplacer.replace(
                "test {test-image.png} test",
                [
                    {
                        type: "png",
                        data: Buffer.from(""),
                        fileName: "test-image.png",
                        transformation: {
                            pixels: {
                                x: 100,
                                y: 100,
                            },
                            emus: {
                                x: 100,
                                y: 100,
                            },
                        },
                    },
                ],
                0,
            );

            expect(result).to.equal("test 0 test");
        });
    });

    describe("#getMediaData()", () => {
        it("should get media data", () => {
            const imageReplacer = new ImageReplacer();
            const result = imageReplacer.getMediaData("test {test-image} test", {
                Array: [
                    {
                        stream: Buffer.from(""),
                        fileName: "test-image",
                        dimensions: {
                            pixels: {
                                x: 100,
                                y: 100,
                            },
                            emus: {
                                x: 100,
                                y: 100,
                            },
                        },
                    },
                ],
            } as unknown as Media);

            expect(result).to.have.length(1);
        });

        it("finds only the images whose names are in the XML as they are written", () => {
            const image = (fileName: string) => ({ fileName }) as unknown as Media["Array"][number];
            const result = new ImageReplacer().getMediaData("<a>{image1Xpng}</a><b>{image2.png}</b>", {
                Array: [image("image1.png"), image("image2.png")],
            } as unknown as Media);

            expect(result.map(({ fileName }) => fileName)).to.deep.equal(["image2.png"]);
        });
    });
});
