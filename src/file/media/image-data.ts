/**
 * Turns image options, as given to an ImageRun or a picture fill, into the media data stored in the document.
 *
 * @module
 */
import { hashedId } from "@util/convenience-functions";

import type { IMediaData, IMediaDataTransformation } from "./data";

/**
 * Image data: a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string.
 */
export type ImageSourceData = Buffer | string | Uint8Array | ArrayBuffer;

/**
 * A picture in a raster format.
 */
export type RasterImageSource = {
    /** The image format */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: ImageSourceData;
};

/**
 * An SVG picture, with a raster picture for applications that can't draw SVG.
 */
export type SvgImageSource = {
    /** The image format */
    readonly type: "svg";
    /** The SVG data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string */
    readonly data: ImageSourceData;
    /** A picture in a raster format, for Word processors that can't draw SVG */
    readonly fallback: RasterImageSource;
};

/**
 * A picture: its format and data.
 *
 * @publicApi
 */
export type ImageSource = RasterImageSource | SvgImageSource;

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

/**
 * Converts image data given as a base64 string to binary. Binary data is returned as it is.
 */
export const standardizeData = (data: ImageSourceData): Buffer | Uint8Array | ArrayBuffer =>
    typeof data === "string" ? convertDataURIToBinary(data) : data;

/**
 * Creates the media data for a picture. Its file name comes from a hash of its data, so the same picture
 * used twice is stored once.
 */
export const createImageMediaData = (image: ImageSource, transformation: IMediaDataTransformation): IMediaData => {
    const fileName = `${hashedId(image.data)}.${image.type}`;
    if (image.type === "svg") {
        return {
            type: "svg",
            fileName,
            data: standardizeData(image.data),
            transformation,
            fallback: {
                type: image.fallback.type,
                fileName: `${hashedId(image.fallback.data)}.${image.fallback.type}`,
                data: standardizeData(image.fallback.data),
                transformation,
            },
        };
    }

    return { type: image.type, fileName, data: standardizeData(image.data), transformation };
};
