import { describe, expect, it } from "vitest";

import type { IMediaData } from "./data";
import { Media } from "./media";

const image = (type: IMediaData["type"] = "png", data = Buffer.from("")): IMediaData =>
    ({
        type,
        data,
        fileName: `key.${type}`,
        transformation: {
            pixels: { x: 100, y: 100 },
            emus: { x: 9525, y: 9525 },
        },
    }) as IMediaData;

describe("Media", () => {
    describe("#addImage()", () => {
        it("should keep the image's data and transformation", () => {
            const media = new Media();

            media.addImage("test.png", {
                type: "png",
                data: Buffer.from("abc"),
                fileName: "test.png",
                transformation: {
                    pixels: { x: 100, y: 100 },
                    flip: { vertical: true, horizontal: true },
                    emus: { x: 9525, y: 9525 },
                    rotation: 90,
                },
            });

            const [added] = media.Array;
            expect(added.type).to.equal("png");
            expect(added.data).to.deep.equal(Buffer.from("abc"));
            expect(added.transformation).to.deep.equal({
                pixels: { x: 100, y: 100 },
                flip: { vertical: true, horizontal: true },
                emus: { x: 9525, y: 9525 },
                rotation: 90,
            });
        });

        it("should name images as Word does, image1, image2 and so on, numbered by type in the order they are added", () => {
            const media = new Media();

            media.addImage("4bf7547c9322fd2143bd3e8dfa84109d9d3fed14.png", image("png"));
            media.addImage("5cc32650134d765766514dd7861ad203c1c6669d.jpg", image("jpg"));
            media.addImage("e3884837efe490b34ef730a130afef42056dfb0d.svg", image("svg"));
            media.addImage("6942a699d8712509702da846545cfb8bbec8b25e.png", image("png"));
            media.addImage("9c5875b127e98914d759f3793ac8fb7c03bad422.jpg", image("jpg"));

            expect(media.Array.map(({ fileName }) => fileName)).to.deep.equal([
                "image1.png",
                "image1.jpg",
                "image1.svg",
                "image2.png",
                "image2.jpg",
            ]);
        });

        it("should add an image once, keeping its name, however many times it is added under its key", () => {
            const media = new Media();

            media.addImage("a.png", image("png", Buffer.from("a")));
            media.addImage("a.png", image("png", Buffer.from("a")));
            media.addImage("b.png", image("png", Buffer.from("b")));
            media.addImage("a.png", image("png", Buffer.from("a")));

            expect(media.Array.map(({ fileName }) => fileName)).to.deep.equal(["image1.png", "image2.png"]);
            expect(media.Array[0].data).to.deep.equal(Buffer.from("a"));
        });

        it("should take each image's path from the function it is given, as from a package's parts", () => {
            // eslint-disable-next-line functional/prefer-readonly-type
            const taken: string[] = [];
            const media = new Media((extension) => {
                // eslint-disable-next-line functional/immutable-data
                taken.push(extension);
                return `media/image${taken.length + 2}.${extension}`;
            });

            media.addImage("a.png", image("png"));
            media.addImage("b.jpg", image("jpg"));

            expect(taken).to.deep.equal(["png", "jpg"]);
            expect(media.Array.map(({ fileName }) => fileName)).to.deep.equal(["image3.png", "image4.jpg"]);
        });
    });

    describe("#Entries", () => {
        it("should give each image's key with its media data, in the order they were added", () => {
            const media = new Media();

            media.addImage("b.png", image("png"));
            media.addImage("a.png", image("png"));

            expect(media.Entries.map(([key, { fileName }]) => [key, fileName])).to.deep.equal([
                ["b.png", "image1.png"],
                ["a.png", "image2.png"],
            ]);
        });
    });
});
