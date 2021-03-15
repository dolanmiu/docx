// tslint:disable:object-literal-key-quotes
import { expect } from "chai";
import { SinonStub, stub } from "sinon";

import * as convenienceFunctions from "convenience-functions";
import { Formatter } from "export/formatter";

import { File } from "../file";
import { Paragraph } from "../paragraph";
import { Media } from "./media";

describe("Media", () => {
    before(() => {
        stub(convenienceFunctions, "uniqueId").callsFake(() => "test");
    });

    after(() => {
        (convenienceFunctions.uniqueId as SinonStub).restore();
    });

    describe("#addImage", () => {
        it("should add image", () => {
            const file = new File();
            const image = Media.addImage({
                document: file,
                data: "",
                transformation: {
                    width: 100,
                    height: 100,
                },
            });

            let tree = new Formatter().format(new Paragraph(image));
            expect(tree["w:p"]).to.be.an.instanceof(Array);

            tree = new Formatter().format(image);
            expect(tree["w:r"]).to.be.an.instanceof(Array);
        });

        it("should ensure the correct relationship id is used when adding image", () => {
            // tslint:disable-next-line:no-any

            const file = new File();
            const image1 = Media.addImage({
                document: file,
                data: "test",
                transformation: {
                    width: 100,
                    height: 100,
                },
            });
            const tree = new Formatter().format(new Paragraph(image1));
            const inlineElements = tree["w:p"][0]["w:r"][0]["w:drawing"][0]["wp:inline"];
            const graphicData = inlineElements.find((x) => x["a:graphic"]);

            expect(graphicData["a:graphic"][1]["a:graphicData"][1]["pic:pic"][2]["pic:blipFill"][0]["a:blip"]).to.deep.equal({
                _attr: {
                    "r:embed": `rId{test.png}`,
                    cstate: "none",
                },
            });

            const image2 = Media.addImage({
                document: file,
                data: "test",
                transformation: {
                    width: 100,
                    height: 100,
                },
            });
            const tree2 = new Formatter().format(new Paragraph(image2));
            const inlineElements2 = tree2["w:p"][0]["w:r"][0]["w:drawing"][0]["wp:inline"];
            const graphicData2 = inlineElements2.find((x) => x["a:graphic"]);

            expect(graphicData2["a:graphic"][1]["a:graphicData"][1]["pic:pic"][2]["pic:blipFill"][0]["a:blip"]).to.deep.equal({
                _attr: {
                    "r:embed": `rId{test.png}`,
                    cstate: "none",
                },
            });
        });
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
            global.atob = () => "atob result";

            const image = new Media().addMedia("", {
                width: 100,
                height: 100,
            });
            expect(image.stream).to.be.an.instanceof(Uint8Array);

            // tslint:disable-next-line: no-any
            (global as any).atob = undefined;
        });

        it("should use data as is if its not a string", () => {
            global.atob = () => "atob result";

            const image = new Media().addMedia(Buffer.from(""), {
                width: 100,
                height: 100,
            });
            expect(image.stream).to.be.an.instanceof(Uint8Array);

            // tslint:disable-next-line: no-any
            (global as any).atob = undefined;
        });
    });

    describe("#getMedia", () => {
        it("should get media", () => {
            const media = new Media();
            media.addMedia("", {
                width: 100,
                height: 100,
            });

            const image = media.getMedia("test.png");

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

        it("Get media", () => {
            const media = new Media();

            expect(() => media.getMedia("test.png")).to.throw();
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
