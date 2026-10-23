/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { DrawingPatch } from "./drawing-patch";
import { type IPatch, PatchType, patchDocument } from "./from-docx";
import { ImagePatch, type ImagePatchOptions, type ImagePatchTransformation } from "./image-patch";
import { patchDetector } from "./patch-detector";

// cspell:ignore descr asvg wgp wpg wsp imgProps imgLayer imgEffect artisticBlur

const NAMESPACES = [
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"',
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
].join(" ");

const IMAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
const HYPERLINK_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink";

const SVG_EXTENSION = "{96DAC541-7B7A-43D3-8B79-37D633B846F1}";
const LOCAL_DPI_EXTENSION = "{28A0092B-C50C-407E-A947-70E740481C1C}";
const IMAGE_PROPERTIES_EXTENSION = "{BEBA8EAE-BF5A-486C-A8C5-ECC9F3942E4B}";

// The start of each format's files, which is all a file needs here
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 2]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 3]);
const BMP = new Uint8Array([0x42, 0x4d, 4]);
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
const TEMPLATE_IMAGE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9]);

// The image of a picture, as Word writes it, with its extensions
const blipOf = ({
    id = "rId5",
    attributes = "",
    children = "",
}: {
    readonly id?: string;
    readonly attributes?: string;
    readonly children?: string;
}): string => `<a:blip r:embed="${id}"${attributes}>${children}</a:blip>`;

// A picture in a paragraph, as Word writes it, with its namespaces where Word declares them
const pictureOf = ({
    descr,
    title,
    pictureDescr,
    blip = blipOf({}),
    crop = '<a:srcRect l="10000" r="20000"/>',
    floating = false,
    hyperlink = "",
}: {
    readonly descr?: string;
    readonly title?: string;
    readonly pictureDescr?: string;
    readonly blip?: string;
    readonly crop?: string;
    readonly floating?: boolean;
    readonly hyperlink?: string;
}): string => {
    const drawing = floating ? "wp:anchor" : "wp:inline";
    return [
        `<w:p><w:r><w:drawing><${drawing} distT="0" distB="0" distL="0" distR="0">`,
        floating ? `<wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="column"><wp:posOffset>0</wp:posOffset></wp:positionH>` : "",
        `<wp:extent cx="1905000" cy="952500"/><wp:effectExtent l="0" t="0" r="0" b="0"/>`,
        floating ? '<wp:wrapSquare wrapText="bothSides"/>' : "",
        `<wp:docPr id="1" name="Picture 1"${descr === undefined ? "" : ` descr="${descr}"`}${title === undefined ? "" : ` title="${title}"`}>${hyperlink}</wp:docPr>`,
        `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>`,
        `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">`,
        `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">`,
        `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">`,
        `<pic:nvPicPr><pic:cNvPr id="1" name="Picture 1"${pictureDescr === undefined ? "" : ` descr="${pictureDescr}"`}/><pic:cNvPicPr/></pic:nvPicPr>`,
        `<pic:blipFill>${blip}${crop}<a:stretch><a:fillRect/></a:stretch></pic:blipFill>`,
        `<pic:spPr><a:xfrm rot="600000"><a:off x="0" y="0"/><a:ext cx="1905000" cy="952500"/></a:xfrm>`,
        `<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom><a:ln w="12700"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:ln></pic:spPr>`,
        `</pic:pic></a:graphicData></a:graphic></${drawing}></w:drawing></w:r></w:p>`,
    ].join("");
};

// A drawing that isn't a picture, with the alt text {{logo}}
const drawingOf = (content: string): string =>
    `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="1" cy="1"/><wp:docPr id="1" name="Drawing 1" descr="{{logo}}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="any">${content}</a:graphicData></a:graphic>` +
    `</wp:inline></w:drawing></w:r></w:p>`;

const documentOf = (body: string): string =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NAMESPACES}><w:body>${body}</w:body></w:document>`;

const relationshipsOf = (...relationships: readonly string[]): string =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join("")}</Relationships>`;

const relationship = (id: string, type: string, target: string, mode?: string): string =>
    `<Relationship Id="${id}" Type="${type}" Target="${target}"${mode === undefined ? "" : ` TargetMode="${mode}"`}/>`;

const CONTENT_TYPES =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Default Extension="png" ContentType="image/png"/>` +
    `<Default Extension="svg" ContentType="image/svg+xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `</Types>`;

// A document with a picture whose description is {{logo}}, and the files given
const templateWith = (files: Readonly<Record<string, string | Uint8Array | undefined>> = {}): Promise<Buffer> => {
    const all: Readonly<Record<string, string | Uint8Array | undefined>> = {
        "[Content_Types].xml": CONTENT_TYPES,
        "_rels/.rels": relationshipsOf(
            relationship("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", "word/document.xml"),
        ),
        "word/document.xml": documentOf(pictureOf({ descr: "{{logo}}" })),
        "word/_rels/document.xml.rels": relationshipsOf(relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png")),
        "word/media/image1.png": TEMPLATE_IMAGE,
        ...files,
    };
    const zip = new JSZip();
    for (const [path, content] of Object.entries(all)) {
        if (content !== undefined) {
            zip.file(path, content);
        }
    }
    return zip.generateAsync({ type: "nodebuffer" });
};

const patch = async (data: Buffer, patches: Readonly<Record<string, IPatch | DrawingPatch>>): Promise<JSZip> =>
    JSZip.loadAsync(await patchDocument({ outputType: "nodebuffer", data, patches }));

const read = async (zip: JSZip, path: string): Promise<string | undefined> => {
    const text = await zip.file(path)?.async("text");
    return text;
};

const bytes = async (zip: JSZip, path: string): Promise<Uint8Array | undefined> => {
    const data = await zip.file(path)?.async("uint8array");
    return data;
};

// The template patched with an image patch for {{logo}}
const patchLogo = async (
    options: ImagePatchOptions = { type: "jpg", data: JPEG },
    files: Readonly<Record<string, string | Uint8Array | undefined>> = {},
): Promise<JSZip> => patch(await templateWith(files), { logo: new ImagePatch(options) });

describe("ImagePatch", () => {
    describe("#constructor()", () => {
        it("should be a drawing patch", () => {
            const imagePatch = new ImagePatch({ type: "png", data: PNG });
            expect(imagePatch).to.be.instanceOf(DrawingPatch);
            expect(imagePatch.type).to.equal(PatchType.DRAWING);
        });

        it("should read the type of an image given without one, as JavaScript can, from its data", async () => {
            const zip = await patchLogo({ data: GIF } as unknown as ImagePatchOptions);
            expect(await bytes(zip, "word/media/image1.gif")).to.deep.equal(GIF);
        });

        it("should throw for an image without a type whose data isn't a PNG, JPEG, GIF or BMP file", () => {
            expect(() => new ImagePatch({ data: new Uint8Array([1, 2, 3]) } as unknown as ImagePatchOptions)).to.throw(
                "ImagePatch: type isn't given, and data isn't a PNG, JPEG, GIF or BMP file to read it from. Give its type",
            );
        });

        it("should throw for a type an ImageRun doesn't take", () => {
            expect(() => new ImagePatch({ type: "webp", data: PNG } as unknown as ImagePatchOptions)).to.throw(
                'ImagePatch: invalid type "webp". Expected "png", "jpg", "gif", "bmp" or, with a fallback, "svg"',
            );
        });

        it("should throw for an SVG image without a fallback, or whose fallback is an SVG image", () => {
            expect(() => new ImagePatch({ type: "svg", data: SVG } as unknown as ImagePatchOptions)).to.throw(
                "ImagePatch: an SVG image needs a fallback, a PNG, JPEG, GIF or BMP image for applications that can't show SVG",
            );
            expect(
                () => new ImagePatch({ type: "svg", data: SVG, fallback: { type: "svg", data: SVG } } as unknown as ImagePatchOptions),
            ).to.throw('ImagePatch fallback: invalid type "svg"');
        });

        it("should throw for a size that isn't a number of pixels greater than 0", () => {
            for (const [width, height, name, value] of [
                [0, 10, "width", "0"],
                [10, -1, "height", "-1"],
                [Number.NaN, 10, "width", "NaN"],
                [10, Number.POSITIVE_INFINITY, "height", "Infinity"],
                ["10", 10, "width", "10"],
            ] as const) {
                expect(
                    () =>
                        new ImagePatch({
                            type: "png",
                            data: PNG,
                            transformation: { width, height } as unknown as ImagePatchTransformation,
                        }),
                ).to.throw(`ImagePatch: invalid ${name} ${value}. Expected a number of pixels greater than 0`);
            }
        });
    });

    describe("patching a picture", () => {
        it("should point the picture to the new image, in word/media with its content type, and remove the template's", async () => {
            const zip = await patchLogo();

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<a:blip r:embed="rId6"/>');
            expect(await read(zip, "word/_rels/document.xml.rels")).to.equal(
                relationshipsOf(relationship("rId6", IMAGE_RELATIONSHIP, "media/image1.jpg")),
            );
            expect(await bytes(zip, "word/media/image1.jpg")).to.deep.equal(JPEG);
            expect(zip.file("word/media/image1.png")).to.equal(null);
            expect(await read(zip, "[Content_Types].xml")).to.contain(
                '<Override ContentType="image/jpeg" PartName="/word/media/image1.jpg"/>',
            );
        });

        it("should add each type of image with its content type", async () => {
            for (const [type, data, contentType] of [
                ["png", PNG, "image/png"],
                ["jpg", JPEG, "image/jpeg"],
                ["gif", GIF, "image/gif"],
                ["bmp", BMP, "image/bmp"],
            ] as const) {
                const zip = await patchLogo({ type, data });
                // The template's image is image1.png
                const path = `word/media/image${type === "png" ? 2 : 1}.${type}`;

                expect(await bytes(zip, path), type).to.deep.equal(data);
                expect(await read(zip, "[Content_Types].xml"), type).to.contain(
                    `<Override ContentType="${contentType}" PartName="/${path}"/>`,
                );
            }
        });

        it("should take image data as a Buffer, an ArrayBuffer or a data URI, as an ImageRun does", async () => {
            const slice = Buffer.from([0, ...PNG]).subarray(1);
            for (const data of [slice, PNG.slice().buffer, `data:image/png;base64,${Buffer.from(PNG).toString("base64")}`]) {
                const zip = await patchLogo({ type: "png", data });
                expect(await bytes(zip, "word/media/image2.png")).to.deep.equal(PNG);
            }
        });

        it("should keep the template's image, and its relationship, for the other pictures that show it", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(
                    pictureOf({ descr: "{{logo}}" }) + pictureOf({ descr: "Another picture of the template's image" }),
                ),
            });

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<a:blip r:embed="rId6"/>');
            expect(document).to.contain('<a:blip r:embed="rId5"/>');
            const relationships = await read(zip, "word/_rels/document.xml.rels");
            expect(relationships).to.contain(relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png"));
            expect(relationships).to.contain(relationship("rId6", IMAGE_RELATIONSHIP, "media/image1.jpg"));
            expect(await bytes(zip, "word/media/image1.png")).to.deep.equal(TEMPLATE_IMAGE);
        });

        it("should keep the template's image for a picture in another part that shows it", async () => {
            const zip = await patchLogo(undefined, {
                "word/header1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NAMESPACES}>${pictureOf({})}</w:hdr>`,
                "word/_rels/header1.xml.rels": relationshipsOf(relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png")),
            });

            expect(await read(zip, "word/_rels/document.xml.rels")).to.not.contain("media/image1.png");
            expect(await bytes(zip, "word/media/image1.png")).to.deep.equal(TEMPLATE_IMAGE);
        });

        it("should add the image once, for each picture the patch is for, in each part", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(pictureOf({ descr: "{{logo}}" }) + pictureOf({ title: "{{logo}}" })),
                "word/header1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NAMESPACES}>${pictureOf({ descr: "{{logo}}" })}</w:hdr>`,
                "word/_rels/header1.xml.rels": relationshipsOf(relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png")),
            });

            expect(Object.keys(zip.files).filter((path) => path.startsWith("word/media/") && !path.endsWith("/"))).to.deep.equal([
                "word/media/image1.jpg",
            ]);
            expect(await read(zip, "word/document.xml")).to.not.contain('r:embed="rId5"');
            expect(await read(zip, "word/_rels/header1.xml.rels")).to.equal(
                relationshipsOf(relationship("rId6", IMAGE_RELATIONSHIP, "media/image1.jpg")),
            );
            expect(await read(zip, "word/header1.xml")).to.contain('<a:blip r:embed="rId6"/>');
            expect(zip.file("word/media/image1.png")).to.equal(null);
        });

        it("should give an image in a part in a folder of its own a relationship from that folder", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(""),
                "word/glossary/document.xml": documentOf(pictureOf({ descr: "{{logo}}" })),
                "word/glossary/_rels/document.xml.rels": relationshipsOf(relationship("rId5", IMAGE_RELATIONSHIP, "../media/image1.png")),
            });

            expect(await read(zip, "word/glossary/_rels/document.xml.rels")).to.contain(
                relationship("rId6", IMAGE_RELATIONSHIP, "../media/image1.jpg"),
            );
        });

        it("should keep the picture's size, position, wrapping, rotation, shape and border, and remove the crop of the template's image", async () => {
            const zip = await patchLogo(undefined, { "word/document.xml": documentOf(pictureOf({ descr: "{{logo}}", floating: true })) });

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<wp:anchor distT="0" distB="0" distL="0" distR="0">');
            expect(document).to.contain('<wp:positionH relativeFrom="column"><wp:posOffset>0</wp:posOffset></wp:positionH>');
            expect(document).to.contain('<wp:extent cx="1905000" cy="952500"/>');
            expect(document).to.contain('<wp:wrapSquare wrapText="bothSides"/>');
            expect(document).to.contain('<a:xfrm rot="600000"><a:off x="0" y="0"/><a:ext cx="1905000" cy="952500"/></a:xfrm>');
            expect(document).to.contain('<a:prstGeom prst="ellipse">');
            expect(document).to.contain('<a:ln w="12700">');
            expect(document).to.contain('<pic:blipFill><a:blip r:embed="rId6"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>');
        });

        it("should keep the image's effects, such as its transparency, and its other attributes", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(
                    pictureOf({
                        descr: "{{logo}}",
                        blip: blipOf({ attributes: ' cstate="print"', children: '<a:alphaModFix amt="50000"/><a:lum bright="20000"/>' }),
                    }),
                ),
            });

            expect(await read(zip, "word/document.xml")).to.contain(
                '<a:blip r:embed="rId6" cstate="print"><a:alphaModFix amt="50000"/><a:lum bright="20000"/></a:blip>',
            );
        });

        it("should give the picture a new size, in pixels", async () => {
            const zip = await patchLogo({ type: "jpg", data: JPEG, transformation: { width: 100, height: 50.5 } });

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<wp:extent cx="952500" cy="481013"/>');
            expect(document).to.contain('<a:ext cx="952500" cy="481013"/>');
        });

        it("should patch a picture without a size or properties of its own, which Word always writes", async () => {
            const zip = await patchLogo(
                { type: "jpg", data: JPEG, transformation: { width: 100, height: 50 } },
                {
                    "word/document.xml": documentOf(
                        pictureOf({ descr: "{{logo}}" })
                            .replace(/<a:xfrm rot="600000">.*<\/a:xfrm>/, "")
                            .replace(/<wp:extent[^>]*\/>/, "")
                            .replace(/<pic:nvPicPr>.*<\/pic:nvPicPr>/, ""),
                    ),
                },
            );

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<a:blip r:embed="rId6"/>');
            expect(document).to.not.contain("extent");
            expect(document).to.contain('<wp:docPr id="1" name="Picture 1"/>');
        });

        it("should give an image to a picture that had none", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(pictureOf({ descr: "{{logo}}", blip: "<a:blip/>" })),
                "word/_rels/document.xml.rels": undefined,
                "word/media/image1.png": undefined,
            });

            expect(await read(zip, "word/document.xml")).to.contain('<a:blip r:embed="rId1"/>');
            expect(await read(zip, "word/_rels/document.xml.rels")).to.equal(
                relationshipsOf(relationship("rId1", IMAGE_RELATIONSHIP, "media/image1.jpg")),
            );
        });

        it("should embed the image of a picture that was linked to a file, and remove the link", async () => {
            const link = relationship("rId7", IMAGE_RELATIONSHIP, "file:///C:/logo.png", "External");
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(pictureOf({ descr: "{{logo}}", blip: '<a:blip r:link="rId7"/>' })),
                "word/_rels/document.xml.rels": relationshipsOf(link),
                "word/media/image1.png": undefined,
            });

            expect(await read(zip, "word/document.xml")).to.contain('<a:blip r:embed="rId8"/>');
            const relationships = await read(zip, "word/_rels/document.xml.rels");
            expect(relationships).to.not.contain("rId7");
            expect(relationships).to.contain(relationship("rId8", IMAGE_RELATIONSHIP, "media/image1.jpg"));
        });

        it("should keep the picture's hyperlink", async () => {
            const link = relationship("rId7", HYPERLINK_RELATIONSHIP, "https://example.com", "External");
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(
                    pictureOf({
                        descr: "{{logo}}",
                        hyperlink: '<a:hlinkClick xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:id="rId7"/>',
                    }),
                ),
                "word/_rels/document.xml.rels": relationshipsOf(relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png"), link),
            });

            expect(await read(zip, "word/document.xml")).to.contain('r:id="rId7"');
            expect(await read(zip, "word/_rels/document.xml.rels")).to.contain(link);
        });
    });

    describe("extensions of the image", () => {
        const svgExtension = (id: string): string =>
            `<a:ext uri="${SVG_EXTENSION}"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="${id}"/></a:ext>`;
        const localDpi = `<a:ext uri="${LOCAL_DPI_EXTENSION}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="0"/></a:ext>`;

        it("should give an SVG image its fallback as the picture's image, and the SVG image as its SVG version", async () => {
            const zip = await patchLogo({ type: "svg", data: SVG, fallback: { type: "png", data: PNG } });

            expect(await read(zip, "word/document.xml")).to.contain(
                `<a:blip r:embed="rId6"><a:extLst>${svgExtension("rId7")}</a:extLst></a:blip>`,
            );
            const relationships = await read(zip, "word/_rels/document.xml.rels");
            expect(relationships).to.contain(relationship("rId6", IMAGE_RELATIONSHIP, "media/image2.png"));
            expect(relationships).to.contain(relationship("rId7", IMAGE_RELATIONSHIP, "media/image1.svg"));
            expect(await bytes(zip, "word/media/image2.png")).to.deep.equal(PNG);
            expect(await bytes(zip, "word/media/image1.svg")).to.deep.equal(SVG);
            expect(await read(zip, "[Content_Types].xml")).to.contain(
                '<Override ContentType="image/svg+xml" PartName="/word/media/image1.svg"/>',
            );
        });

        it("should replace the template's SVG version, and remove its image, keeping the image's other extensions", async () => {
            const zip = await patchLogo(
                { type: "jpg", data: JPEG },
                {
                    "word/document.xml": documentOf(
                        pictureOf({
                            descr: "{{logo}}",
                            blip: blipOf({ children: `<a:extLst>${localDpi}${svgExtension("rId6")}</a:extLst>` }),
                        }),
                    ),
                    "word/_rels/document.xml.rels": relationshipsOf(
                        relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png"),
                        relationship("rId6", IMAGE_RELATIONSHIP, "media/image2.svg"),
                    ),
                    "word/media/image2.svg": SVG,
                },
            );

            expect(await read(zip, "word/document.xml")).to.contain(`<a:blip r:embed="rId7"><a:extLst>${localDpi}</a:extLst></a:blip>`);
            expect(await read(zip, "word/_rels/document.xml.rels")).to.equal(
                relationshipsOf(relationship("rId7", IMAGE_RELATIONSHIP, "media/image1.jpg")),
            );
            expect(zip.file("word/media/image1.png")).to.equal(null);
            expect(zip.file("word/media/image2.svg")).to.equal(null);
        });

        it("should replace the template's SVG version with the new image's", async () => {
            const zip = await patchLogo(
                { type: "svg", data: SVG, fallback: { type: "png", data: PNG } },
                {
                    "word/document.xml": documentOf(
                        pictureOf({ descr: "{{logo}}", blip: blipOf({ children: `<a:extLst>${svgExtension("rId6")}</a:extLst>` }) }),
                    ),
                    "word/_rels/document.xml.rels": relationshipsOf(
                        relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png"),
                        relationship("rId6", IMAGE_RELATIONSHIP, "media/image2.svg"),
                    ),
                    "word/media/image2.svg": new Uint8Array([7]),
                },
            );

            expect(await read(zip, "word/document.xml")).to.contain(
                `<a:blip r:embed="rId7"><a:extLst>${svgExtension("rId8")}</a:extLst></a:blip>`,
            );
            expect(await bytes(zip, "word/media/image2.png")).to.deep.equal(PNG);
            expect(await bytes(zip, "word/media/image1.svg")).to.deep.equal(SVG);
            expect(zip.file("word/media/image2.svg")).to.equal(null);
        });

        it("should remove Word's artistic effects, which keep the template's image, and that image", async () => {
            const imageProperties =
                `<a:ext uri="${IMAGE_PROPERTIES_EXTENSION.toLowerCase()}"><a14:imgProps xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main">` +
                `<a14:imgLayer r:embed="rId6"><a14:imgEffect><a14:artisticBlur/></a14:imgEffect></a14:imgLayer></a14:imgProps></a:ext>`;
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(
                    pictureOf({ descr: "{{logo}}", blip: blipOf({ children: `<a:extLst>${imageProperties}</a:extLst>` }) }),
                ),
                "word/_rels/document.xml.rels": relationshipsOf(
                    relationship("rId5", IMAGE_RELATIONSHIP, "media/image1.png"),
                    relationship("rId6", "http://schemas.microsoft.com/office/2007/relationships/hdphoto", "media/hdphoto1.wdp"),
                ),
                "word/media/hdphoto1.wdp": new Uint8Array([5]),
            });

            expect(await read(zip, "word/document.xml")).to.contain('<a:blip r:embed="rId7"/>');
            expect(zip.file("word/media/hdphoto1.wdp")).to.equal(null);
            expect(await read(zip, "word/_rels/document.xml.rels")).to.not.contain("hdphoto");
        });
    });

    describe("the alt text", () => {
        it("should take the placeholder out of the description and the title, and remove what is left empty", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(pictureOf({ descr: "Our logo {{logo}}", title: "{{logo}}", pictureDescr: "{{logo}}" })),
            });

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<wp:docPr id="1" name="Picture 1" descr="Our logo"/>');
            expect(document).to.contain('<pic:cNvPr id="1" name="Picture 1"/>');
        });

        it("should give the picture the alt text given", async () => {
            const zip = await patchLogo(
                { type: "jpg", data: JPEG, altText: { description: "A cat & a dog", title: "Pets" } },
                { "word/document.xml": documentOf(pictureOf({ descr: "{{logo}}", pictureDescr: "{{logo}}" })) },
            );

            const document = await read(zip, "word/document.xml");
            expect(document).to.contain('<wp:docPr id="1" name="Picture 1" descr="A cat &amp; a dog" title="Pets"/>');
            expect(document).to.contain('<pic:cNvPr id="1" name="Picture 1" descr="A cat &amp; a dog" title="Pets"/>');
        });

        it("should remove the description or the title given as empty", async () => {
            const zip = await patchLogo(
                { type: "jpg", data: JPEG, altText: { description: "", title: "" } },
                { "word/document.xml": documentOf(pictureOf({ descr: "Logo {{logo}}", title: "A title" })) },
            );

            expect(await read(zip, "word/document.xml")).to.contain('<wp:docPr id="1" name="Picture 1"/>');
        });
    });

    describe("what isn't a picture", () => {
        it("should throw, naming the placeholder and saying what the drawing is", async () => {
            for (const [content, message] of [
                [
                    '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId5"/>',
                    "It is a chart, not a picture. Give a chart new data with ChartDataPatch from docx/charts",
                ],
                [
                    '<cx:chart xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" r:id="rId5"/>',
                    "It is a chart, not a picture",
                ],
                [
                    '<wpg:wgp xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"/>',
                    "It is a group of drawings. Ungroup the picture in Word, and put the placeholder in its alt text",
                ],
                [
                    '<wpc:wpc xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"/>',
                    "It is a drawing canvas. Move the picture out of it in Word, and put the placeholder in its alt text",
                ],
                [
                    '<wps:wsp xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"/>',
                    "It is a shape, not a picture",
                ],
                ["", "It isn't a picture"],
            ] as const) {
                await expect(patchLogo(undefined, { "word/document.xml": documentOf(drawingOf(content)) }), message).rejects.toThrow(
                    `Can't patch the picture {{logo}}. ${message}`,
                );
            }
        });

        it("should throw for a picture without an image", async () => {
            await expect(
                patchLogo(undefined, {
                    "word/document.xml": documentOf(
                        drawingOf(
                            '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill/></pic:pic>',
                        ),
                    ),
                }),
            ).rejects.toThrow("Can't patch the picture {{logo}}. It has no image: it has no a:blip");
        });
    });

    describe("with other patches", () => {
        it("should leave the placeholder in text as it is, for a text patch", async () => {
            const zip = await patchLogo(undefined, {
                "word/document.xml": documentOf(`${pictureOf({ descr: "{{logo}}" })}<w:p><w:r><w:t>{{logo}}</w:t></w:r></w:p>`),
            });

            expect(await read(zip, "word/document.xml")).to.contain("<w:t>{{logo}}</w:t>");
        });

        it("should be found by patchDetector", async () => {
            expect(await patchDetector({ data: await templateWith() })).to.deep.equal(["logo"]);
        });
    });
});
