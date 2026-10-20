/**
 * Embedded file run module: a file embedded in a document as an OLE object, such as a workbook, a presentation, a sound
 * or a video, which opens from the document.
 *
 * Reference: http://officeopenxml.com/WPembeddedObjects.php
 *
 * @module
 */
import {
    BuilderElement,
    type IContext,
    type IMediaData,
    type IXmlableObject,
    NextAttributeComponent,
    PackagePart,
    type PackagePartRelationshipType,
    Run,
    XmlComponent,
    hashedId,
    standardizeData,
    uniqueId,
    uniqueNumericIdCreator,
} from "docx";

import { PACKAGE_FILE_TYPE, embeddedFileTypeOf } from "./embedded-file-type";
import { createOlePackage } from "./ole-package";
import { PictureFrameShapeType } from "./picture-frame-shape-type";

/** The image formats Word draws an embedded file's picture in */
const PREVIEW_TYPES: ReadonlySet<string> = new Set(["jpg", "png", "gif", "bmp"]);

/** Number of English Metric Units in one pixel at 96 dpi. */
const EMUS_PER_PIXEL = 9525;

/** Number of points in one pixel at 96 dpi. */
const POINTS_PER_PIXEL = 0.75;

/**
 * The picture a document shows for an embedded file.
 */
export type EmbeddedFilePreview = {
    /** The image format. Word draws an embedded file's picture as a legacy picture, which can't be an SVG */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

/**
 * Options for an {@link EmbeddedFileRun}.
 */
export type EmbeddedFileRunOptions = {
    /**
     * The file's name, such as "budget.xlsx". Its extension says how the file is embedded: an Excel workbook (.xlsx,
     * .xlsm), a Word document (.docx, .docm) or a PowerPoint presentation (.pptx, .pptm) as itself, which Word opens in
     * Excel, Word or PowerPoint, and any other file, such as a sound, a video or a PDF, in an OLE package, which Word
     * for Windows opens with the application the computer opens its type with. A packaged file keeps the name
     */
    readonly fileName: string;
    /** The file. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /**
     * The picture the document shows for the file: of its content, such as a workbook's table, or an icon. Word draws
     * it until the file is opened and changed in its application, which then draws the file again
     */
    readonly preview: EmbeddedFilePreview;
    /** The size the picture is drawn at, in pixels, at 96 to the inch, as an ImageRun's */
    readonly transformation: {
        /** Width in pixels */
        readonly width: number;
        /** Height in pixels */
        readonly height: number;
    };
    /**
     * Whether the file is shown as an icon, as Word's "Display as icon" does, rather than as its content. When the file is
     * changed in its application, Word draws its application's icon instead of its content. A packaged file is always
     * shown as an icon. Default is false
     */
    readonly displayAsIcon?: boolean;
    /** A description of the file for screen readers, as Word's "Alt Text" */
    readonly altText?: string;
};

// Each object in a document has an id of its own (`ObjectID`), a number Word writes with ten digits
const objectNumber = uniqueNumericIdCreator(1_000_000_000);

/**
 * The object's OLE data (`o:OLEObject`): the application it is for, the shape it is drawn as, and the part its file is
 * in, which is added to the package, with the relationship to it, when it is written.
 */
class OleObject extends XmlComponent {
    public constructor(
        private readonly part: PackagePart<PackagePartRelationshipType>,
        { progId, shapeId, displayAsIcon }: { readonly progId: string; readonly shapeId: string; readonly displayAsIcon: boolean },
    ) {
        super("o:OLEObject");
        this.root.push(
            new NextAttributeComponent({
                type: { key: "Type", value: "Embed" },
                progId: { key: "ProgID", value: progId },
                shapeId: { key: "ShapeID", value: shapeId },
                drawAspect: { key: "DrawAspect", value: displayAsIcon ? "Icon" : "Content" },
                objectId: { key: "ObjectID", value: `_${objectNumber()}` },
                id: { key: "r:id", value: part.relationshipId },
            }),
        );
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        this.part.addTo(context);
        return super.prepForXml(context);
    }
}

/**
 * The bytes of data given as a Buffer, Uint8Array, ArrayBuffer or base64-encoded data URI string.
 */
const bytesOf = (data: Buffer | string | Uint8Array | ArrayBuffer): Uint8Array => {
    const standardized = standardizeData(data);
    return ArrayBuffer.isView(standardized)
        ? new Uint8Array(standardized.buffer, standardized.byteOffset, standardized.byteLength)
        : new Uint8Array(standardized);
};

/**
 * Represents a file embedded in a WordprocessingML document, as Word's Insert > Object > "Create from File" embeds one:
 * an OLE object, drawn as a picture of it, that opens the file from the document.
 *
 * An Excel workbook, Word document or PowerPoint presentation is embedded as itself, so Word opens it in its
 * application, which can change it in the document. Any other file, such as a sound, a video or a PDF, is embedded in an
 * OLE package, which Word for Windows opens with the application the computer opens its type with, as it does a file
 * embedded there. Word for Mac shows it, but can't open it.
 *
 * The document shows the picture given in `preview`, of the file's content or an icon, until the file is opened. The
 * object sits inline with text, in a paragraph, including in a table, header, footer or footnote.
 *
 * Reference: http://officeopenxml.com/WPembeddedObjects.php
 *
 * @publicApi
 *
 * ## XSD Schema
 * The embedded file combines several elements:
 * - w:r (run container)
 * - w:object (the embedded object, with its original size)
 * - v:shapetype and v:shape (the picture frame it's drawn in)
 * - v:imagedata (the picture)
 * - o:OLEObject (the application it is for, and the part the file is in)
 *
 * @example
 * ```typescript
 * new Paragraph({
 *   children: [
 *     new EmbeddedFileRun({
 *       fileName: "budget.xlsx",
 *       data: fs.readFileSync("./budget.xlsx"),
 *       preview: { type: "png", data: fs.readFileSync("./budget.png") },
 *       transformation: { width: 240, height: 120 },
 *     }),
 *   ],
 * });
 * ```
 */
export class EmbeddedFileRun extends Run {
    private readonly preview: IMediaData;

    /**
     * @throws If the file is an Excel workbook, Word document or PowerPoint presentation that isn't a zip file, as Office's
     * files are, so Office couldn't open it, such as an older Excel workbook (.xls) named .xlsx
     * @throws If the preview's type isn't "jpg", "png", "gif" or "bmp", such as when JavaScript leaves it out
     */
    public constructor({ fileName, data, preview, transformation, displayAsIcon = false, altText }: EmbeddedFileRunOptions) {
        // A run, so that it can be one of a paragraph's children. It has no formatting, so only the `w:r` is written
        super({});

        if (!PREVIEW_TYPES.has(preview.type)) {
            throw new Error(`EmbeddedFileRun: the preview's type is "${preview.type}". Expected "jpg", "png", "gif" or "bmp"`);
        }
        const fileType = embeddedFileTypeOf(fileName);
        const file = bytesOf(data);
        const packaged = fileType === PACKAGE_FILE_TYPE;
        // Office Open XML files start as a zip file does, with "PK\x03\x04"
        if (!packaged && !(file[0] === 0x50 && file[1] === 0x4b && file[2] === 0x03 && file[3] === 0x04)) {
            throw new Error(
                `EmbeddedFileRun: "${fileName}" isn't an Office Open XML file, which is a zip file, so Office couldn't open it. Name it with its own extension, such as .xls, to embed it in an OLE package`,
            );
        }
        const part = new PackagePart({
            folder: "embeddings",
            name: fileType.partName,
            extension: fileType.extension,
            contentType: fileType.contentType,
            relationshipType: fileType.relationshipType,
            content: packaged ? createOlePackage({ fileName, data: file }) : file,
        });

        const previewFileName = `${hashedId(preview.data)}.${preview.type}`;
        this.preview = {
            type: preview.type,
            data: standardizeData(preview.data),
            fileName: previewFileName,
            transformation: {
                pixels: { x: Math.round(transformation.width), y: Math.round(transformation.height) },
                emus: { x: Math.round(transformation.width * EMUS_PER_PIXEL), y: Math.round(transformation.height * EMUS_PER_PIXEL) },
            },
        };

        // Its size in points, which Word rounds to hundredths, and in twentieths of a point
        const width = Math.round(transformation.width * POINTS_PER_PIXEL * 100) / 100;
        const height = Math.round(transformation.height * POINTS_PER_PIXEL * 100) / 100;
        const shapeId = `EmbeddedFile${uniqueId()}`;

        this.root.push(
            new BuilderElement({
                name: "w:object",
                attributes: {
                    width: { key: "w:dxaOrig", value: Math.round(width * 20) },
                    height: { key: "w:dyaOrig", value: Math.round(height * 20) },
                },
                children: [
                    new PictureFrameShapeType(),
                    new BuilderElement<{
                        readonly id: string;
                        readonly type: string;
                        readonly alt?: string;
                        readonly style: string;
                        readonly ole: string;
                    }>({
                        name: "v:shape",
                        attributes: {
                            id: { key: "id", value: shapeId },
                            type: { key: "type", value: "#_x0000_t75" },
                            alt: { key: "alt", value: altText },
                            style: { key: "style", value: `width:${width}pt;height:${height}pt` },
                            ole: { key: "o:ole", value: "" },
                        },
                        children: [
                            new BuilderElement({
                                name: "v:imagedata",
                                attributes: {
                                    // Placeholder resolved to the relationship id of the part it's in by the packer
                                    id: { key: "r:id", value: `rId{${previewFileName}}` },
                                    title: { key: "o:title", value: "" },
                                },
                            }),
                        ],
                    }),
                    new OleObject(part, { progId: fileType.progId, shapeId, displayAsIcon: packaged || displayAsIcon }),
                ],
            }),
        );
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.preview.fileName, this.preview);

        return super.prepForXml(context);
    }
}
