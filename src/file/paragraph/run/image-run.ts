/**
 * ImageRun module for WordprocessingML documents.
 *
 * This module provides support for inserting images into documents.
 *
 * Reference: http://officeopenxml.com/drwPicInline.php
 *
 * @module
 */
import type { DocPropertiesOptions } from "@file/drawing/doc-properties/doc-properties";
import type { DrawingLinkOptions } from "@file/drawing/doc-properties/non-visual-drawing-properties";
import { ChangeAttributes, type IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { BuilderElement, type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";
import { hashedId } from "@util/convenience-functions";

import { type IRunPropertiesOptions, RunProperties } from "./properties";
import { Drawing, type IFloating } from "../../drawing";
import type { ICropOptions } from "../../drawing/inline/graphic/graphic-data/pic/blip/source-rectangle";
import type { OutlineOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import type { SolidFillOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/solid-fill";
import type { IMediaTransformation } from "../../media";
import type { IMediaData } from "../../media/data";

/**
 * Core options for image configuration.
 *
 * `link` opens a web address when the image is clicked (with Ctrl in Word), and takes precedence over a hyperlink the
 * image is in. `decorative` marks the image as decorative, as Word's "Mark as decorative" does, so screen readers skip
 * it: use it instead of alternative text for images that carry no information, such as borders and flourishes.
 */
type CoreImageOptions = DrawingLinkOptions & {
    /** Size, position, rotation, and flip settings for the image. Width and height are in pixels, at 96 to the inch, not EMUs. */
    readonly transformation: IMediaTransformation;
    /** Floating layout options. When set, the image is positioned freely on the page rather than inline with text. Controls text wrapping, overlap, anchoring, and z-order. */
    readonly floating?: IFloating;
    /** Accessibility properties for the image, including a name, description (alt text), and title. */
    readonly altText?: DocPropertiesOptions;
    /** Border/outline settings for the image, including line width, color, cap style, and compound line type. */
    readonly outline?: OutlineOptions;
    /** Solid color fill behind the image, using either an RGB hex value or a theme scheme color. */
    readonly solidFill?: SolidFillOptions;
    /** Crops the image by trimming a percentage (0-100) off each edge before it is stretched to fill the frame. */
    readonly crop?: ICropOptions;
    /** Formatting of the run the image is in, such as `position` to raise or lower it from the text's baseline. */
    readonly run?: IRunPropertiesOptions;
    /** Marks the image as an inserted revision for change tracking. Requires an id, author name, and date. */
    readonly insertion?: IChangedAttributesProperties;
    /**
     * Marks the image as a deleted revision for change tracking. Requires an id, author name, and date. With
     * `insertion`, the image was inserted and then deleted, such as by another author.
     */
    readonly deletion?: IChangedAttributesProperties;
};

type RegularImageOptions = {
    /**
     * The image format. JavaScript, which has no types to require it, can leave it out, and it is then read from the
     * start of `data`, so data that isn't a PNG, JPEG, GIF or BMP file is an error.
     */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

type SvgMediaOptions = {
    /** The image format. Must be `"svg"` for SVG images. */
    readonly type: "svg";
    /** The SVG image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /** A non-SVG fallback image, required for Word processors that do not support SVG rendering. */
    readonly fallback: RegularImageOptions;
};

/**
 * Options for creating an ImageRun.
 *
 * @see {@link ImageRun}
 */
export type IImageOptions = (RegularImageOptions | SvgMediaOptions) & CoreImageOptions;

const convertDataURIToBinary = (dataURI: string): Uint8Array => {
    // https://gist.github.com/borismus/1032746
    // https://github.com/mafintosh/base64-to-uint8array
    const BASE64_MARKER = ";base64,";
    const base64Index = dataURI.indexOf(BASE64_MARKER);

    const base64IndexWithOffset = base64Index === -1 ? 0 : base64Index + BASE64_MARKER.length;

    return new Uint8Array(
        atob(dataURI.substring(base64IndexWithOffset))
            .split("")
            .map((c) => c.charCodeAt(0)),
    );
};

export const standardizeData = (data: string | Buffer | Uint8Array | ArrayBuffer): Buffer | Uint8Array | ArrayBuffer =>
    typeof data === "string" ? convertDataURIToBinary(data) : data;

// The bytes each format's files start with
const SIGNATURES: readonly (readonly [RegularImageOptions["type"], readonly number[]])[] = [
    ["png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["jpg", [0xff, 0xd8, 0xff]],
    ["gif", [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]], // GIF87a
    ["gif", [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF89a
    ["bmp", [0x42, 0x4d]], // BM
];

/**
 * The format of an image given without a `type`, read from the bytes its file starts with. Without one, its file in the
 * package would be named `.undefined`, which has no content type, so Word reports the document as unreadable.
 */
const typeOf = ({ type, data }: RegularImageOptions, name: string): RegularImageOptions["type"] => {
    if (type !== undefined) {
        return type;
    }
    const standardized = standardizeData(data);
    // A view's own bytes, for a Buffer that is a slice of a larger one
    const bytes = ArrayBuffer.isView(standardized)
        ? new Uint8Array(standardized.buffer, standardized.byteOffset, standardized.byteLength)
        : new Uint8Array(standardized);
    const signature = SIGNATURES.find(([, start]) => start.every((byte, index) => bytes[index] === byte));
    if (signature === undefined) {
        throw new Error(`${name}: type isn't given, and data isn't a PNG, JPEG, GIF or BMP file to read it from. Give its type`);
    }
    return signature[0];
};

const createImageData = (options: IImageOptions, key: string): Pick<IMediaData, "data" | "fileName" | "transformation"> => ({
    data: standardizeData(options.data),
    fileName: key,
    transformation: {
        pixels: {
            x: Math.round(options.transformation.width),
            y: Math.round(options.transformation.height),
        },
        emus: {
            x: Math.round(options.transformation.width * 9525),
            y: Math.round(options.transformation.height * 9525),
        },
        flip: options.transformation.flip,
        rotation: options.transformation.rotation ? options.transformation.rotation * 60000 : undefined,
    },
});

/** The media data of a PNG, JPEG, GIF or BMP image, as an image of its own or as an SVG image's fallback */
const createRegularImageData = (
    options: RegularImageOptions,
    transformation: IMediaTransformation,
    name: string,
): Exclude<IMediaData, { readonly type: "svg" }> => {
    const type = typeOf(options, name);
    return { type, ...createImageData({ ...options, transformation }, `${hashedId(options.data)}.${type}`) };
};

const createDeletion = ({ id, author, date }: IChangedAttributesProperties, run: XmlComponent): XmlComponent =>
    new BuilderElement<IChangedAttributesProperties>({
        name: "w:del",
        attributes: {
            id: { key: "w:id", value: id },
            author: { key: "w:author", value: author },
            date: { key: "w:date", value: date },
        },
        children: [run],
    });

/**
 * Represents an image in a WordprocessingML document.
 *
 * ImageRun embeds an image within a run, supporting various formats
 * including JPG, PNG, GIF, BMP, and SVG. Optionally wraps the run in
 * `<w:ins>` or `<w:del>`, or both, for track-change insertion/deletion markup.
 *
 * Reference: http://officeopenxml.com/drwPicInline.php
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new ImageRun({
 *   data: fs.readFileSync("./image.png"),
 *   transformation: {
 *     width: 100,
 *     height: 100,
 *   },
 *   type: "png",
 * });
 * ```
 */
export class ImageRun extends XmlComponent {
    private readonly imageData: IMediaData;

    public constructor(options: IImageOptions) {
        const imageData: IMediaData =
            options.type === "svg"
                ? {
                      type: options.type,
                      ...createImageData(options, `${hashedId(options.data)}.svg`),
                      fallback: createRegularImageData(options.fallback, options.transformation, "ImageRun fallback"),
                  }
                : createRegularImageData(options, options.transformation, "ImageRun");

        const drawing = new Drawing(imageData, {
            floating: options.floating,
            docProperties: options.altText,
            outline: options.outline,
            solidFill: options.solidFill,
            crop: options.crop,
            link: options.link,
            decorative: options.decorative,
        });
        const properties = new RunProperties(options.run);

        // Track-change wrappers: w:ins / w:del enclose the run so Word displays the image as an inserted or deleted
        // revision. An image inserted and then deleted is in both: w:ins > w:del > w:r
        const revision = options.insertion ?? options.deletion;
        const rootName = options.insertion ? "w:ins" : options.deletion ? "w:del" : "w:r";

        // One super() call, not one per branch: the build wraps a super() inside a branch in an arrow function, which
        // Next.js Turbopack turns into a plain function, and a plain function can't call super()
        super(rootName);

        if (revision) {
            this.root.push(
                new ChangeAttributes({
                    id: revision.id,
                    author: revision.author,
                    date: revision.date,
                }),
            );
            const run = new BuilderElement({ name: "w:r", children: [properties, drawing] });
            this.addChildElement(options.insertion && options.deletion ? createDeletion(options.deletion, run) : run);
        } else {
            this.root.push(properties);
            this.root.push(drawing);
        }

        this.imageData = imageData;
    }

    public prepForXml(context: IContext): IXmlableObject | undefined {
        context.file.Media.addImage(this.imageData.fileName, this.imageData);

        if (this.imageData.type === "svg") {
            context.file.Media.addImage(this.imageData.fallback.fileName, this.imageData.fallback);
        }

        return super.prepForXml(context);
    }
}
