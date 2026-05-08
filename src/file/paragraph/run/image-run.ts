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
import type { OutlineOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/outline";
import type { SolidFillOptions } from "../../drawing/inline/graphic/graphic-data/pic/shape-properties/outline/solid-fill";
import type { IMediaTransformation } from "../../media";
import type { IMediaData } from "../../media/data";

/**
 * Core options for image configuration.
 */
type CoreImageOptions = {
    readonly transformation: IMediaTransformation;
    readonly floating?: IFloating;
    readonly altText?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
    readonly solidFill?: SolidFillOptions;
    readonly insertion?: IChangedAttributesProperties;
    readonly deletion?: IChangedAttributesProperties;
};

type RegularImageOptions = {
    readonly type: "jpg" | "png" | "gif" | "bmp";
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

type SvgMediaOptions = {
    readonly type: "svg";
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /**
     * Required in case the Word processor does not support SVG.
     */
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
 * including JPG, PNG, GIF, BMP, and SVG.
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
        });

        const run = new Run({ children: [drawing] });

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
