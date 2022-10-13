// tslint:disable:object-literal-key-quotes
import { expect } from "chai";
import { SinonStub, stub } from "sinon";

import * as convenienceFunctions from "@util/convenience-functions";

import { Media } from "./media";

describe("Media", () => {
    before(() => {
        stub(convenienceFunctions, "uniqueId").callsFake(() => "test");
    });

    after(() => {
        (convenienceFunctions.uniqueId as SinonStub).restore();
    });

    describe("#addMedia", () => {
        it("should add media", () => {
            const image = new Media().addMedia("", {
                width: 100,
                height: 100,
            });
            expect(image.fileName).to.equal("test.png");
            expect(image.transformation).to.deep.equal({
                pixels: {
                    x: 100,
                    y: 100,
                },
                flip: undefined,
                emus: {
                    x: 952500,
                    y: 952500,
                },
                rotation: undefined,
            });
        });

        it("should return UInt8Array if atob is present", () => {
            // eslint-disable-next-line functional/immutable-data
            global.atob = () => "atob result";

            const image = new Media().addMedia("", {
                width: 100,
                height: 100,
            });
            expect(image.stream).to.be.an.instanceof(Uint8Array);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
            (global as any).atob = undefined;
        });

        it("should use data as is if its not a string", () => {
            // eslint-disable-next-line  functional/immutable-data
            global.atob = () => "atob result";

            const image = new Media().addMedia(Buffer.from(""), {
                width: 100,
                height: 100,
            });
            expect(image.stream).to.be.an.instanceof(Uint8Array);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, functional/immutable-data
            (global as any).atob = undefined;
        });
    });

    describe("#addImage", () => {
        it("should add media", () => {
            const media = new Media();
            media.addMedia("", {
                width: 100,
                height: 100,
            });

            media.addImage("test2.png", {
                stream: Buffer.from(""),
                fileName: "",
                transformation: {
                    pixels: {
                        x: Math.round(1),
                        y: Math.round(1),
                    },
                    emus: {
                        x: Math.round(1 * 9525),
                        y: Math.round(1 * 9525),
                    },
                },
            });

            expect(media.Array).to.be.lengthOf(2);
        });
    });

    describe("#Array", () => {
        it("Get images as array", () => {
            const media = new Media();
            media.addMedia("", {
                width: 100,
                height: 100,
                flip: {
                    vertical: true,
                    horizontal: true,
                },
                rotation: 90,
            });

            const array = media.Array;
            expect(array).to.be.an.instanceof(Array);
            expect(array.length).to.equal(1);

            const image = array[0];
            expect(image.fileName).to.equal("test.png");
            expect(image.transformation).to.deep.equal({
                pixels: {
                    x: 100,
                    y: 100,
                },
                flip: {
                    vertical: true,
                    horizontal: true,
                },
                emus: {
                    x: 952500,
                    y: 952500,
                },
                rotation: 5400000,
            });
        });
    });
});
