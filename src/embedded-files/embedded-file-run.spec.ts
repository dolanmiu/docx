import { describe, expect, it, vi } from "vitest";

import { Formatter } from "@export/formatter";
import { File } from "@file/file";
import { Document, Footer, FootnoteReferenceRun, Header, Packer, Paragraph, PatchType, Run, TextRun, patchDocument } from "docx";
import { readCompoundFile } from "tests/compound-file";
import { textOf, unzip, zip } from "tests/zip";

import { EmbeddedFileRun, type EmbeddedFileRunOptions } from "./embedded-file-run";

// A file that starts as a zip file does, as Office's files do
const WORKBOOK = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]);
const PICTURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 4, 5, 6]);

const workbook: EmbeddedFileRunOptions = {
    fileName: "budget.xlsx",
    data: WORKBOOK,
    preview: { type: "png", data: PICTURE },
    transformation: { width: 180, height: 100 },
};

const format = (run: EmbeddedFileRun, file = new File({ sections: [] })): Record<string, unknown> =>
    new Formatter().format(run, { file, viewWrapper: file.Document, stack: [] }) as Record<string, unknown>;

type Element = Record<string, readonly unknown[]>;

// The attributes of an element of the object (`w:object`), by its name
const attributesOf = (run: EmbeddedFileRun, name: string): Record<string, unknown> => {
    const [object] = format(run)["w:r"] as readonly Element[];
    const children = object["w:object"] as readonly Element[];
    const shape = children.find((child) => "v:shape" in child)!["v:shape"] as readonly Element[];
    // An element with only attributes is formatted as an object, and one with children as an array
    const value = name === "w:object" ? children : [...children, ...shape].find((child) => name in child)![name];
    const element = Array.isArray(value) ? value[0] : value;
    return (element as { readonly _attr: Record<string, unknown> })._attr;
};

const pack = async (doc: Document): Promise<ReadonlyMap<string, Uint8Array>> => unzip(await Packer.toBuffer(doc));

const read = (files: ReadonlyMap<string, Uint8Array>, path: string): string => textOf(files, path) ?? "";

describe("EmbeddedFileRun", () => {
    it("should be a run from docx", () => {
        expect(new EmbeddedFileRun(workbook)).toBeInstanceOf(Run);
    });

    describe("#constructor()", () => {
        it("should write the object as Word does: its picture frame, its picture and its OLE data", () => {
            const run = new EmbeddedFileRun(workbook);
            const tree = format(run);
            const { ShapeID: shapeId } = attributesOf(run, "o:OLEObject");

            expect(tree).toStrictEqual({
                "w:r": [
                    {
                        "w:object": [
                            { _attr: { "w:dxaOrig": 2700, "w:dyaOrig": 1500 } },
                            {
                                "v:shapetype": expect.arrayContaining([
                                    { _attr: expect.objectContaining({ id: "_x0000_t75", "o:spt": 75 }) },
                                ]),
                            },
                            {
                                "v:shape": [
                                    { _attr: { id: shapeId, type: "#_x0000_t75", style: "width:135pt;height:75pt", "o:ole": "" } },
                                    {
                                        "v:imagedata": {
                                            _attr: { "r:id": expect.stringMatching(/^rId\{[0-9a-f]+\.png\}$/), "o:title": "" },
                                        },
                                    },
                                ],
                            },
                            {
                                "o:OLEObject": {
                                    _attr: {
                                        Type: "Embed",
                                        ProgID: "Excel.Sheet.12",
                                        ShapeID: shapeId,
                                        DrawAspect: "Content",
                                        ObjectID: expect.stringMatching(/^_\d{10}$/),
                                        "r:id": expect.stringMatching(/^rId/),
                                    },
                                },
                            },
                        ],
                    },
                ],
            });
            expect(shapeId).toMatch(/^EmbeddedFile/);
        });

        it("should give each object its own shape and object ids", () => {
            const [first, second] = [new EmbeddedFileRun(workbook), new EmbeddedFileRun(workbook)].map((run) =>
                attributesOf(run, "o:OLEObject"),
            );

            expect(first.ShapeID).not.toBe(second.ShapeID);
            expect(first.ObjectID).not.toBe(second.ObjectID);
        });

        it("should draw the object at its size in points, rounded to hundredths, with its original size in twentieths of a point", () => {
            const run = new EmbeddedFileRun({ ...workbook, transformation: { width: 101, height: 33.3 } });

            expect(attributesOf(run, "v:shape").style).toBe("width:75.75pt;height:24.98pt");
            expect(attributesOf(run, "w:object")).toEqual({ "w:dxaOrig": 1515, "w:dyaOrig": 500 });
        });

        it("should show the file as an icon with displayAsIcon", () => {
            expect(attributesOf(new EmbeddedFileRun({ ...workbook, displayAsIcon: true }), "o:OLEObject").DrawAspect).toBe("Icon");
            expect(attributesOf(new EmbeddedFileRun({ ...workbook, displayAsIcon: false }), "o:OLEObject").DrawAspect).toBe("Content");
        });

        it("should package any other file, and always show it as an icon", () => {
            const run = new EmbeddedFileRun({ ...workbook, fileName: "song.mp3", data: new Uint8Array([1, 2, 3]), displayAsIcon: false });

            expect(attributesOf(run, "o:OLEObject")).toMatchObject({ ProgID: "Package", DrawAspect: "Icon" });
        });

        it("should describe the file for screen readers with altText", () => {
            expect(attributesOf(new EmbeddedFileRun({ ...workbook, altText: "Sales by month" }), "v:shape").alt).toBe("Sales by month");
            expect(attributesOf(new EmbeddedFileRun(workbook), "v:shape")).not.toHaveProperty("alt");
        });

        it("should throw for an Office file that isn't a zip file, which Office couldn't open", () => {
            expect(
                () => new EmbeddedFileRun({ ...workbook, fileName: "old.xlsx", data: new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]) }),
            ).toThrow(
                "EmbeddedFileRun: \"old.xlsx\" isn't an Office Open XML file, which is a zip file, so Office couldn't open it. Name it with its own extension, such as .xls, to embed it in an OLE package",
            );
            expect(
                () => new EmbeddedFileRun({ ...workbook, fileName: "old.xls", data: new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]) }),
            ).not.toThrow();
        });

        it("should throw for a picture type Word doesn't draw an embedded file in, or none", () => {
            for (const type of ["svg", undefined]) {
                expect(
                    () =>
                        new EmbeddedFileRun({
                            ...workbook,
                            preview: { type, data: PICTURE } as unknown as EmbeddedFileRunOptions["preview"],
                        }),
                ).toThrow(`EmbeddedFileRun: the preview's type is "${type}". Expected "jpg", "png", "gif" or "bmp"`);
            }
        });
    });

    describe("#prepForXml()", () => {
        it("should add the picture to the document's media, named by its content", () => {
            const file = new File({ sections: [] });
            const addImage = vi.spyOn(file.Media, "addImage");
            format(new EmbeddedFileRun(workbook), file);

            expect(addImage).toHaveBeenCalledWith(
                expect.stringMatching(/^[0-9a-f]+\.png$/),
                expect.objectContaining({
                    type: "png",
                    data: PICTURE,
                    transformation: { pixels: { x: 180, y: 100 }, emus: { x: 1714500, y: 952500 } },
                }),
            );
        });
    });

    describe("when packed", () => {
        it("should embed an Office file as itself, with its picture and the relationships to both", async () => {
            const files = await pack(
                new Document({ sections: [{ children: [new Paragraph({ children: [new EmbeddedFileRun(workbook)] })] }] }),
            );
            const document = read(files, "word/document.xml");
            const relationships = read(files, "word/_rels/document.xml.rels");
            const [, imageId] = /<v:imagedata r:id="([^"]+)"/.exec(document)!;
            const [, objectId] = /<o:OLEObject [^>]*r:id="([^"]+)"/.exec(document)!;

            expect(files.get("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).toEqual(WORKBOOK);
            expect(relationships).toContain(
                `<Relationship Id="${objectId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/package" Target="embeddings/Microsoft_Excel_Worksheet1.xlsx"/>`,
            );
            expect(relationships).toMatch(
                new RegExp(
                    `<Relationship Id="${imageId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/[0-9a-f]+\\.png"/>`,
                ),
            );
            expect(read(files, "[Content_Types].xml")).toContain(
                '<Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" PartName="/word/embeddings/Microsoft_Excel_Worksheet1.xlsx"/>',
            );
        });

        it("should write the shape type once in each part, in its first object, and again when packed again", async () => {
            const doc = new Document({
                footnotes: {
                    1: { children: [new Paragraph({ children: [new EmbeddedFileRun(workbook), new EmbeddedFileRun(workbook)] })] },
                },
                sections: [
                    {
                        headers: { default: new Header({ children: [new Paragraph({ children: [new EmbeddedFileRun(workbook)] })] }) },
                        children: [
                            new Paragraph({ children: [new EmbeddedFileRun(workbook), new FootnoteReferenceRun(1)] }),
                            new Paragraph({ children: [new EmbeddedFileRun(workbook), new EmbeddedFileRun(workbook)] }),
                        ],
                    },
                ],
            });
            await pack(doc);
            const files = await pack(doc);

            for (const part of ["document", "header1", "footnotes"]) {
                const xml = read(files, `word/${part}.xml`);
                expect(xml.split("<v:shapetype ").length - 1, part).toBe(1);
                // Before the first object's shape
                expect(xml.indexOf("<v:shapetype ")).toBeLessThan(xml.indexOf("<v:shape "));
            }
        });

        it("should write the picture frame shape type as Word does", async () => {
            const files = await pack(
                new Document({ sections: [{ children: [new Paragraph({ children: [new EmbeddedFileRun(workbook)] })] }] }),
            );

            expect(read(files, "word/document.xml")).toContain(
                '<v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f">' +
                    '<v:stroke joinstyle="miter"/><v:formulas><v:f eqn="if lineDrawn pixelLineWidth 0"/><v:f eqn="sum @0 1 0"/>' +
                    '<v:f eqn="sum 0 0 @1"/><v:f eqn="prod @2 1 2"/><v:f eqn="prod @3 21600 pixelWidth"/><v:f eqn="prod @3 21600 pixelHeight"/>' +
                    '<v:f eqn="sum @0 0 1"/><v:f eqn="prod @6 1 2"/><v:f eqn="prod @7 21600 pixelWidth"/><v:f eqn="sum @8 21600 0"/>' +
                    '<v:f eqn="prod @7 21600 pixelHeight"/><v:f eqn="sum @10 21600 0"/></v:formulas>' +
                    '<v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/></v:shapetype>',
            );
        });

        it("should embed any other file in an OLE package", async () => {
            const data = new Uint8Array([1, 2, 3]);
            const files = await pack(
                new Document({
                    sections: [
                        { children: [new Paragraph({ children: [new EmbeddedFileRun({ ...workbook, fileName: "song.mp3", data })] })] },
                    ],
                }),
            );
            const ole = readCompoundFile(files.get("word/embeddings/oleObject1.bin")!);

            expect(ole.entries[0].classId).toBe("0003000C-0000-0000-C000-000000000046");
            expect(ole.streams.get("\u0001Ole10Native")).toBeDefined();
            expect(read(files, "word/_rels/document.xml.rels")).toContain(
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" Target="embeddings/oleObject1.bin"',
            );
            expect(read(files, "[Content_Types].xml")).toContain(
                '<Override ContentType="application/vnd.openxmlformats-officedocument.oleObject" PartName="/word/embeddings/oleObject1.bin"/>',
            );
        });

        it("should embed each file once, and a picture used twice once", async () => {
            const files = await pack(
                new Document({
                    sections: [{ children: [new Paragraph({ children: [new EmbeddedFileRun(workbook), new EmbeddedFileRun(workbook)] })] }],
                }),
            );

            expect([...files.keys()].filter((path) => /^word\/(embeddings|media)\/./.test(path)).sort()).toEqual([
                "word/embeddings/Microsoft_Excel_Worksheet1.xlsx",
                "word/embeddings/Microsoft_Excel_Worksheet2.xlsx",
                expect.stringMatching(/^word\/media\/[0-9a-f]+\.png$/),
            ]);
        });

        it("should embed a file in a header or a footnote, with the relationships from its part", async () => {
            const files = await pack(
                new Document({
                    footnotes: {
                        1: { children: [new Paragraph({ children: [new EmbeddedFileRun({ ...workbook, fileName: "note.docx" })] })] },
                    },
                    sections: [
                        {
                            headers: { default: new Header({ children: [new Paragraph({ children: [new EmbeddedFileRun(workbook)] })] }) },
                            children: [new Paragraph({ children: [new FootnoteReferenceRun(1)] })],
                        },
                    ],
                }),
            );

            for (const [part, target] of [
                ["header1", "embeddings/Microsoft_Excel_Worksheet1.xlsx"],
                ["footnotes", "embeddings/Microsoft_Word_Document1.docx"],
            ]) {
                const relationships = read(files, `word/_rels/${part}.xml.rels`);
                expect(relationships).toContain(`Target="${target}"`);
                expect(relationships).toMatch(/Target="media\/[0-9a-f]+\.png"/);
            }
        });

        it("should embed a file given as an ArrayBuffer, a data URI or a slice of a larger buffer", async () => {
            const larger = Buffer.from([9, 9, ...WORKBOOK, 9]);
            for (const data of [
                WORKBOOK.slice().buffer,
                `data:application/octet-stream;base64,${Buffer.from(WORKBOOK).toString("base64")}`,
                larger.subarray(2, -1),
            ]) {
                const files = await pack(
                    new Document({ sections: [{ children: [new Paragraph({ children: [new EmbeddedFileRun({ ...workbook, data })] })] }] }),
                );
                expect(files.get("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).toEqual(WORKBOOK);
            }
        });

        it("should leave out the shape type when patchDocument inserts a file into a part that has it", async () => {
            // A template with an embedded file of its own, so its body has the picture frame's shape type
            const template = await Packer.toBuffer(
                new Document({
                    sections: [{ children: [new Paragraph({ children: [new EmbeddedFileRun(workbook)] }), new Paragraph("{{file}}")] }],
                }),
            );
            const patched = await patchDocument({
                outputType: "uint8array",
                data: template,
                patches: { file: { type: PatchType.PARAGRAPH, children: [new EmbeddedFileRun(workbook)] } },
            });
            const document = read(unzip(patched), "word/document.xml");

            expect(document.split('<v:shapetype id="_x0000_t75"').length - 1).toBe(1);
            expect(document.split('<v:shape id="EmbeddedFile').length - 1).toBe(2);
        });

        it("should declare the VML and Office namespaces in each part patchDocument inserts a file into, when it doesn't", async () => {
            // A template whose parts don't declare them, as some applications write one
            const parts = { document: "w:document", header1: "w:hdr", footer1: "w:ftr", footnotes: "w:footnotes" };
            const template = unzip(
                await Packer.toBuffer(
                    new Document({
                        footnotes: { 1: { children: [new Paragraph("{{file}}")] } },
                        sections: [
                            {
                                headers: { default: new Header({ children: [new Paragraph("{{file}}")] }) },
                                footers: { default: new Footer({ children: [new Paragraph("{{file}}")] }) },
                                children: [new Paragraph({ children: [new TextRun("{{file}}"), new FootnoteReferenceRun(1)] })],
                            },
                        ],
                    }),
                ),
            );
            const patched = unzip(
                await patchDocument({
                    outputType: "uint8array",
                    data: zip({
                        ...Object.fromEntries(template),
                        ...Object.fromEntries(
                            Object.keys(parts).map((part) => [
                                `word/${part}.xml`,
                                read(template, `word/${part}.xml`).replace(/ xmlns:[vo]="[^"]*"/g, ""),
                            ]),
                        ),
                    }),
                    patches: { file: { type: PatchType.PARAGRAPH, children: [new EmbeddedFileRun(workbook)] } },
                }),
            );

            for (const [part, rootName] of Object.entries(parts)) {
                const xml = read(patched, `word/${part}.xml`);
                const root = new RegExp(`<${rootName} [^>]*>`).exec(xml)![0];
                expect(xml, part).toContain('ProgID="Excel.Sheet.12"');
                expect(root, part).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
                expect(root, part).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
            }
        });

        it("should embed a file in a document patchDocument fills in", async () => {
            const template = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph("Before {{file}} after")] }] }));
            const patched = await patchDocument({
                outputType: "uint8array",
                data: template,
                patches: { file: { type: PatchType.PARAGRAPH, children: [new EmbeddedFileRun(workbook)] } },
            });
            const files = unzip(patched);

            expect(read(files, "word/document.xml")).toContain('ProgID="Excel.Sheet.12"');
            expect(files.get("word/embeddings/Microsoft_Excel_Worksheet1.xlsx")).toEqual(WORKBOOK);
            expect([...files.keys()].some((path) => /^word\/media\/[0-9a-f]+\.png$/.test(path))).toBe(true);
        });
    });
});
