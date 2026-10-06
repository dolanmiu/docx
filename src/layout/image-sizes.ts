/**
 * Reads the size of an image in pixels from its file, for the pictures of VML drawings (`v:imagedata`), which Word draws
 * at their shapes' sizes but for the smallest, which it draws by their pixels (see `read-document.ts`). PNG, JPEG, GIF
 * and BMP files are read; another format's size isn't.
 *
 * @module
 */
// cspell:ignore IHDR IDAT IEND JFIF

/** The size of an image in pixels, with the resolution its file gives it, in dots to the inch, when it gives one */
export type ImageSize = {
    readonly width: number;
    readonly height: number;
    readonly density?: number;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8];
const BMP_SIGNATURE = [0x42, 0x4d];
const METRES_PER_INCH = 0.0254;

const startsWith = (data: Uint8Array, bytes: readonly number[]): boolean => bytes.every((byte, index) => data[index] === byte);
const viewOf = (data: Uint8Array): DataView => new DataView(data.buffer, data.byteOffset, data.byteLength);
const ascii = (data: Uint8Array, at: number, length: number): string => String.fromCharCode(...data.subarray(at, at + length));

/** A size with a resolution, when the file gives one in dots to the inch: none, or zero, is left out */
const withDensity = (width: number, height: number, density: number | undefined): ImageSize =>
    density === undefined || density <= 0 || !Number.isFinite(density) ? { width, height } : { width, height, density };

/**
 * A PNG's size is in its first chunk (IHDR), and its resolution in its pHYs chunk, in pixels to the metre when its unit
 * is the metre, or in no unit, which gives no resolution
 */
const readPng = (data: Uint8Array): ImageSize | undefined => {
    if (data.length < 24 || ascii(data, 12, 4) !== "IHDR") {
        return undefined;
    }
    const view = viewOf(data);
    let density: number | undefined;
    let at = 8;
    while (at + 8 <= data.length) {
        const length = view.getUint32(at);
        const type = ascii(data, at + 4, 4);
        if (type === "pHYs" && length === 9 && at + 17 <= data.length) {
            const perMetre = view.getUint32(at + 8);
            density = data[at + 16] === 1 ? perMetre * METRES_PER_INCH : undefined;
        }
        if (type === "IDAT" || type === "IEND") {
            break;
        }
        at += 12 + length;
    }
    return withDensity(view.getUint32(16), view.getUint32(20), density);
};

// The JPEG markers of a frame's start, which give its size: SOF0 to SOF15 but DHT (C4), JPG (C8) and DAC (CC)
const isFrameStart = (marker: number): boolean => marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

/**
 * A JPEG's size is in its frame's header (SOFn), and its resolution in its JFIF segment (APP0), in dots to the inch or
 * the centimeter, or in no unit, which gives no resolution
 */
const readJpeg = (data: Uint8Array): ImageSize | undefined => {
    const view = viewOf(data);
    let density: number | undefined;
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
        const length = view.getUint16(at + 2);
        if (marker === 0xe0 && length >= 16 && at + 2 + length <= data.length && ascii(data, at + 4, 5) === "JFIF\0") {
            const unit = data[at + 11];
            const perUnit = view.getUint16(at + 12);
            density = unit === 1 ? perUnit : unit === 2 ? perUnit * 2.54 : undefined;
        }
        if (isFrameStart(marker)) {
            return at + 9 <= data.length ? withDensity(view.getUint16(at + 7), view.getUint16(at + 5), density) : undefined;
        }
        at += 2 + length;
    }
    return undefined;
};

/** A GIF's size is in its header, little-endian, after its signature and version */
const readGif = (data: Uint8Array): ImageSize | undefined =>
    data.length < 10 ? undefined : { width: viewOf(data).getUint16(6, true), height: viewOf(data).getUint16(8, true) };

/**
 * A BMP's size is in its information header, little-endian, its height negative for one stored top down, and its
 * resolution in pixels to the metre, which may be zero for none
 */
const readBmp = (data: Uint8Array): ImageSize | undefined => {
    if (data.length < 46) {
        return undefined;
    }
    const view = viewOf(data);
    return withDensity(view.getUint32(18, true), Math.abs(view.getInt32(22, true)), view.getUint32(38, true) * METRES_PER_INCH);
};

/**
 * The size of an image in pixels, with its resolution when its file gives one, from its PNG, JPEG, GIF or BMP file, or
 * undefined for a file in another format, or one too short to say.
 */
export const imageSizeOf = (data: Uint8Array): ImageSize | undefined =>
    startsWith(data, PNG_SIGNATURE)
        ? readPng(data)
        : startsWith(data, JPEG_SIGNATURE)
          ? readJpeg(data)
          : data.length >= 6 && ["GIF87a", "GIF89a"].includes(ascii(data, 0, 6))
            ? readGif(data)
            : startsWith(data, BMP_SIGNATURE)
              ? readBmp(data)
              : undefined;
