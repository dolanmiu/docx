/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import { Readable } from "stream";
import { describe, expect, it, vi } from "vitest";

import { Document, ExternalHyperlink, InsertedTextRun, Packer, Paragraph, SimpleField, TextRun } from "../index";
import { type IPatch, patchDocument } from "./from-docx";
import { patchDetector } from "./patch-detector";
import { PatchType } from "./patch-type";
import { declaringSize, textOf, unzip, zip } from "../tests/zip";

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

// cspell:disable
const MOCK_XML_2 = `
<w:body>
    <w:tbl>
        <w:tblPr>
            <w:tblStyle w:val="TableGrid" />
            <w:tblW w:w="9350" w:type="dxa" />
            <w:jc w:val="left" />
            <w:tblInd w:w="0" w:type="dxa" />
            <w:tblLayout w:type="fixed" />
            <w:tblCellMar>
                <w:top w:w="0" w:type="dxa" />
                <w:left w:w="108" w:type="dxa" />
                <w:bottom w:w="0" w:type="dxa" />
                <w:right w:w="108" w:type="dxa" />
            </w:tblCellMar>
            <w:tblLook w:firstRow="1" w:noVBand="1" w:lastRow="0" w:firstColumn="1"
                w:lastColumn="0" w:noHBand="0" w:val="04a0" />
        </w:tblPr>
        <w:tblGrid>
            <w:gridCol w:w="3119" />
            <w:gridCol w:w="3141" />
            <w:gridCol w:w="3090" />
        </w:tblGrid>
        <w:tr>
            <w:trPr></w:trPr>
            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="3119" w:type="dxa" />
                    <w:tcBorders>
                        <w:right w:val="nil" />
                    </w:tcBorders>
                    <w:shd w:color="auto" w:fill="D9D9D9" w:themeFill="background1"
                        w:themeFillShade="d9" w:val="clear" />
                </w:tcPr>
                <w:p>
                    <w:pPr>
                        <w:pStyle w:val="NormalSpaceAboveandBelow" />
                        <w:widowControl />
                        <w:spacing w:before="120" w:after="120" />
                        <w:jc w:val="left" />
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                    </w:pPr>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>{{</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>s</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>chool_</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>n</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>ame}}</w:t>
                        <w:br />
                        <w:t>{{</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>a</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>ddr</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>ess</w:t>
                    </w:r>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:eastAsia="Times New Roman" />
                            <w:kern w:val="0" />
                            <w:sz w:val="20" />
                            <w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA" />
                        </w:rPr>
                        <w:t>}}</w:t>
                        <w:br />
                        <w:t>{{</w:t>
                    </w:r>
                </w:p>
            </w:tc>
        </w:tr>
    </w:tbl>
</w:body>
`;
// cspell:enable

describe("patch-detector", () => {
    it("should build only detected registered patches and replace them in a real document", async () => {
        const data = await Packer.toBuffer(
            new Document({
                sections: [{ children: [new Paragraph("Hello {{name}}"), new Paragraph("{{name}}"), new Paragraph("{{unknown}}")] }],
            }),
        );
        const name = vi.fn((): Promise<IPatch> => Promise.resolve({ type: PatchType.PARAGRAPH, children: [new TextRun("Ada")] }));
        const photos = vi.fn((): Promise<IPatch> => Promise.reject(new Error("An absent placeholder must not start expensive work")));
        const builders: Readonly<Record<string, () => Promise<IPatch>>> = { name, photos };
        const keys = await patchDetector({ data });
        const entries = await Promise.all(
            keys.filter((key) => Object.hasOwn(builders, key)).map(async (key) => [key, await builders[key]()] as const),
        );
        const output = await patchDocument({ outputType: "nodebuffer", data, patches: Object.fromEntries(entries) });
        const xml = textOf(unzip(output), "word/document.xml")!;

        expect(keys).toEqual(["name", "unknown"]);
        expect(name).toHaveBeenCalledOnce();
        expect(photos).not.toHaveBeenCalled();
        expect(xml.match(/<w:t[^>]*>Ada<\/w:t>/g)).toHaveLength(2);
        expect(xml).not.toContain("{{name}}");
        expect(xml).toContain("{{unknown}}");
    });

    describe("patchDetector", () => {
        describe("document.xml and [Content_Types].xml", () => {
            it("should patch the document", async () => {
                const output = await patchDetector({
                    data: zip({
                        "word/document.xml": MOCK_XML,
                        "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
                    }),
                });
                expect(output).toMatchObject(["name", "paragraph_replace", "table", "image_test", "table_heading_1", "item_1"]);
            });
        });
    });

    describe("patchDetector", () => {
        describe("document.xml and [Content_Types].xml", () => {
            it("should patch the document", async () => {
                const output = await patchDetector({
                    data: zip({
                        "word/document.xml": MOCK_XML_2,
                        "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
                    }),
                });
                expect(output).toMatchObject(["school_name", "address"]);
            });
        });
    });

    it("should give the keys of placeholders with spaces inside their delimiters without them, with trimPlaceholders", async () => {
        const data = await Packer.toBuffer(
            new Document({
                sections: [{ children: [new Paragraph("{{ name }} {{name}} {{ }} {{first name }}"), new Paragraph("{{\tname}}")] }],
            }),
        );

        expect(await patchDetector({ data, trimPlaceholders: true })).to.deep.equal(["name", "first name"]);
        expect(await patchDetector({ data })).to.deep.equal([" name ", "name", " ", "first name ", "\tname"]);
    });

    describe("with placeholderDelimiters", () => {
        it("should detect the placeholders patchDocument patches with the same delimiters", async () => {
            const data = await Packer.toBuffer(
                new Document({ sections: [{ children: [new Paragraph("Dear <<name>>, {{not a placeholder}}")] }] }),
            );
            const placeholderDelimiters = { start: "<<", end: ">>" };

            const keys = await patchDetector({ data, placeholderDelimiters });
            const output = await patchDocument({
                outputType: "nodebuffer",
                data,
                patches: { name: { type: PatchType.PARAGRAPH, children: [new TextRun("Ada")] } },
                placeholderDelimiters,
            });

            expect(keys).toEqual(["name"]);
            expect(textOf(unzip(output), "word/document.xml")).toMatch(/<w:t[^>]*>Ada<\/w:t>/);
        });

        it("should look for delimiters with characters a regular expression gives a meaning to as they are", async () => {
            const data = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("[[a]] $(b) ((c) .d.")] }] }));

            expect(await patchDetector({ data, placeholderDelimiters: { start: "[[", end: "]]" } })).toEqual(["a"]);
            expect(await patchDetector({ data, placeholderDelimiters: { start: "$(", end: ")" } })).toEqual(["b"]);
            expect(await patchDetector({ data, placeholderDelimiters: { start: ".", end: "." } })).toEqual(["d"]);
        });

        it("should give the keys without the spaces inside the delimiters, with trimPlaceholders", async () => {
            const data = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("<< name >> <<city>>")] }] }));

            expect(await patchDetector({ data, placeholderDelimiters: { start: "<<", end: ">>" }, trimPlaceholders: true })).toEqual([
                "name",
                "city",
            ]);
        });

        it("should throw for a delimiter that is empty or only spaces, as patchDocument does", async () => {
            const data = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("<<name>>")] }] }));

            await expect(patchDetector({ data, placeholderDelimiters: { start: "", end: ">>" } })).rejects.toThrow(
                "Both start and end delimiters must be non-empty strings.",
            );
            await expect(patchDetector({ data, placeholderDelimiters: { start: "<<", end: " " } })).rejects.toThrow(
                "Both start and end delimiters must be non-empty strings.",
            );
        });
    });

    it("should detect and patch placeholders in a template read from a stream", async () => {
        const data = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("Hello {{name}}")] }] }));
        // A stream such as fs.createReadStream gives a template in chunks, and can be read only once
        const streamOf = (): Readable => Readable.from([data.subarray(0, 100), data.subarray(100)]);

        const keys = await patchDetector({ data: streamOf() });
        const output = await patchDocument({
            outputType: "nodebuffer",
            data: streamOf(),
            patches: { name: { type: PatchType.PARAGRAPH, children: [new TextRun("Ada")] } },
        });
        const xml = textOf(unzip(output), "word/document.xml")!;

        expect(keys).toEqual(["name"]);
        expect(xml).toMatch(/<w:t[^>]*>Ada<\/w:t>/);
        expect(xml).not.toContain("{{name}}");
    });

    it("should detect and patch placeholders in a link, a tracked insertion and a field's result, not only in the paragraph", async () => {
        const data = await Packer.toBuffer(
            new Document({
                sections: [
                    {
                        children: [
                            new Paragraph({
                                children: [new ExternalHyperlink({ link: "https://example.com", children: [new TextRun("{{site}}")] })],
                            }),
                            new Paragraph({
                                children: [
                                    new InsertedTextRun({ text: "Dear {{name}},", id: 1, author: "Author", date: "2024-05-01T00:00:00Z" }),
                                ],
                            }),
                            new Paragraph({ children: [new SimpleField("FILENAME", "{{file}}")] }),
                        ],
                    },
                ],
            }),
        );
        const text = (value: string): IPatch => ({ type: PatchType.PARAGRAPH, children: [new TextRun(value)] });

        const keys = await patchDetector({ data });
        const output = await patchDocument({
            outputType: "nodebuffer",
            data,
            patches: { site: text("Example"), name: text("Ada"), file: text("letter.docx") },
        });
        const xml = textOf(unzip(output), "word/document.xml")!;

        expect(keys).toEqual(["site", "name", "file"]);
        expect(xml).not.toContain("{{");
        expect(xml).toMatch(/<w:hyperlink [^>]*>(<w:r>(?:(?!<\/w:r>).)*<\/w:r>)*<w:r><w:t[^>]*>Example<\/w:t>/);
        expect(xml).toMatch(/<w:ins [^>]*>(<w:r>(?:(?!<\/w:r>).)*<\/w:r>)*<w:r><w:t[^>]*>Ada<\/w:t>/);
        expect(xml).toMatch(/<w:fldSimple [^>]*>(<w:r>(?:(?!<\/w:r>).)*<\/w:r>)*<w:r><w:t[^>]*>letter.docx<\/w:t>/);
    });

    it("should read only the parts placeholders can be in, leaving a template's images uninflated", async () => {
        const template = zip({
            "word/document.xml": MOCK_XML_2,
            "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
            "word/media/image1.png": new Uint8Array(1000),
        });
        // An image that would take all the memory there is, if it were inflated
        const damaged = declaringSize(template, "word/media/image1.png", 0xf0000000);

        await expect(patchDocument({ outputType: "nodebuffer", data: damaged, patches: {} })).rejects.toThrow("Corrupted zip");
        expect(await patchDetector({ data: damaged })).toEqual(["school_name", "address"]);
    });

    describe("with JSZip instance", () => {
        it("should accept a JSZip instance directly, reading it through its generateAsync", async () => {
            const template = zip({
                "word/document.xml": MOCK_XML,
                "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
            });

            const output = await patchDetector({
                data: { generateAsync: () => Promise.resolve(template) },
            });
            expect(output).toMatchObject(["name", "paragraph_replace", "table", "image_test", "table_heading_1", "item_1"]);
        });
    });
});
