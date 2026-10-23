/**
 * The data of images, for `ImageRun` and the patcher's `ImagePatch`: their formats, read from their bytes when not given,
 * and their bytes, from a data URI.
 *
 * @module
 */

/**
 * A PNG, JPEG, GIF or BMP image.
 */
export type RegularImageOptions = {
    /**
     * The image format. JavaScript, which has no types to require it, can leave it out, and it is then read from the
     * start of `data`, so data that isn't a PNG, JPEG, GIF or BMP file is an error.
     */
    readonly type: "jpg" | "png" | "gif" | "bmp";
    /** The image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
};

/**
 * An SVG image, with an image of another format for applications that can't show SVG.
 */
export type SvgMediaOptions = {
    /** The image format. Must be `"svg"` for SVG images. */
    readonly type: "svg";
    /** The SVG image data. Accepts a Buffer, Uint8Array, ArrayBuffer, or a base64-encoded data URI string. */
    readonly data: Buffer | string | Uint8Array | ArrayBuffer;
    /** A non-SVG fallback image, required for Word processors that do not support SVG rendering. */
    readonly fallback: RegularImageOptions;
};

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
export const imageTypeOf = ({ type, data }: RegularImageOptions, name: string): RegularImageOptions["type"] => {
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
