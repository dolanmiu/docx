import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

    beforeAll(() => {
        vi.spyOn(convenienceFunctions, "uniqueId").mockReturnValue("test");
    });

    afterAll(() => {
        vi.resetAllMocks();
    });

    describe("#compile()", () => {
        it(
            "should pack all the content",
            () => {
                const file = new File({
                    sections: [],
                    comments: {
                        children: [],
                    },
                });
                const zipFile = compiler.compile(file);
                const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

                expect(fileNames).is.an.instanceof(Array);
                expect(fileNames).has.length(20);
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
                expect(fileNames).to.include("word/fontTable.xml");
                expect(fileNames).to.include("word/_rels/document.xml.rels");
                expect(fileNames).to.include("word/_rels/fontTable.xml.rels");
                expect(fileNames).to.include("[Content_Types].xml");
                expect(fileNames).to.include("_rels/.rels");
            },
            {
                timeout: 99999999,
            },
        );

        it(
            "should pack all additional headers and footers",
            () => {
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

                const zipFile = compiler.compile(file);
                const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

                expect(fileNames).is.an.instanceof(Array);
                expect(fileNames).has.length(28);

                expect(fileNames).to.include("word/header1.xml");
                expect(fileNames).to.include("word/_rels/header1.xml.rels");
                expect(fileNames).to.include("word/header2.xml");
                expect(fileNames).to.include("word/_rels/header2.xml.rels");
                expect(fileNames).to.include("word/footer1.xml");
                expect(fileNames).to.include("word/_rels/footer1.xml.rels");
                expect(fileNames).to.include("word/footer2.xml");
                expect(fileNames).to.include("word/_rels/footer2.xml.rels");
            },
            {
                timeout: 99999999,
            },
        );

        it(
            "should pack subfile overrides",
            async () => {
                const file = new File({
                    sections: [],
                    comments: {
                        children: [],
                    },
                });
                const subfileData1 = "comments";
                const subfileData2 = "commentsExtended";
                const overrides = [
                    { path: "word/comments.xml", data: subfileData1 },
                    { path: "word/commentsExtended.xml", data: subfileData2 },
                ];
                const zipFile = compiler.compile(file, "", overrides);
                const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

                expect(fileNames).is.an.instanceof(Array);
                expect(fileNames).has.length(21);

                expect(fileNames).to.include("word/comments.xml");
                expect(fileNames).to.include("word/commentsExtended.xml");

                const commentsText = await zipFile.file("word/comments.xml")?.async("text");
                const commentsExtendedText = await zipFile.file("word/commentsExtended.xml")?.async("text");

                expect(commentsText).toBe(subfileData1);
                expect(commentsExtendedText).toBe(subfileData2);
            },
            {
                timeout: 99999999,
            },
        );

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

            const spy = vi.spyOn(compiler["formatter"], "format");

            compiler.compile(file);
            expect(spy).toBeCalledTimes(16);
        });

        it("should work with media datas", () => {
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
                                        type: "png",
                                        data: Buffer.from("", "base64"),
                                        transformation: {
                                            width: 100,
                                            height: 100,
                                        },
                                    }),
                                    new ImageRun({
                                        type: "svg",
                                        data: Buffer.from("", "base64"),
                                        transformation: {
                                            width: 100,
                                            height: 100,
                                        },
                                        fallback: {
                                            type: "png",
                                            data: Buffer.from("", "base64"),
                                        },
                                    }),
                                ],
                            }),
                        ],
                    },
                ],
            });

            vi.spyOn(compiler["imageReplacer"], "getMediaData").mockReturnValue([
                {
                    type: "png",
                    data: Buffer.from(""),
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
                {
                    type: "svg",
                    data: Buffer.from(""),
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
                    fallback: {
                        type: "png",
                        data: Buffer.from(""),
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
                },
            ]);

            compiler.compile(file);
        });

        it("should work with fonts", () => {
            const file = new File({
                sections: [],
                fonts: [{ name: "Pacifico", data: Buffer.from("") }],
            });

            compiler.compile(file);
        });
    });
});
