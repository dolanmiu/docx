import { expect } from "chai";

import { Media } from "@file/media";

import { ImageReplacer } from "./image-replacer";

describe("ImageReplacer", () => {
    describe("#replace()", () => {
        it("should replace properly", () => {
            const imageReplacer = new ImageReplacer();
            const result = imageReplacer.replace(
                "test {test-image.png} test",
                [
                    {
                        stream: Buffer.from(""),
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
    });
});
