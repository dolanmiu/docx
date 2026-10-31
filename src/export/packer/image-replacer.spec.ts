import { describe, expect, it } from "vitest";

import { Media } from "@file/media";

import { ImageReplacer } from "./image-replacer";

const transformation = { pixels: { x: 100, y: 100 }, emus: { x: 100, y: 100 } };

const mediaWith = (...keys: readonly string[]): Media => {
    const media = new Media();
    for (const key of keys) {
        media.addImage(key, { type: "png", data: Buffer.from(""), fileName: key, transformation });
    }
    return media;
};

describe("ImageReplacer", () => {
    describe("#replace()", () => {
        it("should replace the placeholders of the images' keys with their relationship ids, from the offset", () => {
            const result = new ImageReplacer().replace(
                "test {test-image.png} test {other.png}",
                [
                    { key: "test-image.png", fileName: "image1.png" },
                    { key: "other.png", fileName: "image2.png" },
                ],
                5,
            );

            expect(result).to.equal("test 5 test 6");
        });

        it("should leave a placeholder of a key it isn't given, and not match the file name an image is written with", () => {
            const result = new ImageReplacer().replace("{a.png} {image1.png}", [{ key: "a.png", fileName: "image1.png" }], 0);

            expect(result).to.equal("0 {image1.png}");
        });
    });

    describe("#getMediaData()", () => {
        it("should find the images whose keys are in the XML, with the file names they are written with", () => {
            const result = new ImageReplacer().getMediaData("test {test-image.png} test", mediaWith("test-image.png"));

            expect(result).to.deep.equal([{ key: "test-image.png", fileName: "image1.png" }]);
        });

        it("finds only the images whose keys are in the XML as they are written", () => {
            const result = new ImageReplacer().getMediaData(
                "<a>{image1Xpng}</a><b>{image2.png}</b>",
                mediaWith("image1.png", "image2.png"),
            );

            expect(result).to.deep.equal([{ key: "image2.png", fileName: "image2.png" }]);
        });

        it("should list the images in the order they were added to the media, not the order of the XML", () => {
            const result = new ImageReplacer().getMediaData("{b.png}{a.png}", mediaWith("a.png", "b.png"));

            expect(result.map(({ fileName }) => fileName)).to.deep.equal(["image1.png", "image2.png"]);
        });
    });
});
