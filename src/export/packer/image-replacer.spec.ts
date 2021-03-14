import { expect } from "chai";

import { File, HeadingLevel, Media, Paragraph } from "file";

import { ImageReplacer } from "./image-replacer";

describe("ImageReplacer", () => {
    let file: File;

    beforeEach(() => {
        file = new File({
            creator: "Dolan Miu",
            revision: "1",
            lastModifiedBy: "Dolan Miu",
        });

        file.addSection({
            children: [
                new Paragraph({
                    text: "title",
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph({
                    text: "Hello world",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "heading 2",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph("test text"),
            ],
        });
    });

    describe("#replace()", () => {
        it("should replace properly", () => {
            const imageReplacer = new ImageReplacer();
            const result = imageReplacer.replace(
                "test {test-image.png} test",
                [
                    {
                        stream: Buffer.from(""),
                        fileName: "test-image.png",
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
                0,
            );

            expect(result).to.equal("test 0 test");
        });
    });

    describe("#getMediaData()", () => {
        it("should get media data", () => {
            const imageReplacer = new ImageReplacer();
            const result = imageReplacer.getMediaData("test {test-image} test", ({
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
            } as unknown) as Media);

            expect(result).to.have.length(1);
        });
    });
});
