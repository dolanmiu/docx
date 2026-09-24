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
import { ChangeAttributes, type IChangedAttributesProperties } from "@file/track-revision/track-revision";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";
import { hashedId } from "@util/convenience-functions";

import { RunProperties } from "./properties";
import { Run } from "./run";
import { Drawing, type IFloating } from "../../drawing";
import type { ICropOptions } from "../../drawing/inline/graphic/graphic-data/pic/blip/source-rectangle";
import type { OutlineOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import type { SolidFillOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/solid-fill";
import type { IMediaTransformation } from "../../media";
import type { IMediaData } from "../../media/data";
import { standardizeData } from "../../media/image-data";

/**
 * Core options for image configuration.
 */
type CoreImageOptions = {
    /** Size, position, rotation, and flip settings for the image. Width and height are specified in pixels. */
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
    /** Marks the image as an inserted revision for change tracking. Requires an id, author name, and date. */
    readonly insertion?: IChangedAttributesProperties;
    /** Marks the image as a deleted revision for change tracking. Requires an id, author name, and date. */
    readonly deletion?: IChangedAttributesProperties;
};

type RegularImageOptions = {
    /** The image format. */
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

export { standardizeData } from "../../media/image-data";

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

/**
 * Represents an image in a WordprocessingML document.
 *
 * ImageRun embeds an image within a run, supporting various formats
 * including JPG, PNG, GIF, BMP, and SVG. Optionally wraps the run in
 * `<w:ins>` or `<w:del>` for track-change insertion/deletion markup.
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
        const hash = hashedId(options.data);
        const key = `${hash}.${options.type}`;

        const imageData: IMediaData =
            options.type === "svg"
                ? {
                      type: options.type,
                      ...createImageData(options, key),
                      fallback: {
                          type: options.fallback.type,
                          ...createImageData(
                              {
                                  ...options.fallback,
                                  transformation: options.transformation,
                              },
                              `${hashedId(options.fallback.data)}.${options.fallback.type}`,
                          ),
                      },
                  }
                : {
                      type: options.type,
                      ...createImageData(options, key),
                  };

        const drawing = new Drawing(imageData, {
            floating: options.floating,
            docProperties: options.altText,
            outline: options.outline,
            crop: options.crop,
        });

        const run = new Run({ children: [drawing] });

        // Track-change wrappers: w:ins / w:del enclose the run so Word
        // displays the image as an inserted or deleted revision.
        if (options.insertion) {
            super("w:ins");
            this.root.push(
                new ChangeAttributes({
                    id: options.insertion.id,
                    author: options.insertion.author,
                    date: options.insertion.date,
                }),
            );
            this.addChildElement(run);
        } else if (options.deletion) {
            super("w:del");
            this.root.push(
                new ChangeAttributes({
                    id: options.deletion.id,
                    author: options.deletion.author,
                    date: options.deletion.date,
                }),
            );
            this.addChildElement(run);
        } else {
            super("w:r");
            this.root.push(new RunProperties({}));
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
