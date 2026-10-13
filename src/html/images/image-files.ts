/**
 * Image files, for the pictures of HTML: what format a file is in, told from its bytes, and its size in pixels; and the
 * bytes of a `data:` URL, or of image data given as a string.
 *
 * Its reading of PNG, JPEG, GIF and BMP sizes is a copy of `src/layout/image-sizes.ts`'s, without the resolutions, as
 * `docx/html` and `docx/layout` are separate entries that import only `docx`. Make a fix in both.
 *
 * @module
 */
// cspell:ignore IHDR avis ftyp recognises recognised VBOR

/** The formats of image files docx/html recognises. Word can show png, jpg, gif, bmp and svg */
export type ImageFormat = "png" | "jpg" | "gif" | "bmp" | "svg" | "webp" | "avif" | "tiff" | "ico";

/** An image file's format, and its size in pixels when the file gives it */
export type ImageFile = { readonly format: ImageFormat; readonly width?: number; readonly height?: number };

type Size = { readonly width: number; readonly height: number };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const BMP_SIGNATURE = [0x42, 0x4d];
const AVIF_BRANDS = ["avif", "avis"];

const startsWith = (data: Uint8Array, bytes: readonly number[]): boolean => bytes.every((byte, index) => data[index] === byte);
const viewOf = (data: Uint8Array): DataView => new DataView(data.buffer, data.byteOffset, data.byteLength);
const ascii = (data: Uint8Array, at: number, length: number): string => String.fromCharCode(...data.subarray(at, at + length));

/** A PNG's size is in its first chunk (IHDR) */
const readPng = (data: Uint8Array): Size | undefined =>
    data.length < 24 || ascii(data, 12, 4) !== "IHDR"
        ? undefined
        : { width: viewOf(data).getUint32(16), height: viewOf(data).getUint32(20) };

// The JPEG markers of a frame's start, which give its size: SOF0 to SOF15 but DHT (C4), JPG (C8) and DAC (CC)
const isFrameStart = (marker: number): boolean => marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

/** A JPEG's size is in its frame's header (SOFn), after segments of other kinds */
const readJpeg = (data: Uint8Array): Size | undefined => {
    const view = viewOf(data);
    let at = 2;
    while (at + 4 <= data.length) {
        if (data[at] !== 0xff) {
            return undefined;
        }
        const marker = data[at + 1];
        if (marker === 0xff) {
            // Markers may be padded with FF bytes
            at += 1;
            continue;
        }
        if (isFrameStart(marker)) {
            return at + 9 <= data.length ? { width: view.getUint16(at + 7), height: view.getUint16(at + 5) } : undefined;
        }
        at += 2 + view.getUint16(at + 2);
    }
    return undefined;
};

/** A GIF's size is in its header, little-endian, after its signature and version */
const readGif = (data: Uint8Array): Size | undefined =>
    data.length < 10 ? undefined : { width: viewOf(data).getUint16(6, true), height: viewOf(data).getUint16(8, true) };

/** A BMP's size is in its information header, little-endian, its height negative for one stored top down */
const readBmp = (data: Uint8Array): Size | undefined =>
    data.length < 26 ? undefined : { width: viewOf(data).getUint32(18, true), height: Math.abs(viewOf(data).getInt32(22, true)) };

/** An AVIF file is an ISO media file whose first box (`ftyp`) names AVIF as its major brand or one it is compatible with */
const isAvif = (data: Uint8Array): boolean => {
    if (ascii(data, 4, 4) !== "ftyp") {
        return false;
    }
    // The major brand, then its version, then the compatible brands to the box's end
    const end = Math.min(viewOf(data).getUint32(0), data.length);
    const compatible = Array.from({ length: Math.max(0, Math.floor((end - 16) / 4)) }, (_, index) => 16 + index * 4);
    return [8, ...compatible].some((at) => AVIF_BRANDS.includes(ascii(data, at, 4)));
};

type SizeReader = (data: Uint8Array) => Size | undefined;

// Each format told by the bytes its files start with, and how its size is read when docx/html needs it, as Word can't
// show the formats whose size isn't read
const SIGNATURES: readonly (readonly [ImageFormat, (data: Uint8Array) => boolean, SizeReader?])[] = [
    ["png", (data) => startsWith(data, PNG_SIGNATURE), readPng],
    ["jpg", (data) => startsWith(data, JPEG_SIGNATURE), readJpeg],
    ["gif", (data) => ["GIF87a", "GIF89a"].includes(ascii(data, 0, 6)), readGif],
    ["bmp", (data) => startsWith(data, BMP_SIGNATURE), readBmp],
    ["webp", (data) => ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 4) === "WEBP"],
    ["avif", isAvif],
    ["tiff", (data) => startsWith(data, [0x49, 0x49, 0x2a, 0x00]) || startsWith(data, [0x4d, 0x4d, 0x00, 0x2a])],
    ["ico", (data) => startsWith(data, [0x00, 0x00, 0x01, 0x00])],
];

/** A size of no pixels, or of more than a number can hold, is none Word can show */
const isSize = (pixels: number): boolean => pixels > 0 && pixels < Infinity;

// An SVG's root element comes in its first few kilobytes, and looking no further keeps a large file that isn't text
// from being decoded whole
const SVG_TEXT_BYTES = 8192;
// What may come before an XML file's root element: whitespace, its declaration and other processing instructions,
// comments, and a doctype, with declarations of its own in brackets
const XML_PROLOG = /^(?:\s+|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE(?:[^>[]|\[[^\]]*\])*>)*/i;
// The root's start tag when it is an `svg` element, in SVG's namespace by a prefix or not, with its attributes
const SVG_START_TAG = /^<(?:[A-Za-z_][\w.-]*:)?svg(?=[\s/>])((?:[^>"']|"[^"]*"|'[^']*')*)/;
const ATTRIBUTE = /(?<=\s)([^\s="']+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const LENGTH = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(px|pt|pc|in|cm|mm|q|em|ex)?$/i;
// CSS's absolute units in pixels, and an em and an ex in the pixels of a browser's default font
const PIXELS_PER_UNIT: Readonly<Record<string, number>> = {
    px: 1,
    pt: 96 / 72,
    pc: 16,
    in: 96,
    cm: 96 / 2.54,
    mm: 96 / 25.4,
    q: 96 / 101.6,
    em: 16,
    ex: 8,
};
// The size a browser gives a replaced element, such as an SVG, that has none of its own
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;

/** A length's pixels, with no unit for pixels; a percentage, `auto` or a length of no pixels isn't a size */
const lengthInPixels = (value: string | undefined): number | undefined => {
    const length = LENGTH.exec(value?.trim() ?? "");
    const pixels = length ? Number(length[1]) * PIXELS_PER_UNIT[(length[2] ?? "px").toLowerCase()] : 0;
    return isSize(pixels) ? pixels : undefined;
};

/** The width and height of a `viewBox`, its four numbers apart by whitespace or commas, when they are a size */
const viewBoxSize = (value: string | undefined): Size | undefined => {
    const parts = (value ?? "").trim().split(/[\s,]+/);
    if (parts.length !== 4 || !parts.every((part) => NUMBER.test(part))) {
        return undefined;
    }
    const [, , width, height] = parts.map(Number);
    return isSize(width) && isSize(height) ? { width, height } : undefined;
};

/**
 * An SVG's size as a browser sizes an `<img>` of it: its `width` and `height`, the one missing worked out from its
 * `viewBox`'s proportions, the `viewBox`'s own size when both are, and otherwise the browser's default
 */
const svgSize = (attributes: ReadonlyMap<string, string>): Size => {
    const width = lengthInPixels(attributes.get("width"));
    const height = lengthInPixels(attributes.get("height"));
    const viewBox = viewBoxSize(attributes.get("viewBox"));
    if ((width !== undefined && height !== undefined) || viewBox === undefined) {
        return { width: width ?? DEFAULT_WIDTH, height: height ?? DEFAULT_HEIGHT };
    }
    if (width !== undefined) {
        return { width, height: (width * viewBox.height) / viewBox.width };
    }
    return height === undefined ? viewBox : { width: (height * viewBox.width) / viewBox.height, height };
};

/** An SVG file is text whose root element is `svg`, and its size is in the attributes of that element's start tag */
const readSvg = (data: Uint8Array): ImageFile | undefined => {
    // A byte order mark is left out by the decoder
    const text = new TextDecoder().decode(data.subarray(0, SVG_TEXT_BYTES));
    const startTag = SVG_START_TAG.exec(text.replace(XML_PROLOG, ""));
    if (!startTag) {
        return undefined;
    }
    const attributes = new Map(
        Array.from(startTag[1].matchAll(ATTRIBUTE), ([, name, double, single]): readonly [string, string] => [name, double ?? single]),
    );
    return { format: "svg", ...svgSize(attributes) };
};

/**
 * Recognises an image file by its bytes (not by any file name or MIME type), and reads its size in pixels:
 * PNG, JPEG, GIF and BMP as src/layout/image-sizes.ts reads them, and SVG from its root element. Undefined for bytes
 * that aren't an image file it recognises.
 *
 * WebP, AVIF, TIFF and ICO files, which Word can't show, are recognised without a size, as is a PNG, JPEG, GIF or BMP
 * file cut too short to give one, or one whose width or height is 0. An SVG's size is worked out as a browser works out
 * the size of an `<img>` of it, from its root element's `width`, `height` and `viewBox`, and may be in fractions of a
 * pixel.
 *
 * @param data - The file's bytes
 * @returns The file's format, and its size in pixels when the file gives it
 */
export const readImageFile = (data: Uint8Array): ImageFile | undefined => {
    const signature = SIGNATURES.find(([, matches]) => matches(data));
    if (signature === undefined) {
        return readSvg(data);
    }
    const [format, , readSize] = signature;
    const size = readSize?.(data);
    return size !== undefined && isSize(size.width) && isSize(size.height) ? { format, ...size } : { format };
};

const DATA_URL_SCHEME = /^\s*data:/i;
const BASE64_PARAMETER = /; *base64$/i;
// A media type's type and subtype, each a token of HTTP's characters
const MEDIA_TYPE = /^[\w!#$%&'*+.^`|~-]+\/[\w!#$%&'*+.^`|~-]+$/;
const PERCENT_ESCAPE = /%([\da-f]{2})/gi;
const BASE64 = /^[\w+/-]*={0,2}$/;

/**
 * The bytes of base64, with whitespace in it or not, padded or not, in either alphabet (`+/` or the URL's `-_`), or
 * undefined for text that isn't base64
 */
const decodeBase64 = (text: string): Uint8Array | undefined => {
    const base64 = text.replace(/[\t\n\f\r ]+/g, "");
    const digits = base64.replace(/=+$/, "").replace(/[-_]/g, (digit) => (digit === "-" ? "+" : "/"));
    // A single digit left over after the groups of four is less than a byte
    if (!BASE64.test(base64) || digits.length % 4 === 1) {
        return undefined;
    }
    // Padded, it is decoded the same by every browser's atob and Node's
    const binary = atob(digits.padEnd(Math.ceil(digits.length / 4) * 4, "="));
    // Mapped by index, which is many times faster for a large image than going through the string's characters
    return new Uint8Array(binary.length).map((_, at) => binary.charCodeAt(at));
};

/** The bytes of text, UTF-8, with its percent escapes decoded; a `%` not followed by two hex digits is left as it is */
const percentDecode = (text: string): Uint8Array => {
    const encoder = new TextEncoder();
    // Split by its escapes, which are kept, each between two parts of text
    return new Uint8Array(
        text
            .split(/(%[\da-f]{2})/i)
            .flatMap((part, index) => (index % 2 === 1 ? [parseInt(part.slice(1), 16)] : [...encoder.encode(part)])),
    );
};

/**
 * Reads a `data:` URL, such as `data:image/png;base64,iVBOR…` or `data:image/svg+xml;utf8,<svg …>` (percent-encoded
 * or not): its media type, lower-cased, without parameters ("text/plain" when it has none, as the spec says), and its
 * bytes (UTF-8 for text that isn't base64). Undefined for anything that isn't a data URL or whose base64 is invalid.
 *
 * It reads them as browsers do (the Fetch standard's data URL processor), but for text that isn't base64, which is
 * kept as it is: its tabs and newlines aren't taken out, and a `#` is part of it rather than the start of a fragment,
 * as SVG written into data URLs often has colours such as `#fff` that aren't escaped. A media type that isn't a type
 * and a subtype, such as `image`, is read as "text/plain", as browsers read it.
 *
 * @param url - The data URL
 * @returns Its media type and its bytes
 */
export const decodeDataUrl = (url: string): { readonly mediaType: string; readonly data: Uint8Array } | undefined => {
    const comma = url.indexOf(",");
    if (!DATA_URL_SCHEME.test(url) || comma < 0) {
        return undefined;
    }
    const header = url.slice(url.indexOf(":") + 1, comma).trim();
    const base64 = BASE64_PARAMETER.exec(header);
    const essence = header.slice(0, base64?.index).split(";")[0].trim();
    const mediaType = MEDIA_TYPE.test(essence) ? essence.toLowerCase() : "text/plain";
    const body = url.slice(comma + 1).trimEnd();
    // Base64's escaped characters are ASCII, so each decodes to the character of its byte
    const data = base64
        ? decodeBase64(body.replace(PERCENT_ESCAPE, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))))
        : percentDecode(body);
    return data === undefined ? undefined : { mediaType, data };
};

/**
 * Image data as bytes: a Uint8Array (or Node Buffer, which is one) as is, an ArrayBuffer viewed as bytes, and a string
 * as a data URL or as base64 (whitespace inside allowed). Undefined for a string that is neither.
 *
 * @param data - The image data
 * @returns Its bytes
 */
export const toBytes = (data: Uint8Array | ArrayBuffer | string): Uint8Array | undefined =>
    typeof data === "string"
        ? DATA_URL_SCHEME.test(data)
            ? decodeDataUrl(data)?.data
            : decodeBase64(data)
        : ArrayBuffer.isView(data)
          ? data
          : new Uint8Array(data);
