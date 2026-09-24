/**
 * Image watermark module for WordprocessingML documents.
 *
 * An image watermark is a picture, typically a logo, drawn faintly behind the
 * content of every page. Word implements it as a legacy picture shape placed in the
 * page header, and this module produces the same markup.
 *
 * Reference: https://support.microsoft.com/en-us/office/insert-a-watermark-c0ec3d5a-6f3e-4f3c-a8b0-9d9a6f56d3fd
 *
 * @module
 */
import {
    type IContext,
    type IMediaData,
    type IXmlableObject,
    XmlComponent,
    createVmlShape,
    hashedId,
    standardizeData,
    uniqueId,
} from "docx";

import { createPict } from "./vml/pict";
import { PICTURE_FRAME_SHAPE_TYPE_ID, createPictureFrameShapeType } from "./vml/picture-frame-shape-type";
import { createVmlImageData } from "./vml/vml-image-data";
import { createWatermarkShapeStyle } from "./watermark-shape-style";

/**
 * Prefix Word gives to picture watermark shapes. Word's "Remove Watermark"
 * command finds watermarks by this prefix.
 */
const IMAGE_WATERMARK_ID_PREFIX = "WordPictureWatermark";

/** Brightness multiplier Word applies for its "washout" effect. */
const WASHOUT_GAIN = 0.3;

/** Black level Word applies for its "washout" effect. */
const WASHOUT_BLACK_LEVEL = 0.35;

/** Number of English Metric Units in one pixel at 96 dpi. */
const EMUS_PER_PIXEL = 9525;

/** Number of points in one pixel at 96 dpi. */
const POINTS_PER_PIXEL = 0.75;

/**
 * Converts a pixel measurement into points, rounded to two decimal places.
 *
 * @param pixels - The measurement in pixels
 * @returns The measurement in points
 */
const pixelsToPoints = (pixels: number): number => Math.round(pixels * POINTS_PER_PIXEL * 100) / 100;

/**
 * Options for creating an image watermark.
 *
 * @see {@link ImageWatermark}
 */
export type IImageWatermarkOptions = {
    /** The image format. VML pictures do not support SVG. */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /** Size at which the image is drawn, in pixels, matching ImageRun. The image is centred on the page. */
    readonly transformation: {
        /** Display width in pixels. */
        readonly width: number;
        /** Display height in pixels. */
        readonly height: number;
    };
    /** Whether the image is lightened so that text remains readable over it. Default is true, matching Word's "Washout" option. */
    readonly washout?: boolean;
    /** Title of the image, shown by Word as the picture's name. */
    readonly title?: string;
};

/**
 * Represents an image watermark in a WordprocessingML document.
 *
 * ImageWatermark is an inline element that belongs inside a paragraph, and the
 * paragraph belongs in a header so that the watermark repeats on every page of
 * the section. It renders as a picture shape centred on the page behind the
 * document text, exactly as Word's Design > Watermark command does, so Word
 * recognizes it and can remove or replace it through that command.
 *
 * The image is registered with the document's media collection during
 * serialization and linked from the header through a relationship, in the same
 * way as an ImageRun.
 *
 * @publicApi
 *
 * ## XSD Schema
 * The watermark combines several elements:
 * - w:r (run container)
 * - w:pict (picture element containing VML)
 * - v:shapetype (picture frame shape type definition)
 * - v:shape (the positioned picture shape)
 * - v:imagedata (the image reference and washout adjustments)
 *
 * @example
 * ```typescript
 * new Document({
 *   sections: [
 *     {
 *       headers: {
 *         default: new Header({
 *           children: [
 *             new Paragraph({
 *               children: [
 *                 new ImageWatermark({
 *                   type: "png",
 *                   data: fs.readFileSync("./logo.png"),
 *                   transformation: { width: 400, height: 400 },
 *                 }),
 *               ],
 *             }),
 *           ],
 *         }),
 *       },
 *       children: [new Paragraph("Body text")],
 *     },
 *   ],
 * });
 * ```
 */
export class ImageWatermark extends XmlComponent {
    private readonly mediaData: IMediaData;

    public constructor({ type, data, transformation, washout = true, title }: IImageWatermarkOptions) {
        super("w:r");

        const fileName = `${hashedId(data)}.${type}`;

        this.mediaData = {
            type,
            data: standardizeData(data),
            fileName,
            transformation: {
                pixels: {
                    x: Math.round(transformation.width),
                    y: Math.round(transformation.height),
                },
                emus: {
                    x: Math.round(transformation.width * EMUS_PER_PIXEL),
                    y: Math.round(transformation.height * EMUS_PER_PIXEL),
                },
            },
        };

        this.root.push(
            createPict({
                children: [
                    createPictureFrameShapeType(),
                    createVmlShape({
                        id: `${IMAGE_WATERMARK_ID_PREFIX}${uniqueId()}`,
                        type: `#${PICTURE_FRAME_SHAPE_TYPE_ID}`,
                        style: createWatermarkShapeStyle({
                            width: pixelsToPoints(transformation.width),
                            height: pixelsToPoints(transformation.height),
                        }),
                        allowInCell: false,
                        children: [
                            createVmlImageData({
                                // Placeholder resolved to the header's relationship id by the packer.
                                relationshipId: `rId{${fileName}}`,
                                title,
                                gain: washout ? WASHOUT_GAIN : undefined,
                                blackLevel: washout ? WASHOUT_BLACK_LEVEL : undefined,
                            }),
                        ],
                    }),
                ],
            }),
        );
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.mediaData.fileName, this.mediaData);

        return super.prepForXml(context);
    }
}
