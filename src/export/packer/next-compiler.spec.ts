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
        it("should pack all the content", { timeout: 99999999 }, () => {
            const file = new File({
                sections: [],
                comments: {
                    children: [],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).is.an.instanceof(Array);
            expect(fileNames).has.length(22);
            expect(fileNames).to.include("word/document.xml");
            expect(fileNames).to.include("word/styles.xml");
            expect(fileNames).to.include("docProps/core.xml");
            expect(fileNames).to.include("docProps/custom.xml");
            expect(fileNames).to.include("docProps/app.xml");
            expect(fileNames).to.include("word/numbering.xml");
            expect(fileNames).to.include("word/footnotes.xml");
            expect(fileNames).to.include("word/_rels/footnotes.xml.rels");
            expect(fileNames).to.include("word/endnotes.xml");
            expect(fileNames).to.include("word/_rels/endnotes.xml.rels");
            expect(fileNames).to.include("word/settings.xml");
            expect(fileNames).to.include("word/comments.xml");
            expect(fileNames).to.include("word/fontTable.xml");
            expect(fileNames).to.include("word/_rels/document.xml.rels");
            expect(fileNames).to.include("word/_rels/fontTable.xml.rels");
            expect(fileNames).to.include("[Content_Types].xml");
            expect(fileNames).to.include("_rels/.rels");
        });

        it("should pack all additional headers and footers", { timeout: 99999999 }, () => {
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
            expect(fileNames).has.length(30);

            expect(fileNames).to.include("word/header1.xml");
            expect(fileNames).to.include("word/_rels/header1.xml.rels");
            expect(fileNames).to.include("word/header2.xml");
            expect(fileNames).to.include("word/_rels/header2.xml.rels");
            expect(fileNames).to.include("word/footer1.xml");
            expect(fileNames).to.include("word/_rels/footer1.xml.rels");
            expect(fileNames).to.include("word/footer2.xml");
            expect(fileNames).to.include("word/_rels/footer2.xml.rels");
        });

        it("should pack subfile overrides", { timeout: 99999999 }, async () => {
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
            expect(fileNames).has.length(23);

            expect(fileNames).to.include("word/comments.xml");
            expect(fileNames).to.include("word/commentsExtended.xml");

            const commentsText = await zipFile.file("word/comments.xml")?.async("text");
            const commentsExtendedText = await zipFile.file("word/commentsExtended.xml")?.async("text");

            expect(commentsText).toBe(subfileData1);
            expect(commentsExtendedText).toBe(subfileData2);
        });

        it("should include commentsExtended.xml when comments have parentId", { timeout: 99999999 }, async () => {
            const file = new File({
                sections: [],
                comments: {
                    children: [
                        { id: 0, children: [new Paragraph("parent")] },
                        { id: 1, children: [new Paragraph("reply")], parentId: 0 },
                    ],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).to.include("word/commentsExtended.xml");

            const commentsExtendedText = await zipFile.file("word/commentsExtended.xml")?.async("text");
            expect(commentsExtendedText).to.contain("w15:commentsEx");
            expect(commentsExtendedText).to.contain("w15:commentEx");
            expect(commentsExtendedText).to.contain("w15:paraId");
            expect(commentsExtendedText).to.contain("w15:paraIdParent");
        });

        it("should not include commentsIds.xml when comments have no durableId", () => {
            const file = new File({
                sections: [],
                comments: {
                    children: [{ id: 0, children: [new Paragraph("comment")] }],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).to.not.include("word/commentsIds.xml");
        });

        it("should include commentsIds.xml for a single (non-threaded) comment with durableId", { timeout: 99999999 }, async () => {
            const file = new File({
                sections: [],
                comments: {
                    children: [{ id: 0, children: [new Paragraph("comment")], durableId: "12AB34CD" }],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).to.include("word/commentsIds.xml");

            const commentsIdsText = await zipFile.file("word/commentsIds.xml")?.async("text");
            expect(commentsIdsText).to.contain("w16cid:commentsIds");
            expect(commentsIdsText).to.contain("w16cid:commentId");
            expect(commentsIdsText).to.contain('w16cid:paraId="00000001"');
            expect(commentsIdsText).to.contain('w16cid:durableId="12AB34CD"');

            // Content type override is registered
            const contentTypesText = await zipFile.file("[Content_Types].xml")?.async("text");
            expect(contentTypesText).to.contain("application/vnd.openxmlformats-officedocument.wordprocessingml.commentsIds+xml");
            expect(contentTypesText).to.contain("/word/commentsIds.xml");

            // Relationship is registered
            const relsText = await zipFile.file("word/_rels/document.xml.rels")?.async("text");
            expect(relsText).to.contain("http://schemas.microsoft.com/office/2016/09/relationships/commentsIds");
            expect(relsText).to.contain("commentsIds.xml");
        });

        it("should include commentsIds.xml mapping paraId to durableId for threaded comments", { timeout: 99999999 }, async () => {
            const file = new File({
                sections: [],
                comments: {
                    children: [
                        { id: 0, children: [new Paragraph("parent")], durableId: "11112222" },
                        { id: 1, children: [new Paragraph("reply")], parentId: 0, durableId: "33334444" },
                    ],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).to.include("word/commentsIds.xml");
            expect(fileNames).to.include("word/commentsExtended.xml");

            const commentsIdsText = await zipFile.file("word/commentsIds.xml")?.async("text");
            expect(commentsIdsText).to.contain('w16cid:paraId="00000001"');
            expect(commentsIdsText).to.contain('w16cid:durableId="11112222"');
            expect(commentsIdsText).to.contain('w16cid:paraId="00000002"');
            expect(commentsIdsText).to.contain('w16cid:durableId="33334444"');
        });

        it("should emit commentsIds.xml falling back to paraId for comments without a durableId", { timeout: 99999999 }, async () => {
            const file = new File({
                sections: [],
                comments: {
                    children: [
                        { id: 0, children: [new Paragraph("with durable")], durableId: "12AB34CD" },
                        { id: 1, children: [new Paragraph("without durable")] },
                    ],
                },
            });
            const zipFile = compiler.compile(file);
            const fileNames = Object.keys(zipFile.files).map((f) => zipFile.files[f].name);

            expect(fileNames).to.include("word/commentsIds.xml");

            const commentsIdsText = await zipFile.file("word/commentsIds.xml")?.async("text");
            // Comment WITH a durableId keeps its durableId (paraId 00000001 for id 0)
            expect(commentsIdsText).to.contain('w16cid:paraId="00000001"');
            expect(commentsIdsText).to.contain('w16cid:durableId="12AB34CD"');
            // Comment WITHOUT a durableId falls back to its generated paraId (00000002 for id 1)
            expect(commentsIdsText).to.contain('w16cid:paraId="00000002"');
            expect(commentsIdsText).to.contain('w16cid:durableId="00000002"');
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

            const spy = vi.spyOn(compiler["formatter"], "format");

            compiler.compile(file);
            expect(spy).toBeCalledTimes(18);
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

        it("should write embedded fonts to sequential filenames in the zip (no spaces or special chars from family name)", () => {
            // Regression for https://github.com/dolanmiu/docx/issues/3019 —
            // fonts whose user-facing family name contains spaces / non-ASCII
            // used to be written into the package zip with the family name as
            // the filename (e.g. `EB Garamond.odttf`). Word rejects those
            // paths and shows a "found unreadable content" recovery prompt on
            // open. Sequential names side-step that.
            const file = new File({
                sections: [],
                fonts: [
                    { name: "EB Garamond", data: Buffer.from("") },
                    { name: "Source Serif 4", data: Buffer.from("") },
                ],
            });

            const zip = compiler.compile(file);
            const fileNames = Object.keys(zip.files);
            expect(fileNames).to.include("word/fonts/font1.odttf");
            expect(fileNames).to.include("word/fonts/font2.odttf");
            expect(fileNames).to.not.include("word/fonts/EB Garamond.odttf");
            expect(fileNames).to.not.include("word/fonts/Source Serif 4.odttf");
        });
    });
});
