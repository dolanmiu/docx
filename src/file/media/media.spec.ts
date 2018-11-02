// tslint:disable:object-literal-key-quotes
import { expect } from "chai";

import { Formatter } from "export/formatter";

import { File } from "../file";
import { Media } from "./media";

describe("Media", () => {
    describe("#addImage", () => {
        it("should add image", () => {
            const file = new File();
            const image = Media.addImage(file, "");

            let tree = new Formatter().format(image.Paragraph);
            expect(tree["w:p"]).to.be.an.instanceof(Array);

            tree = new Formatter().format(image.Run);
            expect(tree["w:r"]).to.be.an.instanceof(Array);
        });

        it("should ensure the correct relationship id is used when adding image", () => {
            const file = new File();
            const image1 = Media.addImage(file, "test");

            const tree = new Formatter().format(image1.Paragraph);
            const inlineElements = tree["w:p"][1]["w:r"][1]["w:drawing"][0]["wp:inline"];
            const graphicData = inlineElements.find((x) => x["a:graphic"]);

            expect(graphicData["a:graphic"][1]["a:graphicData"][1]["pic:pic"][2]["pic:blipFill"][0]["a:blip"][0]).to.deep.equal({
                _attr: {
                    "r:embed": `rId${file.DocumentRelationships.RelationshipCount}`,
                    cstate: "none",
                },
            });

            const image2 = Media.addImage(file, "test");
            const tree2 = new Formatter().format(image2.Paragraph);
            const inlineElements2 = tree2["w:p"][1]["w:r"][1]["w:drawing"][0]["wp:inline"];
            const graphicData2 = inlineElements2.find((x) => x["a:graphic"]);

            expect(graphicData2["a:graphic"][1]["a:graphicData"][1]["pic:pic"][2]["pic:blipFill"][0]["a:blip"][0]).to.deep.equal({
                _attr: {
                    "r:embed": `rId${file.DocumentRelationships.RelationshipCount}`,
                    cstate: "none",
                },
            });
        });
    });

    describe("#addMedia", () => {
        it("should add media", () => {
            // tslint:disable-next-line:no-any
            (Media as any).generateId = () => "test";

            const image = new Media().addMedia("", 1);
            expect(image.fileName).to.equal("test.png");
            expect(image.referenceId).to.equal(1);
            expect(image.dimensions).to.deep.equal({
                pixels: {
                    x: 100,
                    y: 100,
                },
                emus: {
                    x: 952500,
                    y: 952500,
                },
            });
        });

        it("should return UInt8Array if atob is present", () => {
            // tslint:disable-next-line
            ((process as any).atob as any) = () => "atob result";
            // tslint:disable-next-line:no-any
            (Media as any).generateId = () => "test";

            const image = new Media().addMedia("", 1);
            expect(image.stream).to.be.an.instanceof(Uint8Array);
        });
    });

    describe("#getMedia", () => {
        it("should get media", () => {
            // tslint:disable-next-line:no-any
            (Media as any).generateId = () => "test";

            const media = new Media();
            media.addMedia("", 1);

            const image = media.getMedia("test.png");

            expect(image.fileName).to.equal("test.png");
            expect(image.referenceId).to.equal(1);
            expect(image.dimensions).to.deep.equal({
                pixels: {
                    x: 100,
                    y: 100,
                },
                emus: {
                    x: 952500,
                    y: 952500,
                },
            });
        });

        it("Get media", () => {
            const media = new Media();

            expect(() => media.getMedia("test.png")).to.throw();
        });
    });

    describe("#Array", () => {
        it("Get images as array", () => {
            // tslint:disable-next-line:no-any
            (Media as any).generateId = () => "test";

            const media = new Media();
            media.addMedia("", 1);

            const array = media.Array;
            expect(array).to.be.an.instanceof(Array);
            expect(array.length).to.equal(1);

            const image = array[0];
            expect(image.fileName).to.equal("test.png");
            expect(image.referenceId).to.equal(1);
            expect(image.dimensions).to.deep.equal({
                pixels: {
                    x: 100,
                    y: 100,
                },
                emus: {
                    x: 952500,
                    y: 952500,
                },
            });
        });
    });
});
