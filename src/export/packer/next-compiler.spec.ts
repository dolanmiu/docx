/* tslint:disable:typedef space-before-function-paren */
import { expect } from "chai";
import * as sinon from "sinon";

import { File } from "@file/file";
import { Footer, Header } from "@file/header";
import { ImageRun, Paragraph } from "@file/paragraph";
import * as convenienceFunctions from "@util/convenience-functions";

import { Compiler } from "./next-compiler";

describe("Compiler", () => {
    let compiler: Compiler;

    beforeEach(() => {
        compiler = new Compiler();
    });

    before(() => {
        sinon.stub(convenienceFunctions, "uniqueId").callsFake(() => "test");
    });

    after(() => {
        (convenienceFunctions.uniqueId as sinon.SinonStub).restore();
    });

    describe("#compile()", () => {
        it("should pack all the content", function () {
            this.timeout(99999999);
            const file = new File({
                sections: [],
                comments: {
                    children: [],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).is.an.instanceof(Array);
            expect(fileNames).has.length(17);
            expect(fileNames).to.include("word/document.xml");
            expect(fileNames).to.include("word/styles.xml");
            expect(fileNames).to.include("docProps/core.xml");
            expect(fileNames).to.include("docProps/custom.xml");
            expect(fileNames).to.include("docProps/app.xml");
            expect(fileNames).to.include("word/numbering.xml");
            expect(fileNames).to.include("word/footnotes.xml");
            expect(fileNames).to.include("word/_rels/footnotes.xml.rels");
            expect(fileNames).to.include("word/settings.xml");
            expect(fileNames).to.include("word/comments.xml");
            expect(fileNames).to.include("word/_rels/document.xml.rels");
            expect(fileNames).to.include("[Content_Types].xml");
            expect(fileNames).to.include("_rels/.rels");
        });

        it("should pack all additional headers and footers", function () {
            const file = new File({
                sections: [
                    {
                        headers: {
                            default: new Header({
                                children: [new Paragraph("test")],
                            }),
                        },
                        footers: {
                            default: new Footer({
                                children: [new Paragraph("test")],
                            }),
                        },
                        children: [],
                    },
                    {
                        headers: {
                            default: new Header({
                                children: [new Paragraph("test")],
                            }),
                        },
                        footers: {
                            default: new Footer({
                                children: [new Paragraph("test")],
                            }),
                        },
                        children: [],
                    },
                ],
            });

            this.timeout(99999999);

            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).is.an.instanceof(Array);
            expect(fileNames).has.length(25);

            expect(fileNames).to.include("word/header1.xml");
            expect(fileNames).to.include("word/_rels/header1.xml.rels");
            expect(fileNames).to.include("word/header2.xml");
            expect(fileNames).to.include("word/_rels/header2.xml.rels");
            expect(fileNames).to.include("word/footer1.xml");
            expect(fileNames).to.include("word/_rels/footer1.xml.rels");
            expect(fileNames).to.include("word/footer2.xml");
            expect(fileNames).to.include("word/_rels/footer2.xml.rels");
        });

        it("should call the format method X times equalling X files to be formatted", () => {
            // This test is required because before, there was a case where Document was formatted twice, which was inefficient
            // This also caused issues such as running prepForXml multiple times as format() was ran multiple times.
            const paragraph = new Paragraph("");
            const file = new File({
                sections: [
                    {
                        properties: {},
                        children: [paragraph],
                    },
                ],
            });

            // tslint:disable-next-line: no-string-literal
            const spy = sinon.spy(compiler["formatter"], "format");

            compiler.compile(file);
            expect(spy.callCount).to.equal(13);
        });

        it("should work with media datas", () => {
            // This test is required because before, there was a case where Document was formatted twice, which was inefficient
            // This also caused issues such as running prepForXml multiple times as format() was ran multiple times.
            const file = new File({
                sections: [
                    {
                        headers: {
                            default: new Header({
                                children: [new Paragraph("test")],
                            }),
                        },
                        footers: {
                            default: new Footer({
                                children: [new Paragraph("test")],
                            }),
                        },
                        children: [
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: Buffer.from("", "base64"),
                                        transformation: {
                                            width: 100,
                                            height: 100,
                                        },
                                    }),
                                ],
                            }),
                        ],
                    },
                ],
            });

            // tslint:disable-next-line: no-string-literal
            sinon.stub(compiler["imageReplacer"], "getMediaData").returns([
                {
                    stream: Buffer.from(""),
                    fileName: "test",
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
            ]);

            compiler.compile(file);
        });
    });
});
