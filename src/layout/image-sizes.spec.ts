// cspell:ignore IHDR IDAT IEND JFIF jfif
import { describe, expect, it } from "vitest";

import { imageSizeOf } from "./image-sizes";

const bytes = (...parts: readonly (readonly number[] | string)[]): Uint8Array =>
    new Uint8Array(parts.flatMap((part) => (typeof part === "string" ? [...part].map((char) => char.charCodeAt(0)) : part)));
/** The bytes of a number, big-endian unless `little`, in a width of bytes */
const numberBytes = (value: number, width: 2 | 4, little = false): readonly number[] => {
    const data = new Uint8Array(width);
    const view = new DataView(data.buffer);
    if (width === 4) {
        view.setInt32(0, value, little);
    } else {
        view.setUint16(0, value, little);
    }
    return [...data];
};
const uint32 = (value: number): readonly number[] => numberBytes(value, 4);
const uint16 = (value: number): readonly number[] => numberBytes(value, 2);
const littleUint32 = (value: number): readonly number[] => numberBytes(value, 4, true);
const littleUint16 = (value: number): readonly number[] => numberBytes(value, 2, true);

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** A PNG chunk, with a CRC of zeros, which the reader doesn't check */
const chunk = (type: string, data: readonly number[]): readonly number[] => [...uint32(data.length), ...bytes(type), ...data, 0, 0, 0, 0];
const png = (width: number, height: number, ...chunks: readonly (readonly number[])[]): Uint8Array =>
    bytes(
        PNG_SIGNATURE,
        chunk("IHDR", [...uint32(width), ...uint32(height), 8, 2, 0, 0, 0]),
        ...chunks,
        chunk("IDAT", [0]),
        chunk("IEND", []),
    );

/** A JPEG segment of a marker, with its length counted in */
const segment = (marker: number, data: readonly number[]): readonly number[] => [0xff, marker, ...uint16(data.length + 2), ...data];
const frame = (width: number, height: number, marker = 0xc0): readonly number[] =>
    segment(marker, [8, ...uint16(height), ...uint16(width), 3]);
const jfif = (unit: number, density: number): readonly number[] =>
    segment(0xe0, [...bytes("JFIF\0"), 1, 2, unit, ...uint16(density), ...uint16(density), 0, 0]);

const bmp = (width: number, height: number, perMetre = 0): Uint8Array =>
    bytes(
        "BM",
        littleUint32(54),
        [0, 0, 0, 0],
        littleUint32(54),
        littleUint32(40),
        littleUint32(width),
        littleUint32(height),
        littleUint16(1),
        littleUint16(24),
        littleUint32(0),
        littleUint32(0),
        littleUint32(perMetre),
        littleUint32(perMetre),
        littleUint32(0),
        littleUint32(0),
    );

describe("imageSizeOf", () => {
    it("should read a PNG's size from its header, and its resolution from its pHYs chunk when it is in pixels to the metre", () => {
        expect(imageSizeOf(png(100, 50))).to.deep.equal({ width: 100, height: 50 });
        // 3780 pixels to the metre is 96.012 to the inch
        const physical = (perMetre: number, unit: number): readonly number[] =>
            chunk("pHYs", [...uint32(perMetre), ...uint32(perMetre), unit]);
        const read = imageSizeOf(png(1, 1, physical(3780, 1)))!;
        expect([read.width, read.height, Math.round(read.density! * 1000) / 1000]).to.deep.equal([1, 1, 96.012]);
        // In no unit, it gives no resolution, nor does a pHYs chunk of another length, nor one of no pixels
        expect(imageSizeOf(png(1, 1, physical(3780, 0)))).to.deep.equal({ width: 1, height: 1 });
        expect(imageSizeOf(png(1, 1, chunk("pHYs", [0, 0, 0, 1])))).to.deep.equal({ width: 1, height: 1 });
        expect(imageSizeOf(png(1, 1, physical(0, 1)))).to.deep.equal({ width: 1, height: 1 });
        // A pHYs chunk cut short, and one after the image's data, aren't read
        expect(
            imageSizeOf(bytes(PNG_SIGNATURE, chunk("IHDR", [...uint32(2), ...uint32(3), 8, 2, 0, 0, 0]), uint32(9), "pHYs", [0, 0])),
        ).to.deep.equal({
            width: 2,
            height: 3,
        });
        expect(
            imageSizeOf(
                bytes(PNG_SIGNATURE, chunk("IHDR", [...uint32(2), ...uint32(3), 8, 2, 0, 0, 0]), chunk("IDAT", []), physical(3780, 1)),
            ),
        ).to.deep.equal({ width: 2, height: 3 });
        // One cut short, or whose first chunk isn't its header, has no size
        expect(imageSizeOf(bytes(PNG_SIGNATURE, uint32(13), "IHDR"))).to.equal(undefined);
        expect(imageSizeOf(bytes(PNG_SIGNATURE, chunk("tEXt", [...uint32(2), ...uint32(3), 8, 2, 0, 0, 0])))).to.equal(undefined);
    });

    it("should read a JPEG's size from its frame's header, and its resolution from its JFIF segment, in dots to the inch or the centimeter", () => {
        expect(imageSizeOf(bytes([0xff, 0xd8], frame(640, 480)))).to.deep.equal({ width: 640, height: 480 });
        // A progressive frame (SOF2), after other segments, and past padding
        expect(imageSizeOf(bytes([0xff, 0xd8], segment(0xe1, [1, 2, 3]), [0xff], frame(20, 10, 0xc2)))).to.deep.equal({
            width: 20,
            height: 10,
        });
        // A Huffman table (DHT) isn't a frame
        expect(imageSizeOf(bytes([0xff, 0xd8], segment(0xc4, [0, 0]), frame(4, 5)))).to.deep.equal({ width: 4, height: 5 });
        expect(imageSizeOf(bytes([0xff, 0xd8], jfif(1, 300), frame(10, 10)))).to.deep.equal({ width: 10, height: 10, density: 300 });
        expect(imageSizeOf(bytes([0xff, 0xd8], jfif(2, 100), frame(10, 10)))).to.deep.equal({ width: 10, height: 10, density: 254 });
        expect(imageSizeOf(bytes([0xff, 0xd8], jfif(0, 1), frame(10, 10)))).to.deep.equal({ width: 10, height: 10 });
        // A frame cut short, no frame, and a byte that isn't a marker, have no size
        expect(imageSizeOf(bytes([0xff, 0xd8], [0xff, 0xc0, 0, 11, 8, 0, 10]))).to.equal(undefined);
        expect(imageSizeOf(bytes([0xff, 0xd8], segment(0xe1, [1, 2, 3]), [0xff, 0xd9]))).to.equal(undefined);
        expect(imageSizeOf(bytes([0xff, 0xd8], [0x00, 0xc0, 0, 11, 8, 0, 10, 0, 10, 3]))).to.equal(undefined);
    });

    it("should read a GIF's size from its header, and a BMP's from its information header, with its height up or down, and its resolution", () => {
        expect(imageSizeOf(bytes("GIF89a", littleUint16(300), littleUint16(200)))).to.deep.equal({ width: 300, height: 200 });
        expect(imageSizeOf(bytes("GIF87a", littleUint16(3)))).to.equal(undefined);
        expect(imageSizeOf(bmp(32, 16))).to.deep.equal({ width: 32, height: 16 });
        // 2835 pixels to the metre is 72.009 to the inch
        const read = imageSizeOf(bmp(32, -16, 2835))!;
        expect([read.width, read.height, Math.round(read.density! * 1000) / 1000]).to.deep.equal([32, 16, 72.009]);
        expect(imageSizeOf(bytes("BM", littleUint32(54)))).to.equal(undefined);
    });

    it("should read no size from a file in another format, or an empty one", () => {
        expect(imageSizeOf(bytes("<svg/>"))).to.equal(undefined);
        expect(imageSizeOf(bytes([0x01, 0x00, 0x00, 0x00]))).to.equal(undefined);
        expect(imageSizeOf(new Uint8Array())).to.equal(undefined);
    });
});
