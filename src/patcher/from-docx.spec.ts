import * as chai from "chai";
import * as sinon from "sinon";
import * as JSZip from "jszip";
import * as chaiAsPromised from "chai-as-promised";

import { ExternalHyperlink, ImageRun, Paragraph, TextRun } from "@file/paragraph";

import { patchDocument, PatchType } from "./from-docx";

chai.use(chaiAsPromised);
const { expect } = chai;

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
            before(() => {
                sinon.createStubInstance(JSZip, {});
                sinon.stub(JSZip, "loadAsync").callsFake(
                    () =>
                        new Promise<JSZip>((resolve) => {
                            const zip = new JSZip();

                            zip.file("word/document.xml", MOCK_XML);
                            zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                            resolve(zip);
                        }),
                );
            });

            after(() => {
                (JSZip.loadAsync as unknown as sinon.SinonStub).restore();
            });

            it("should patch the document", async () => {
                const output = await patchDocument(Buffer.from(""), {
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
                const output = await patchDocument(Buffer.from(""), {
                    patches: {},
                });
                expect(output).to.not.be.undefined;
            });
        });

        describe("document.xml and [Content_Types].xml with relationships", () => {
            before(() => {
                sinon.createStubInstance(JSZip, {});
                sinon.stub(JSZip, "loadAsync").callsFake(
                    () =>
                        new Promise<JSZip>((resolve) => {
                            const zip = new JSZip();

                            zip.file("word/document.xml", MOCK_XML);
                            zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                            zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`);
                            resolve(zip);
                        }),
                );
            });

            after(() => {
                (JSZip.loadAsync as unknown as sinon.SinonStub).restore();
            });

            it("should use the relationships file rather than create one", async () => {
                const output = await patchDocument(Buffer.from(""), {
                    patches: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        image_test: {
                            type: PatchType.PARAGRAPH,
                            children: [
                                new ImageRun({
                                    data: Buffer.from(""),
                                    transformation: { width: 100, height: 100 },
                                }),
                            ],
                        },
                    },
                });
                expect(output).to.not.be.undefined;
            });
        });

        describe("document.xml", () => {
            before(() => {
                sinon.createStubInstance(JSZip, {});
                sinon.stub(JSZip, "loadAsync").callsFake(
                    () =>
                        new Promise<JSZip>((resolve) => {
                            const zip = new JSZip();

                            zip.file("word/document.xml", MOCK_XML);
                            resolve(zip);
                        }),
                );
            });

            after(() => {
                (JSZip.loadAsync as unknown as sinon.SinonStub).restore();
            });

            it("should throw an error if the content types is not found", () =>
                expect(
                    patchDocument(Buffer.from(""), {
                        patches: {
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            image_test: {
                                type: PatchType.PARAGRAPH,
                                children: [
                                    new ImageRun({
                                        data: Buffer.from(""),
                                        transformation: { width: 100, height: 100 },
                                    }),
                                ],
                            },
                        },
                    }),
                ).to.eventually.be.rejected);
        });
    });
});
