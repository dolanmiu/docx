import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { Packer } from "@export/packer/packer";
import { EndnoteReferenceRun } from "@file/endnotes";
import { File } from "@file/file";
import { FootnoteReferenceRun } from "@file/footnotes";
import { Header } from "@file/header";
import { PackagePart } from "@file/package-part";
import { Bookmark, ExternalHyperlink, ImageRun, Paragraph, Run, TextRun } from "@file/paragraph";
import { BuilderElement, type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { type IPatch, type PatchDocumentOptions, PatchType, type TableRowsPatch, patchDocument } from "./from-docx";
import { traverse } from "./traverser";
import { toJson } from "./util";

const MOCK_XML = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
    xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex"
    xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex"
    xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex"
    xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex"
    xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex"
    xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex"
    xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex"
    xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex"
    xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink"
    xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:oel="http://schemas.microsoft.com/office/2019/extlst"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
    xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:w10="urn:schemas-microsoft-com:office:word"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
    xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
    xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex"
    xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid"
    xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml"
    xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash"
    xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex"
    xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
    xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
    xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
    xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
    <w:body>
        <w:p w14:paraId="2499FE9F" w14:textId="0A3D130F" w:rsidR="00B51233"
            w:rsidRDefault="007B52ED" w:rsidP="007B52ED">
            <w:pPr>
                <w:pStyle w:val="Title" />
            </w:pPr>
            <w:r>
                <w:t>Hello World</w:t>
            </w:r>
        </w:p>
        <w:p w14:paraId="6410D9A0" w14:textId="7579AB49" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED" />
        <w:p w14:paraId="57ACF964" w14:textId="315D7A05" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED">
            <w:r>
                <w:t>Hello {{name}},</w:t>
            </w:r>
            <w:r w:rsidR="008126CB">
                <w:t xml:space="preserve"> how are you?</w:t>
            </w:r>
        </w:p>
        <w:p w14:paraId="38C7DF4A" w14:textId="66CDEC9A" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED" />
        <w:p w14:paraId="04FABE2B" w14:textId="3DACA001" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED">
            <w:r>
                <w:t>{{paragraph_replace}}</w:t>
            </w:r>
        </w:p>
        <w:p w14:paraId="7AD7975D" w14:textId="77777777" w:rsidR="00EF161F"
            w:rsidRDefault="00EF161F" />
        <w:p w14:paraId="3BD6D75A" w14:textId="19AE3121" w:rsidR="00EF161F"
            w:rsidRDefault="00EF161F">
            <w:r>
                <w:t>{{table}}</w:t>
            </w:r>
        </w:p>
        <w:p w14:paraId="76023962" w14:textId="4E606AB9" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED" />
        <w:tbl>
            <w:tblPr>
                <w:tblStyle w:val="TableGrid" />
                <w:tblW w:w="0" w:type="auto" />
                <w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1"
                    w:lastColumn="0" w:noHBand="0" w:noVBand="1" />
            </w:tblPr>
            <w:tblGrid>
                <w:gridCol w:w="3003" />
                <w:gridCol w:w="3003" />
                <w:gridCol w:w="3004" />
            </w:tblGrid>
            <w:tr w:rsidR="00EF161F" w14:paraId="1DEC5955" w14:textId="77777777" w:rsidTr="00EF161F">
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3003" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="54DA5587" w14:textId="625BAC60" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F">
                        <w:r>
                            <w:t>{{table_heading_1}}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3003" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="57100910" w14:textId="71FD5616" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3004" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="1D388FAB" w14:textId="77777777" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
            </w:tr>
            <w:tr w:rsidR="00EF161F" w14:paraId="0F53D2DC" w14:textId="77777777" w:rsidTr="00EF161F">
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3003" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="0F2BCCED" w14:textId="3C3B6706" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F">
                        <w:r>
                            <w:t>Item: {{item_1}}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3003" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="1E6158AC" w14:textId="77777777" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3004" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="17937748" w14:textId="77777777" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
            </w:tr>
            <w:tr w:rsidR="00EF161F" w14:paraId="781DAC1A" w14:textId="77777777" w:rsidTr="00EF161F">
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3003" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="1DCD0343" w14:textId="77777777" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3003" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="5D02E3CD" w14:textId="77777777" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="3004" w:type="dxa" />
                    </w:tcPr>
                    <w:p w14:paraId="52EA0DBB" w14:textId="77777777" w:rsidR="00EF161F"
                        w:rsidRDefault="00EF161F" />
                </w:tc>
            </w:tr>
        </w:tbl>
        <w:p w14:paraId="47CD1FBC" w14:textId="23474CBC" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED" />
        <w:p w14:paraId="0ACCEE90" w14:textId="67907499" w:rsidR="00EF161F"
            w:rsidRDefault="0077578F">
            <w:r>
                <w:t>{{image_test}}</w:t>
            </w:r>
        </w:p>
        <w:p w14:paraId="23FA9862" w14:textId="77777777" w:rsidR="0077578F"
            w:rsidRDefault="0077578F" />
        <w:p w14:paraId="01578F2F" w14:textId="3BDC6C85" w:rsidR="007B52ED"
            w:rsidRDefault="007B52ED">
            <w:r>
                <w:t>Thank you</w:t>
            </w:r>
        </w:p>
        <w:sectPr w:rsidR="007B52ED" w:rsidSect="0072043F">
            <w:headerReference w:type="default" r:id="rId6" />
            <w:footerReference w:type="default" r:id="rId7" />
            <w:pgSz w:w="11900" w:h="16840" />
            <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708"
                w:footer="708" w:gutter="0" />
            <w:cols w:space="708" />
            <w:docGrid w:linePitch="360" />
        </w:sectPr>
    </w:body>
</w:document>
`;

describe("from-docx", () => {
    describe("patchDocument", () => {
        describe("document.xml and [Content_Types].xml", () => {
            beforeEach(() => {
                const zip = new JSZip();

                zip.file("word/document.xml", MOCK_XML);
                zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(zip);
            });

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should patch the document", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        name: {
                            type: PatchType.PARAGRAPH,
                            children: [new TextRun("Sir. "), new TextRun("John Doe"), new TextRun("(The Conqueror)")],
                        },
                        item_1: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new TextRun("#657"),
                                new ExternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "BBC News Link",
                                        }),
                                    ],
                                    link: "https://www.bbc.co.uk/news",
                                }),
                            ],
                        },
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        paragraph_replace: {
                            type: PatchType.DOCUMENT,
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun("This is a "),
                                        new ExternalHyperlink({
                                            children: [
                                                new TextRun({
                                                    text: "Google Link",
                                                }),
                                            ],
                                            link: "https://www.google.co.uk",
                                        }),
                                        new ImageRun({
                                            type: "png",
                                            data: Buffer.from(""),
                                            transformation: { width: 100, height: 100 },
                                        }),
                                    ],
                                }),
                            ],
                        },
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        image_test: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ImageRun({
                                    type: "png",
                                    data: Buffer.from(""),
                                    transformation: { width: 100, height: 100 },
                                }),
                            ],
                        },
                    },
                });
                expect(output).to.not.be.undefined;
            });

            it("should patch the document", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {},
                });
                expect(output).to.not.be.undefined;
            });

            it("should patch in a bookmark whose start and end share one id", async () => {
                // The patcher formats with a stand-in file, so a bookmark that
                // looked its id up from the document threw here.
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        paragraph_replace: {
                            type: PatchType.DOCUMENT,
                            children: [new Paragraph({ children: [new Bookmark({ id: "anchor", children: [new TextRun("Anchor")] })] })],
                        },
                    },
                });

                // `JSZip.loadAsync` is mocked above; the instance method reads the real output.
                const xml = await (await new JSZip().loadAsync(output)).file("word/document.xml")?.async("text");
                const start = xml?.match(/<w:bookmarkStart w:name="anchor" w:id="(\d+)"\/>/);
                const end = xml?.match(/<w:bookmarkEnd w:id="(\d+)"\/>/);

                expect(start?.[1]).to.be.a("string");
                expect(end?.[1]).to.equal(start?.[1]);
            });

            it("should work with the raw JSZip type", async () => {
                const zip = new JSZip();

                zip.file("word/document.xml", MOCK_XML);
                zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: zip,
                    patches: {},
                });
                expect(output).to.not.be.undefined;
            });

            it("should skiup UTF-16 types", async () => {
                const zip = new JSZip();

                zip.file("word/document.xml", MOCK_XML);
                zip.file("[Content_Types].xml", Buffer.from([0xff, 0xfe]));
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: zip,
                    patches: {},
                });
                expect(output).to.not.be.undefined;
            });

            it("should patch the document", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    placeholderDelimiters: { start: "{{", end: "}}" },
                    patches: {
                        name: {
                            type: PatchType.PARAGRAPH,
                            children: [new TextRun("Sir. "), new TextRun("John Doe"), new TextRun("(The Conqueror)")],
                        },
                        item_1: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new TextRun("#657"),
                                new ExternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "BBC News Link",
                                        }),
                                    ],
                                    link: "https://www.bbc.co.uk/news",
                                }),
                            ],
                        },
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        paragraph_replace: {
                            type: PatchType.DOCUMENT,
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun("This is a "),
                                        new ExternalHyperlink({
                                            children: [
                                                new TextRun({
                                                    text: "Google Link",
                                                }),
                                            ],
                                            link: "https://www.google.co.uk",
                                        }),
                                        new ImageRun({
                                            type: "png",
                                            data: Buffer.from(""),
                                            transformation: { width: 100, height: 100 },
                                        }),
                                    ],
                                }),
                            ],
                        },
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        image_test: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ImageRun({
                                    type: "png",
                                    data: Buffer.from(""),
                                    transformation: { width: 100, height: 100 },
                                }),
                            ],
                        },
                    },
                });
                expect(output).to.not.be.undefined;
            });

            it("should patch the document", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {},
                });
                expect(output).to.not.be.undefined;
            });

            it("throws error with empty delimiters", async () => {
                await expect(() =>
                    patchDocument({
                        outputType: "uint8array",
                        data: Buffer.from(""),
                        patches: {},
                        placeholderDelimiters: { start: "", end: "" },
                    }),
                ).rejects.toThrow();
            });

            it("throws error with whitespace-only delimiters", async () => {
                await expect(() =>
                    patchDocument({
                        outputType: "uint8array",
                        data: Buffer.from(""),
                        patches: {},
                        placeholderDelimiters: { start: " ", end: " " },
                    }),
                ).rejects.toThrowError();
            });
        });

        describe("document.xml and [Content_Types].xml with relationships", () => {
            beforeEach(() => {
                vi.spyOn(JSZip, "loadAsync").mockReturnValue(
                    new Promise<JSZip>((resolve) => {
                        const zip = new JSZip();

                        zip.file("word/document.xml", MOCK_XML);
                        zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                        zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                        resolve(zip);
                    }),
                );
            });

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should use the relationships file rather than create one", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        image_test: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ImageRun({
                                    type: "png",
                                    data: Buffer.from(""),
                                    transformation: { width: 100, height: 100 },
                                }),
                                new ExternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "Google Link",
                                        }),
                                    ],
                                    link: "https://www.google.co.uk",
                                }),
                            ],
                        },
                    },
                });
                expect(output).to.not.be.undefined;
            });
        });

        describe("document.xml and [Content_Types].xml without relationships file", () => {
            beforeEach(() => {
                vi.spyOn(JSZip, "loadAsync").mockReturnValue(
                    new Promise<JSZip>((resolve) => {
                        const zip = new JSZip();

                        zip.file("word/document.xml", MOCK_XML);
                        zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                        resolve(zip);
                    }),
                );
            });

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should create a relationships file for hyperlink only patches", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        image_test: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ExternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "Google Link",
                                        }),
                                    ],
                                    link: "https://www.google.co.uk",
                                }),
                            ],
                        },
                    },
                });
                expect(output).to.not.be.undefined;
            });
        });

        describe("document.xml without attributes on w:document", () => {
            const MOCK_XML_NO_ATTRS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document>
    <w:body>
        <w:p>
            <w:r>
                <w:t>Hello {{name}}</w:t>
            </w:r>
        </w:p>
    </w:body>
</w:document>`;

            beforeEach(() => {
                const zip = new JSZip();
                zip.file("word/document.xml", MOCK_XML_NO_ATTRS);
                zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(zip);
            });

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should patch a document whose w:document element has no attributes", async () => {
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        name: {
                            type: PatchType.PARAGRAPH,
                            children: [new TextRun("World")],
                        },
                    },
                });
                expect(output).to.not.be.undefined;
            });
        });

        describe("document.xml", () => {
            beforeEach(() => {
                vi.spyOn(JSZip, "loadAsync").mockReturnValue(
                    new Promise<JSZip>((resolve) => {
                        const zip = new JSZip();

                        zip.file("word/document.xml", MOCK_XML);
                        resolve(zip);
                    }),
                );
            });

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should throw an error if the content types is not found", () =>
                expect(
                    patchDocument({
                        outputType: "uint8array",
                        data: Buffer.from(""),
                        patches: {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            image_test: {
                                type: PatchType.PARAGRAPH,
                                children: [
                                    new ImageRun({
                                        type: "png",
                                        data: Buffer.from(""),
                                        transformation: { width: 100, height: 100 },
                                    }),
                                ],
                            },
                        },
                    }),
                ).rejects.toThrowError());
        });

        describe("A document with a theme", () => {
            // cspell:ignore srgbClr
            const theme = (accent1: string): string =>
                `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="${accent1}"/></a:accent1></a:clrScheme></a:themeElements></a:theme>`;

            const createZip = (files: readonly (readonly [string, string])[]): JSZip =>
                files.reduce(
                    (zip, [path, content]) => zip.file(path, content),
                    new JSZip()
                        .file("word/document.xml", MOCK_XML)
                        .file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`),
                );

            const patchName = async (zip: JSZip): Promise<string> => {
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(zip);
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        name: {
                            type: PatchType.PARAGRAPH,
                            children: [new TextRun({ text: "John Doe", color: { theme: "accent1", darker: 25 } })],
                        },
                    },
                });
                const patched = await new JSZip().loadAsync(output);
                return patched.file("word/document.xml")!.async("text");
            };

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should write theme colors with the hex color they come to in the document's theme", async () => {
                const document = await patchName(
                    createZip([
                        [
                            "word/_rels/document.xml.rels",
                            `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>`,
                        ],
                        // Office 2007's first accent color
                        ["word/theme/theme1.xml", theme("4F81BD")],
                    ]),
                );
                expect(document).to.include(`<w:color w:val="366091" w:themeColor="accent1" w:themeShade="BF"/>`);
            });

            it("should use Office's colors in a document without a theme", async () => {
                const document = await patchName(createZip([]));
                expect(document).to.include(`<w:color w:val="2F5496" w:themeColor="accent1" w:themeShade="BF"/>`);
            });
        });

        describe("Images", () => {
            beforeEach(() => {
                vi.spyOn(JSZip, "loadAsync").mockReturnValue(
                    new Promise<JSZip>((resolve) => {
                        const zip = new JSZip();

                        zip.file("word/document.xml", MOCK_XML);
                        zip.file("word/document.bmp", "");

                        resolve(zip);
                    }),
                );
            });

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should throw an error if the content types is not found", () =>
                expect(
                    patchDocument({
                        outputType: "uint8array",
                        data: Buffer.from(""),
                        patches: {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            image_test: {
                                type: PatchType.PARAGRAPH,
                                children: [
                                    new ImageRun({
                                        type: "png",
                                        data: Buffer.from(""),
                                        transformation: { width: 100, height: 100 },
                                    }),
                                ],
                            },
                        },
                    }),
                ).rejects.toThrowError());
        });

        describe("A placeholder that is in a paragraph twice", () => {
            const patchName = async (patch: IPatch, recursive?: boolean): Promise<readonly string[]> => {
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(
                    new JSZip()
                        .file(
                            "word/document.xml",
                            `<w:document><w:body><w:p><w:r><w:t>{{name}} and {{name}}</w:t></w:r></w:p></w:body></w:document>`,
                        )
                        .file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`),
                );
                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: { name: patch },
                    recursive,
                });
                const patched = await new JSZip().loadAsync(output);
                return traverse(toJson(await patched.file("word/document.xml")!.async("text"))).map((p) => p.text);
            };

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should replace both, and not the placeholder in a paragraph patch's own content", async () => {
                const texts = await patchName({ type: PatchType.PARAGRAPH, children: [new TextRun("[{{name}}]")] });
                expect(texts).to.deep.equal(["[{{name}}] and [{{name}}]"]);
            });

            it("should replace the paragraph once, and not the placeholder in a document patch's own content", async () => {
                const texts = await patchName({ type: PatchType.DOCUMENT, children: [new Paragraph("again {{name}}")] });
                expect(texts).to.deep.equal(["again {{name}}"]);
            });

            it("should only replace the first if recursive is false", async () => {
                const texts = await patchName({ type: PatchType.PARAGRAPH, children: [new TextRun("John")] }, false);
                expect(texts).to.deep.equal(["John and {{name}}"]);
            });
        });

        describe("Hyperlinks", () => {
            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should add a hyperlink's relationship only to the parts that have its placeholder", async () => {
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(
                    new JSZip()
                        .file("word/document.xml", `<w:document><w:body><w:p><w:r><w:t>Body</w:t></w:r></w:p></w:body></w:document>`)
                        .file("word/header1.xml", `<w:hdr><w:p><w:r><w:t>{{link}}</w:t></w:r></w:p></w:hdr>`)
                        .file("word/styles.xml", `<w:styles/>`)
                        .file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`),
                );

                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        link: {
                            type: PatchType.PARAGRAPH,
                            children: [new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("Example")] })],
                        },
                    },
                });

                const patched = await new JSZip().loadAsync(output);
                expect(await patched.file("word/_rels/header1.xml.rels")!.async("text")).to.contain(
                    'Target="https://example.com" TargetMode="External"',
                );
                expect(patched.file("word/_rels/document.xml.rels")).to.equal(null);
                expect(patched.file("word/_rels/styles.xml.rels")).to.equal(null);
            });

            // https://github.com/dolanmiu/docx/issues/3265
            it("should link to the address, with the link's text formatted as the placeholder is", async () => {
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(
                    new JSZip()
                        .file(
                            "word/document.xml",
                            `<w:document><w:body><w:p><w:r><w:rPr><w:sz w:val="56"/></w:rPr><w:t>{{link}}</w:t></w:r></w:p></w:body></w:document>`,
                        )
                        .file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`),
                );

                const output = await patchDocument({
                    outputType: "uint8array",
                    data: Buffer.from(""),
                    patches: {
                        link: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ExternalHyperlink({
                                    link: "https://example.com/projects/1",
                                    children: [new TextRun({ text: "Project details", color: "0563C1", underline: {} })],
                                }),
                            ],
                        },
                    },
                });

                const patched = await new JSZip().loadAsync(output);
                const [, relationshipId] = (await patched.file("word/document.xml")!.async("text")).match(
                    /<w:hyperlink [^>]*r:id="([^"]+)"><w:r><w:rPr><w:color w:val="0563C1"\/><w:sz w:val="56"\/><w:u w:val="single"\/><\/w:rPr>/,
                )!;
                expect(await patched.file("word/_rels/document.xml.rels")!.async("text")).to.match(
                    new RegExp(`Id="${relationshipId}"[^>]*Target="https://example.com/projects/1" TargetMode="External"`),
                );
            });
        });

        describe("Text with an escaped ampersand", () => {
            it("should keep a literal &amp; in the template's text and in a patch's", async () => {
                const template = await Packer.toBuffer(
                    new File({ sections: [{ children: [new Paragraph("Write &amp; for & in HTML"), new Paragraph("{{patch}}")] }] }),
                );
                const zip = await JSZip.loadAsync(
                    await patchDocument({
                        outputType: "nodebuffer",
                        data: template,
                        patches: { patch: { type: PatchType.PARAGRAPH, children: [new TextRun("R&amp;D & more")] } },
                    }),
                );
                const document = (await zip.file("word/document.xml")?.async("text")) ?? "";

                expect(document).to.contain("Write &amp;amp; for &amp; in HTML");
                expect(document).to.contain("R&amp;amp;D &amp; more");
            });

            it("should keep a literal &amp; and &lt; in the template's attributes and in a patch's", async () => {
                const template = await Packer.toBuffer(
                    new File({
                        sections: [
                            {
                                children: [
                                    new Paragraph({ children: [new Bookmark({ id: "Q&amp;A &lt;1&gt;", children: [new TextRun("A")] })] }),
                                    new Paragraph("{{patch}}"),
                                ],
                            },
                        ],
                    }),
                );
                const zip = await JSZip.loadAsync(
                    await patchDocument({
                        outputType: "nodebuffer",
                        data: template,
                        patches: {
                            patch: {
                                type: PatchType.PARAGRAPH,
                                children: [new Bookmark({ id: "R&amp;D & <2>", children: [new TextRun("B")] })],
                            },
                        },
                    }),
                );
                const document = (await zip.file("word/document.xml")?.async("text")) ?? "";

                expect(document).to.contain('w:name="Q&amp;amp;A &amp;lt;1&amp;gt;"');
                expect(document).to.contain('w:name="R&amp;amp;D &amp; &lt;2&gt;"');
            });
        });

        describe("A part whose relationships part is empty", () => {
            it("should add the relationships of its patches, such as an image's in a header", async () => {
                // docx writes an empty <Relationships/> for a header that refers to nothing
                const template = await Packer.toBuffer(
                    new File({
                        sections: [{ headers: { default: new Header({ children: [new Paragraph("{{image}}")] }) }, children: [] }],
                    }),
                );
                const output = await patchDocument({
                    outputType: "nodebuffer",
                    data: template,
                    patches: {
                        image: {
                            type: PatchType.PARAGRAPH,
                            children: [new ImageRun({ type: "png", data: Buffer.from(""), transformation: { width: 100, height: 100 } })],
                        },
                    },
                });
                const zip = await JSZip.loadAsync(output);

                expect(await zip.file("word/_rels/header1.xml.rels")?.async("text")).to.match(
                    /<Relationship Id="rId1" Type="http:\/\/schemas.openxmlformats.org\/officeDocument\/2006\/relationships\/image" Target="media\/[^"]+\.png"\/>/,
                );
            });
        });

        describe("A patch that adds a part to the package", () => {
            const CHART_TYPE = "application/vnd.openxmlformats-officedocument.drawingml.chart+xml";
            const CHART_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart";
            const PACKAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";

            // Refers to a part, and adds it to the package when it is written, as ChartRun from docx/charts does
            class PartReference extends XmlComponent {
                public constructor(
                    name: string,
                    private readonly part: PackagePart,
                ) {
                    super(name);
                    this.root.push(part.relationshipId);
                }

                public prepForXml(context: IContext): IXmlableObject | undefined {
                    this.part.addTo(context);
                    return super.prepForXml(context);
                }
            }

            // A chart, with its workbook
            const createChart = (): { readonly chart: PackagePart; readonly workbook: PackagePart } => {
                const workbook = new PackagePart({
                    folder: "embeddings",
                    name: "Microsoft_Excel_Worksheet",
                    extension: "xlsx",
                    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    relationshipType: PACKAGE_RELATIONSHIP,
                    content: new Uint8Array([1, 2, 3]),
                });
                const chart = new PackagePart({
                    folder: "charts",
                    name: "chart",
                    extension: "xml",
                    contentType: CHART_TYPE,
                    relationshipType: CHART_RELATIONSHIP,
                    content: new BuilderElement({ name: "c:chartSpace", children: [new PartReference("c:externalData", workbook)] }),
                });
                return { chart, workbook };
            };

            const runWith = (part: PackagePart): Run => {
                const run = new Run({});
                run.addChildElement(new PartReference("c:chart", part));
                return run;
            };

            const patchWith = async (template: Buffer, patches: Readonly<Record<string, IPatch>>): Promise<JSZip> =>
                JSZip.loadAsync(await patchDocument({ outputType: "nodebuffer", data: template, patches }));

            const read = async (zip: JSZip, path: string): Promise<string | undefined> => {
                const text = await zip.file(path)?.async("text");
                return text;
            };

            it("should write the part, the parts it refers to, their content types and the relationships to them", async () => {
                const template = await Packer.toBuffer(new File({ sections: [{ children: [new Paragraph("{{chart}}")] }] }));
                const { chart, workbook } = createChart();
                const zip = await patchWith(template, { chart: { type: PatchType.PARAGRAPH, children: [runWith(chart)] } });

                expect(await read(zip, "word/document.xml")).to.contain(`<c:chart>${chart.relationshipId}</c:chart>`);
                expect(await read(zip, "word/_rels/document.xml.rels")).to.contain(
                    `<Relationship Id="${chart.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart1.xml"/>`,
                );
                expect(await read(zip, "word/charts/chart1.xml")).to.equal(
                    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace><c:externalData>${workbook.relationshipId}</c:externalData></c:chartSpace>`,
                );
                expect(await read(zip, "word/charts/_rels/chart1.xml.rels")).to.equal(
                    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
                        `<Relationship Id="${workbook.relationshipId}" Type="${PACKAGE_RELATIONSHIP}" Target="../embeddings/Microsoft_Excel_Worksheet1.xlsx"/></Relationships>`,
                );
                expect(await zip.file("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")?.async("uint8array")).to.deep.equal(
                    new Uint8Array([1, 2, 3]),
                );

                const contentTypes = await read(zip, "[Content_Types].xml");
                expect(contentTypes).to.contain(`<Override ContentType="${CHART_TYPE}" PartName="/word/charts/chart1.xml"/>`);
                expect(contentTypes).to.contain(
                    '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" PartName="/word/embeddings/Microsoft_Excel_Worksheet1.xlsx"/>',
                );
            });

            it("should number the parts after the template's own, and add a part once however often it is used", async () => {
                const own = createChart();
                const template = await Packer.toBuffer(
                    new File({
                        sections: [
                            {
                                headers: { default: new Header({ children: [new Paragraph("{{header}}")] }) },
                                children: [
                                    new Paragraph({ children: [runWith(own.chart)] }),
                                    new Paragraph("{{chart}} and {{chart}}"),
                                    new Paragraph("{{other}}"),
                                ],
                            },
                        ],
                    }),
                );
                const first = createChart();
                const second = createChart();
                const zip = await patchWith(template, {
                    chart: { type: PatchType.PARAGRAPH, children: [runWith(first.chart)] },
                    other: { type: PatchType.DOCUMENT, children: [new Paragraph({ children: [runWith(second.chart)] })] },
                    header: { type: PatchType.PARAGRAPH, children: [runWith(first.chart)] },
                });

                expect(Object.keys(zip.files).filter((path) => /^word\/(charts|embeddings)\/[^/]+$/.test(path))).to.include.members([
                    "word/charts/chart1.xml",
                    "word/charts/chart2.xml",
                    "word/charts/chart3.xml",
                    "word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
                    "word/embeddings/Microsoft_Excel_Worksheet2.xlsx",
                    "word/embeddings/Microsoft_Excel_Worksheet3.xlsx",
                ]);
                expect(zip.file("word/charts/chart4.xml")).to.equal(null);
                expect(await read(zip, "word/charts/chart2.xml")).to.contain(first.workbook.relationshipId);
                expect(await read(zip, "word/charts/chart3.xml")).to.contain(second.workbook.relationshipId);
                expect(await read(zip, "word/charts/_rels/chart2.xml.rels")).to.contain(
                    'Target="../embeddings/Microsoft_Excel_Worksheet2.xlsx"',
                );

                const relationships = await read(zip, "word/_rels/document.xml.rels");
                expect(relationships?.split(first.chart.relationshipId)).to.have.length(2);
                expect(relationships).to.contain(
                    `Id="${first.chart.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart2.xml"`,
                );
                expect(relationships).to.contain(
                    `Id="${second.chart.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart3.xml"`,
                );
                expect(await read(zip, "word/_rels/header1.xml.rels")).to.contain(
                    `Id="${first.chart.relationshipId}" Type="${CHART_RELATIONSHIP}" Target="charts/chart2.xml"`,
                );
                expect((await read(zip, "[Content_Types].xml"))?.split('PartName="/word/charts/chart2.xml"')).to.have.length(2);
            });

            it("should throw when the document has no content types", async () => {
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(
                    new JSZip().file(
                        "word/document.xml",
                        `<w:document><w:body><w:p><w:r><w:t>{{chart}}</w:t></w:r></w:p></w:body></w:document>`,
                    ),
                );

                await expect(
                    patchDocument({
                        outputType: "nodebuffer",
                        data: Buffer.from(""),
                        patches: { chart: { type: PatchType.PARAGRAPH, children: [runWith(createChart().chart)] } },
                    }),
                ).rejects.toThrow("Could not find content types file");
                vi.restoreAllMocks();
            });
        });

        describe("Bookmarks", () => {
            // Patches a template with this body, and a header if there is one, and returns a reader for the patched parts
            const patchTemplate = async (
                { body, header }: { readonly body: string; readonly header?: string },
                patches: Readonly<Record<string, IPatch>>,
            ): Promise<(path: string) => Promise<string | undefined>> => {
                const template = new JSZip()
                    .file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`)
                    .file("word/document.xml", `<w:document><w:body>${body}</w:body></w:document>`);
                if (header) {
                    template.file("word/header1.xml", `<w:hdr>${header}</w:hdr>`);
                }
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(template);

                const output = await patchDocument({ outputType: "uint8array", data: Buffer.from(""), patches });
                // `JSZip.loadAsync` is mocked; the instance method reads the real output
                const zip = await new JSZip().loadAsync(output);
                return (path) => zip.file(path)?.async("text") ?? Promise.resolve(undefined);
            };

            // The id the bookmark was given when it was created
            const bookmarkIdOf = (bookmark: Bookmark): number => new Formatter().format(bookmark.start)["w:bookmarkStart"]._attr["w:id"];

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should insert a bookmark in a paragraph patch as its start, its children and its end", async () => {
                const read = await patchTemplate(
                    { body: `<w:p><w:r><w:t>See {{anchor}} now</w:t></w:r></w:p>` },
                    { anchor: { type: PatchType.PARAGRAPH, children: [new Bookmark({ id: "anchor", children: [new TextRun("here")] })] } },
                );

                const document = toJson((await read("word/document.xml"))!);
                const paragraph = document.elements![0].elements![0].elements![0];
                const [left, start, text, end, right] = paragraph.elements!;

                expect(traverse(document).map((p) => p.text)).to.deep.equal(["See here now"]);
                expect([left, start, text, end, right].map((e) => e.name)).to.deep.equal([
                    "w:r",
                    "w:bookmarkStart",
                    "w:r",
                    "w:bookmarkEnd",
                    "w:r",
                ]);
                expect(start.attributes!["w:name"]).to.equal("anchor");
                expect(end.attributes!["w:id"]).to.equal(start.attributes!["w:id"]);
            });

            it("should insert a bookmark in a bookmark in a paragraph patch", async () => {
                const read = await patchTemplate(
                    { body: `<w:p><w:r><w:t>{{anchor}}</w:t></w:r></w:p>` },
                    {
                        anchor: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new Bookmark({
                                    id: "outer",
                                    children: [new TextRun("A"), new Bookmark({ id: "inner", children: [new TextRun("B")] })],
                                }),
                            ],
                        },
                    },
                );

                const document = (await read("word/document.xml"))!;
                expect(document.match(/<w:bookmark(Start|End)[^>]*\/>/g)).to.have.length(4);
                expect(document).to.match(
                    /<w:bookmarkStart w:name="outer" w:id="(\d+)"\/><w:r>.*?A.*?<\/w:r><w:bookmarkStart w:name="inner" w:id="(\d+)"\/><w:r>.*?B.*?<\/w:r><w:bookmarkEnd w:id="\2"\/><w:bookmarkEnd w:id="\1"\/>/,
                );
            });

            it("should add the relationship of a hyperlink in a bookmark in a paragraph patch", async () => {
                const read = await patchTemplate(
                    { body: `<w:p><w:r><w:t>{{link}}</w:t></w:r></w:p>` },
                    {
                        link: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new Bookmark({
                                    id: "link",
                                    children: [new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("Example")] })],
                                }),
                            ],
                        },
                    },
                );

                const [, relationshipId] = (await read("word/document.xml"))!.match(
                    /<w:bookmarkStart [^>]*\/><w:hyperlink [^>]*r:id="([^"]+)"/,
                )!;
                expect(await read("word/_rels/document.xml.rels")).to.match(
                    new RegExp(`Id="${relationshipId}"[^>]*Target="https://example.com" TargetMode="External"`),
                );
            });

            it("should give an inserted bookmark a new id when the template already uses its id, in any part", async () => {
                const bookmark = new Bookmark({ id: "inserted", children: [new TextRun("B")] });
                const id = bookmarkIdOf(bookmark);
                const read = await patchTemplate(
                    {
                        body:
                            `<w:p><w:bookmarkStart w:id="${id}" w:name="existing"/><w:r><w:t>A</w:t></w:r><w:bookmarkEnd w:id="${id}"/></w:p>` +
                            `<w:p><w:r><w:t>{{slot}}</w:t></w:r></w:p>`,
                        header: `<w:p><w:bookmarkStart w:id="${id + 1}" w:name="header"/><w:bookmarkEnd w:id="${id + 1}"/></w:p>`,
                    },
                    { slot: { type: PatchType.DOCUMENT, children: [new Paragraph({ children: [bookmark] })] } },
                );

                const document = (await read("word/document.xml"))!;
                expect(document).to.contain(`<w:bookmarkStart w:id="${id}" w:name="existing"/>`);
                expect(document).to.contain(`<w:bookmarkStart w:name="inserted" w:id="${id + 2}"/>`);
                expect(document.match(/<w:bookmarkEnd w:id="\d+"\/>/g)).to.deep.equal([
                    `<w:bookmarkEnd w:id="${id}"/>`,
                    `<w:bookmarkEnd w:id="${id + 2}"/>`,
                ]);
            });

            it("should keep an inserted bookmark's id when the template does not use it", async () => {
                const bookmark = new Bookmark({ id: "inserted", children: [new TextRun("B")] });
                const id = bookmarkIdOf(bookmark);
                const read = await patchTemplate(
                    {
                        body:
                            `<w:p><w:bookmarkStart w:id="${id + 100}" w:name="existing"/><w:bookmarkEnd w:id="${id + 100}"/></w:p>` +
                            `<w:p><w:r><w:t>{{slot}}</w:t></w:r></w:p>`,
                    },
                    { slot: { type: PatchType.DOCUMENT, children: [new Paragraph({ children: [bookmark] })] } },
                );

                expect(await read("word/document.xml")).to.contain(`<w:bookmarkStart w:name="inserted" w:id="${id}"/>`);
            });
        });

        describe("Table rows", () => {
            // Patches a template with this body, and a header if there is one, and returns a reader for the patched parts
            const patchTemplate = async (
                { body, header }: { readonly body: string; readonly header?: string },
                patches: PatchDocumentOptions["patches"],
            ): Promise<(path: string) => Promise<string | undefined>> => {
                const template = new JSZip()
                    .file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`)
                    .file("word/document.xml", `<w:document><w:body>${body}</w:body></w:document>`);
                if (header) {
                    template.file("word/header1.xml", `<w:hdr>${header}</w:hdr>`);
                }
                vi.spyOn(JSZip, "loadAsync").mockResolvedValue(template);

                const output = await patchDocument({ outputType: "uint8array", data: Buffer.from(""), patches });
                // `JSZip.loadAsync` is mocked; the instance method reads the real output
                const zip = await new JSZip().loadAsync(output);
                return (path) => zip.file(path)?.async("text") ?? Promise.resolve(undefined);
            };

            const text = (value: string): IPatch => ({ type: PatchType.PARAGRAPH, children: [new TextRun(value)] });
            const cell = (value: string): string => `<w:tc><w:p><w:r><w:t>${value}</w:t></w:r></w:p></w:tc>`;
            const TABLE = `<w:tbl><w:tblPr/><w:tblGrid/><w:tr>${cell("Name")}${cell("Price")}</w:tr><w:tr>${cell("{{items.name}}")}${cell("{{currency}}{{items.price}}")}</w:tr></w:tbl>`;
            const textsOf = (xml: string | undefined): readonly string[] => traverse(toJson(xml!)).map((p) => p.text);

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("should repeat the rows, and then patch the other placeholders in every copy, whatever the order of the patches", async () => {
                const read = await patchTemplate(
                    { body: TABLE },
                    {
                        currency: text("£"),
                        items: {
                            type: PatchType.TABLE_ROWS,
                            rows: [
                                { name: text("Apples"), price: text("1.20") },
                                { name: text("Pears"), price: undefined },
                            ],
                        },
                    },
                );

                expect(textsOf(await read("word/document.xml"))).to.deep.equal(["Name", "Price", "Apples", "£1.20", "Pears", "£"]);
            });

            it("should repeat the rows of a table in a header", async () => {
                const read = await patchTemplate(
                    { body: "<w:p/>", header: TABLE },
                    { items: { type: PatchType.TABLE_ROWS, rows: [{ name: text("Apples"), price: text("1.20") }] } },
                );

                expect(textsOf(await read("word/header1.xml"))).to.deep.equal(["Name", "Price", "Apples", "{{currency}}1.20"]);
            });

            it("should add a relationship for the hyperlink in each copy of a row", async () => {
                const link = (url: string): IPatch => ({
                    type: PatchType.PARAGRAPH,
                    children: [new ExternalHyperlink({ link: url, children: [new TextRun(url)] })],
                });
                const read = await patchTemplate(
                    { body: TABLE },
                    {
                        items: {
                            type: PatchType.TABLE_ROWS,
                            rows: [{ name: link("https://example.com/apples") }, { name: link("https://example.com/pears") }],
                        },
                    },
                );

                const relationshipIds = [...(await read("word/document.xml"))!.matchAll(/<w:hyperlink [^>]*r:id="([^"]+)"/g)].map(
                    (m) => m[1],
                );
                const relationships = (await read("word/_rels/document.xml.rels"))!;
                expect(relationshipIds).to.have.length(2);
                expect(relationships).to.match(new RegExp(`Id="${relationshipIds[0]}"[^>]*Target="https://example.com/apples"`));
                expect(relationships).to.match(new RegExp(`Id="${relationshipIds[1]}"[^>]*Target="https://example.com/pears"`));
            });

            it("should throw for a row's field that isn't a patch, naming the field", async () => {
                await expect(
                    patchTemplate(
                        { body: TABLE },
                        { items: { type: PatchType.TABLE_ROWS, rows: [{ name: "Apples" as unknown as IPatch }] } },
                    ),
                ).rejects.toThrow(
                    'Invalid patch "items.name". Expected { type: PatchType.PARAGRAPH or PatchType.DOCUMENT, children: [...] }, or { type: PatchType.TABLE_ROWS, rows: [...] }',
                );
            });

            it("should throw for a drawing patch for a row's field", async () => {
                const drawing = { type: PatchType.DRAWING, patch: () => undefined } as unknown as IPatch;
                await expect(
                    patchTemplate({ body: TABLE }, { items: { type: PatchType.TABLE_ROWS, rows: [{ name: drawing }] } }),
                ).rejects.toThrow('Invalid patch "items.name"');
            });

            it("should throw for rows that aren't objects, or a table rows patch without rows", async () => {
                await expect(
                    patchTemplate(
                        { body: TABLE },
                        { items: { type: PatchType.TABLE_ROWS, rows: [null as unknown as TableRowsPatch["rows"][number]] } },
                    ),
                ).rejects.toThrow('Invalid patch "items". Expected each of its rows to be an object of patches');
                await expect(
                    patchTemplate({ body: TABLE }, { items: { type: PatchType.TABLE_ROWS } as unknown as TableRowsPatch }),
                ).rejects.toThrow('Invalid patch "items"');
            });
        });

        describe("Footnotes and endnotes", () => {
            const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
            const FOOTNOTES_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes";
            const FOOTNOTE_MARK = `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteRef/></w:r>`;

            // A template made in Word without footnotes or endnotes, which has no part for them
            const templateWithoutNotes = ({
                body,
                relationships = true,
                styles,
            }: {
                readonly body: string;
                readonly relationships?: boolean;
                readonly styles?: string;
            }): JSZip => {
                const template = new JSZip()
                    .file(
                        "[Content_Types].xml",
                        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>`,
                    )
                    .file("word/document.xml", `<w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`);
                if (relationships) {
                    template.file(
                        "word/_rels/document.xml.rels",
                        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
                    );
                }
                if (styles !== undefined) {
                    template.file("word/styles.xml", `<w:styles xmlns:w="${W}">${styles}</w:styles>`);
                }
                return template;
            };

            const patchWith = async (
                template: Buffer | JSZip,
                options: Omit<Parameters<typeof patchDocument>[0], "outputType" | "data">,
            ): Promise<(path: string) => Promise<string | undefined>> => {
                const zip = await JSZip.loadAsync(await patchDocument({ outputType: "nodebuffer", data: template, ...options }));
                return (path) => zip.file(path)?.async("text") ?? Promise.resolve(undefined);
            };

            const noteWithText = (text: string): { readonly children: readonly Paragraph[] } => ({ children: [new Paragraph(text)] });

            it("should write a footnote for a reference a patch inserts, with an id the template's footnotes don't have", async () => {
                const template = await Packer.toBuffer(
                    new File({
                        sections: [
                            {
                                children: [
                                    new Paragraph({ children: [new TextRun("Existing"), new FootnoteReferenceRun(1)] }),
                                    new Paragraph("{{note}}"),
                                ],
                            },
                        ],
                        footnotes: { 1: noteWithText("Existing footnote") },
                    }),
                );
                const read = await patchWith(template, {
                    patches: { note: { type: PatchType.PARAGRAPH, children: [new TextRun("New"), new FootnoteReferenceRun(1)] } },
                    footnotes: { 1: noteWithText("New footnote") },
                });

                const document = (await read("word/document.xml"))!;
                expect(document.match(/<w:footnoteReference w:id="\d+"\/>/g)).to.deep.equal([
                    '<w:footnoteReference w:id="1"/>',
                    '<w:footnoteReference w:id="2"/>',
                ]);
                expect(document).to.match(
                    /New<\/w:t><\/w:r><w:r><w:rPr><w:rStyle w:val="FootnoteReference"\/><\/w:rPr><w:footnoteReference w:id="2"\/>/,
                );

                const footnotes = (await read("word/footnotes.xml"))!;
                expect(footnotes.match(/<w:footnote [^>]*>/g)).to.deep.equal([
                    '<w:footnote w:type="separator" w:id="-1">',
                    '<w:footnote w:type="continuationSeparator" w:id="0">',
                    '<w:footnote w:id="1">',
                    '<w:footnote w:id="2">',
                ]);
                expect(footnotes).to.contain("Existing footnote");
                expect(footnotes).to.contain(
                    `<w:footnote w:id="2"><w:p>${FOOTNOTE_MARK}<w:r><w:t xml:space="preserve">New footnote</w:t></w:r></w:p></w:footnote>`,
                );

                // The template already has the footnotes' part, and the footnote styles
                expect((await read("word/_rels/document.xml.rels"))?.split(FOOTNOTES_RELATIONSHIP)).to.have.length(2);
                expect((await read("[Content_Types].xml"))?.split('PartName="/word/footnotes.xml"')).to.have.length(2);
                expect((await read("word/styles.xml"))?.split('w:styleId="FootnoteReference"')).to.have.length(2);
            });

            it("should add a part for the footnotes, its relationship, its content type and the missing footnote styles to a template without them", async () => {
                const read = await patchWith(
                    templateWithoutNotes({
                        body: `<w:p><w:r><w:t>{{note}}</w:t></w:r></w:p>`,
                        styles: `<w:style w:type="character" w:styleId="FootnoteReference"><w:name w:val="footnote reference"/><w:rPr><w:b/></w:rPr></w:style>`,
                    }),
                    {
                        patches: { note: { type: PatchType.PARAGRAPH, children: [new FootnoteReferenceRun(1)] } },
                        footnotes: { 1: noteWithText("A footnote") },
                    },
                );

                expect(await read("word/document.xml")).to.contain('<w:footnoteReference w:id="1"/>');
                const footnotes = (await read("word/footnotes.xml"))!;
                expect(footnotes).to.match(/^<\?xml version="1.0" encoding="UTF-8" standalone="yes"\?><w:footnotes [^>]*xmlns:w="[^"]+"/);
                expect(footnotes.match(/<w:footnote [^>]*>/g)).to.deep.equal([
                    '<w:footnote w:type="separator" w:id="-1">',
                    '<w:footnote w:type="continuationSeparator" w:id="0">',
                    '<w:footnote w:id="1">',
                ]);
                expect(footnotes).to.contain("A footnote");

                expect(await read("word/_rels/document.xml.rels")).to.match(
                    /<Relationship Id="rId[^"]+" Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/footnotes" Target="footnotes\.xml"\/>/,
                );
                expect(await read("[Content_Types].xml")).to.contain(
                    '<Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml" PartName="/word/footnotes.xml"/>',
                );

                // The template's own footnote reference style is kept
                const styles = (await read("word/styles.xml"))!;
                expect(styles.match(/w:styleId="[^"]+"/g)).to.deep.equal([
                    'w:styleId="FootnoteReference"',
                    'w:styleId="FootnoteText"',
                    'w:styleId="FootnoteTextChar"',
                ]);
                expect(styles).to.contain("<w:b/>");
            });

            it("should write endnotes as footnotes, adding the relationships part to a template without one", async () => {
                const read = await patchWith(
                    templateWithoutNotes({ body: `<w:p><w:r><w:t>{{note}}</w:t></w:r></w:p>`, relationships: false, styles: "" }),
                    {
                        patches: { note: { type: PatchType.PARAGRAPH, children: [new TextRun("Text"), new EndnoteReferenceRun(3)] } },
                        endnotes: { 3: noteWithText("An endnote") },
                    },
                );

                expect(await read("word/document.xml")).to.contain('<w:endnoteReference w:id="1"/>');
                const endnotes = (await read("word/endnotes.xml"))!;
                expect(endnotes.match(/<w:endnote [^>]*>/g)).to.deep.equal([
                    '<w:endnote w:type="separator" w:id="-1">',
                    '<w:endnote w:type="continuationSeparator" w:id="0">',
                    '<w:endnote w:id="1">',
                ]);
                expect(endnotes).to.contain(
                    `<w:endnote w:id="1"><w:p><w:r><w:rPr><w:rStyle w:val="EndnoteReference"/></w:rPr><w:endnoteRef/></w:r><w:r><w:t xml:space="preserve">An endnote</w:t></w:r></w:p></w:endnote>`,
                );
                expect(await read("word/_rels/document.xml.rels")).to.match(
                    /<Relationship Id="rId[^"]+" Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/endnotes" Target="endnotes\.xml"\/>/,
                );
                expect(await read("[Content_Types].xml")).to.contain('PartName="/word/endnotes.xml"');
                expect((await read("word/styles.xml"))?.match(/w:styleId="[^"]+"/g)).to.deep.equal([
                    'w:styleId="EndnoteText"',
                    'w:styleId="EndnoteTextChar"',
                    'w:styleId="EndnoteReference"',
                ]);
                expect(await read("word/footnotes.xml")).to.equal(undefined);
            });

            it("should give each reference a footnote of its own when a placeholder is patched more than once", async () => {
                const read = await patchWith(
                    templateWithoutNotes({
                        body: `<w:p><w:r><w:t>{{note}} and {{note}}</w:t></w:r></w:p><w:p><w:r><w:t>{{block}}</w:t></w:r></w:p>`,
                    }),
                    {
                        patches: {
                            note: { type: PatchType.PARAGRAPH, children: [new FootnoteReferenceRun(1)] },
                            block: {
                                type: PatchType.DOCUMENT,
                                children: [new Paragraph({ children: [new TextRun("Block"), new FootnoteReferenceRun(1)] })],
                            },
                        },
                        footnotes: {
                            1: {
                                children: [
                                    new Paragraph({
                                        children: [
                                            new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("Source")] }),
                                        ],
                                    }),
                                ],
                            },
                        },
                    },
                );

                const ids = (await read("word/document.xml"))!.match(/<w:footnoteReference w:id="(\d+)"\/>/g);
                expect(ids).to.have.length(3);
                expect(new Set(ids).size).to.equal(3);

                // The footnote's hyperlink is added once, and each copy of it refers to it
                const footnotes = (await read("word/footnotes.xml"))!;
                expect(footnotes.match(/<w:footnote w:id="\d+">/g)).to.deep.equal([
                    '<w:footnote w:id="1">',
                    '<w:footnote w:id="2">',
                    '<w:footnote w:id="3">',
                ]);
                const [, relationshipId] = footnotes.match(/<w:hyperlink [^>]*r:id="([^"]+)"/)!;
                expect(footnotes.split(`r:id="${relationshipId}"`)).to.have.length(4);
                const relationships = (await read("word/_rels/footnotes.xml.rels"))!;
                expect(relationships.match(/<Relationship /g)).to.have.length(1);
                expect(relationships).to.contain(`Id="${relationshipId}"`);
            });

            it("should leave a reference to a footnote that isn't given as it is, and only write the footnotes that are referred to", async () => {
                const template = await Packer.toBuffer(new File({ sections: [{ children: [new Paragraph("{{note}}")] }] }));
                const read = await patchWith(template, {
                    patches: { note: { type: PatchType.PARAGRAPH, children: [new FootnoteReferenceRun(5)] } },
                    footnotes: { 1: noteWithText("Not referred to") },
                    endnotes: { 1: noteWithText("Not referred to either") },
                });

                expect(await read("word/document.xml")).to.contain('<w:footnoteReference w:id="5"/>');
                expect(await read("word/footnotes.xml")).not.to.contain("Not referred to");
                expect(await read("word/endnotes.xml")).not.to.contain("Not referred to either");
            });

            it("should start a footnote with its number, after its first paragraph's properties", async () => {
                const read = await patchWith(templateWithoutNotes({ body: `<w:p><w:r><w:t>{{note}}</w:t></w:r></w:p>` }), {
                    patches: {
                        note: { type: PatchType.PARAGRAPH, children: [new FootnoteReferenceRun(1), new FootnoteReferenceRun(2)] },
                    },
                    footnotes: {
                        1: { children: [new Paragraph({ style: "FootnoteText", text: "First" }), new Paragraph("Second")] },
                        2: { children: [new Paragraph({})] },
                    },
                });

                const footnotes = (await read("word/footnotes.xml"))!;
                expect(footnotes).to.contain(
                    `<w:footnote w:id="1"><w:p><w:pPr><w:pStyle w:val="FootnoteText"/></w:pPr>${FOOTNOTE_MARK}<w:r><w:t xml:space="preserve">First</w:t></w:r></w:p>` +
                        `<w:p><w:r><w:t xml:space="preserve">Second</w:t></w:r></w:p></w:footnote>`,
                );
                expect(footnotes).to.contain(`<w:footnote w:id="2"><w:p>${FOOTNOTE_MARK}</w:p></w:footnote>`);
            });

            it("should not change the footnotes' paragraphs, so they can be given to patchDocument again", async () => {
                const footnotes = { 1: noteWithText("Reused") };
                const patchOnce = async (): Promise<string | undefined> => {
                    const read = await patchWith(templateWithoutNotes({ body: `<w:p><w:r><w:t>{{note}}</w:t></w:r></w:p>` }), {
                        patches: { note: { type: PatchType.PARAGRAPH, children: [new FootnoteReferenceRun(1)] } },
                        footnotes,
                    });
                    return read("word/footnotes.xml");
                };

                await patchOnce();
                expect(await patchOnce()).to.contain(
                    `<w:footnote w:id="1"><w:p>${FOOTNOTE_MARK}<w:r><w:t xml:space="preserve">Reused</w:t></w:r></w:p></w:footnote>`,
                );
            });

            it("should add the relationship of an image in a footnote to the footnotes' relationships", async () => {
                const read = await patchWith(templateWithoutNotes({ body: `<w:p><w:r><w:t>{{note}}</w:t></w:r></w:p>` }), {
                    patches: { note: { type: PatchType.PARAGRAPH, children: [new FootnoteReferenceRun(1)] } },
                    footnotes: {
                        1: {
                            children: [
                                new Paragraph({
                                    children: [
                                        new ImageRun({ type: "png", data: Buffer.from(""), transformation: { width: 10, height: 10 } }),
                                    ],
                                }),
                            ],
                        },
                    },
                });

                const [, relationshipId] = (await read("word/footnotes.xml"))!.match(/<a:blip r:embed="([^"]+)"/)!;
                expect(await read("word/_rels/footnotes.xml.rels")).to.match(
                    new RegExp(
                        `<Relationship Id="${relationshipId}" Type="http://schemas\\.openxmlformats\\.org/officeDocument/2006/relationships/image" Target="media/[^"]+\\.png"/>`,
                    ),
                );
                expect(await read("word/_rels/document.xml.rels")).not.to.contain("relationships/image");
            });
        });

        describe("Page numbers", () => {
            const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
            // A page reference, with the page Word wrote for it before the template was patched
            const PAGE_REFERENCE =
                '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGEREF _Toc1 \\h </w:instrText></w:r>' +
                '<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>9</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>';
            const template = (): JSZip =>
                new JSZip()
                    .file("[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>`)
                    .file(
                        "word/document.xml",
                        `<w:document xmlns:w="${W}"><w:body><w:p>${PAGE_REFERENCE}</w:p><w:p><w:r><w:t>{{name}}</w:t></w:r></w:p></w:body></w:document>`,
                    );
            const patches = { name: { type: PatchType.PARAGRAPH, children: [new TextRun("Ada")] } } as const;
            const documentOf = async (output: Buffer): Promise<string> =>
                (await JSZip.loadAsync(output)).file("word/document.xml")!.async("text");

            it("should write the page numbers the estimator works out for the patched template", async () => {
                const pageNumbers = vi.fn(({ parts }: { readonly parts: ReadonlyMap<string, unknown> }) => {
                    // The estimate is of the template once it is patched
                    expect(JSON.stringify(parts.get("word/document.xml"))).to.contain("Ada");
                    return { bookmarks: new Map([["_Toc1", "4"]]) };
                });
                const document = await documentOf(
                    await patchDocument({ outputType: "nodebuffer", data: template(), patches, pageNumbers }),
                );
                expect(pageNumbers).toHaveBeenCalledOnce();
                expect(document).to.contain('<w:fldChar w:fldCharType="separate"/><w:t xml:space="preserve">4</w:t></w:r><w:r/>');
                expect(document).not.to.contain("<w:t>9</w:t>");
            });

            it("should leave the template's page numbers as they are without an estimator", async () => {
                expect(await documentOf(await patchDocument({ outputType: "nodebuffer", data: template(), patches }))).to.contain(
                    "<w:t>9</w:t>",
                );
            });
        });
    });
});
