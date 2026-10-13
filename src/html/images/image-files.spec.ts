// cspell:ignore IHDR IDAT IEND JFIF jfif EXIF ftyp avis heic miaf svgx recognises
import { describe, expect, it } from "vitest";

import { decodeDataUrl, readImageFile, toBytes } from "./image-files";

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
/** Text as UTF-8, as SVG files are written */
const utf8 = (text: string): Uint8Array => Uint8Array.from(new TextEncoder().encode(text));
const base64Of = (data: Uint8Array): string => btoa(String.fromCharCode(...data));

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** A PNG chunk, with a CRC of zeros, which the reader doesn't check */
const chunk = (type: string, data: readonly number[]): readonly number[] => [...uint32(data.length), ...bytes(type), ...data, 0, 0, 0, 0];
const png = (width: number, height: number): Uint8Array =>
    bytes(PNG_SIGNATURE, chunk("IHDR", [...uint32(width), ...uint32(height), 8, 2, 0, 0, 0]), chunk("IDAT", [0]), chunk("IEND", []));

/** A JPEG segment of a marker, with its length counted in */
const segment = (marker: number, data: readonly number[]): readonly number[] => [0xff, marker, ...uint16(data.length + 2), ...data];
const frame = (width: number, height: number, marker = 0xc0): readonly number[] =>
    segment(marker, [8, ...uint16(height), ...uint16(width), 3]);
const jfif = segment(0xe0, [...bytes("JFIF\0"), 1, 2, 1, ...uint16(72), ...uint16(72), 0, 0]);

const bmp = (width: number, height: number): Uint8Array =>
    bytes(
        "BM",
        littleUint32(54),
        [0, 0, 0, 0],
        littleUint32(54),
        littleUint32(40),
        littleUint32(width),
        littleUint32(height),
        littleUint16(1),
    );

/** An ISO media file's first box, `ftyp`, of its major brand and compatible ones */
const ftyp = (major: string, ...compatible: readonly string[]): Uint8Array =>
    bytes(uint32(16 + compatible.length * 4), "ftyp", major, uint32(0), ...compatible);

/** The size an SVG file is read as, from its text */
const svgSize = (text: string): readonly [number, number] | undefined => {
    const file = readImageFile(utf8(text));
    return file && [file.width!, file.height!];
};
/** The size an SVG file is read as, of a root element with these attributes */
const sizeOf = (attributes: string): readonly [number, number] | undefined =>
    svgSize(`<svg xmlns="http://www.w3.org/2000/svg" ${attributes}/>`);

describe("readImageFile", () => {
    describe("PNG, JPEG, GIF and BMP", () => {
        it("reads a PNG's size from its header, and recognises one cut short, or of no pixels, without a size", () => {
            expect(readImageFile(png(100, 50))).toEqual({ format: "png", width: 100, height: 50 });
            expect(readImageFile(bytes(PNG_SIGNATURE, uint32(13), "IHDR"))).toEqual({ format: "png" });
            expect(readImageFile(bytes(PNG_SIGNATURE))).toEqual({ format: "png" });
            // One whose first chunk isn't its header
            expect(readImageFile(bytes(PNG_SIGNATURE, chunk("tEXt", [...uint32(2), ...uint32(3), 8, 2, 0, 0, 0])))).toEqual({
                format: "png",
            });
            expect(readImageFile(png(0, 50))).toEqual({ format: "png" });
            expect(readImageFile(png(100, 0))).toEqual({ format: "png" });
        });

        it("reads a JPEG's size from its frame's header, after its JFIF segment, other segments and padding", () => {
            expect(readImageFile(bytes([0xff, 0xd8], jfif, frame(640, 480)))).toEqual({ format: "jpg", width: 640, height: 480 });
            // A progressive frame (SOF2), after an EXIF segment and padding
            expect(readImageFile(bytes([0xff, 0xd8], segment(0xe1, [1, 2, 3]), [0xff], frame(20, 10, 0xc2)))).toEqual({
                format: "jpg",
                width: 20,
                height: 10,
            });
            // A Huffman table (DHT), and the markers JPG and DAC, aren't frames
            expect(
                readImageFile(bytes([0xff, 0xd8], segment(0xc4, [0, 0]), segment(0xc8, []), segment(0xcc, [0, 0]), frame(4, 5))),
            ).toEqual({
                format: "jpg",
                width: 4,
                height: 5,
            });
            expect(readImageFile(bytes([0xff, 0xd8], frame(4, 5, 0xcf)))).toEqual({ format: "jpg", width: 4, height: 5 });
        });

        it("recognises a JPEG without a size when it is cut short, has no frame, or has a byte that isn't a marker", () => {
            expect(readImageFile(bytes([0xff, 0xd8], [0xff, 0xc0, 0, 11, 8, 0, 10]))).toEqual({ format: "jpg" });
            expect(readImageFile(bytes([0xff, 0xd8], segment(0xe1, [1, 2, 3]), [0xff, 0xd9]))).toEqual({ format: "jpg" });
            expect(readImageFile(bytes([0xff, 0xd8], jfif, [0x00, 0xc0, 0, 11, 8, 0, 10, 0, 10, 3]))).toEqual({ format: "jpg" });
            expect(readImageFile(bytes([0xff, 0xd8, 0xff]))).toEqual({ format: "jpg" });
            // Its signature is three bytes
            expect(readImageFile(bytes([0xff, 0xd8, 0x00, 0xc0]))).toBeUndefined();
        });

        it("reads a GIF's size from its header, of either version, and recognises one cut short without a size", () => {
            expect(readImageFile(bytes("GIF89a", littleUint16(300), littleUint16(200)))).toEqual({
                format: "gif",
                width: 300,
                height: 200,
            });
            expect(readImageFile(bytes("GIF87a", littleUint16(1), littleUint16(2)))).toEqual({ format: "gif", width: 1, height: 2 });
            expect(readImageFile(bytes("GIF87a", littleUint16(3)))).toEqual({ format: "gif" });
            expect(readImageFile(bytes("GIF88a", littleUint16(1), littleUint16(2)))).toBeUndefined();
        });

        it("reads a BMP's size from its information header, stored bottom up or top down, and recognises one cut short without a size", () => {
            expect(readImageFile(bmp(32, 16))).toEqual({ format: "bmp", width: 32, height: 16 });
            expect(readImageFile(bmp(32, -16))).toEqual({ format: "bmp", width: 32, height: 16 });
            expect(readImageFile(bytes("BM", littleUint32(54)))).toEqual({ format: "bmp" });
        });
    });

    describe("formats Word can't show", () => {
        it("recognises WebP, TIFF and ICO files by their signatures, without a size", () => {
            expect(readImageFile(bytes("RIFF", littleUint32(100), "WEBP", "VP8 "))).toEqual({ format: "webp" });
            expect(readImageFile(bytes("RIFF", littleUint32(100), "WAVE", "fmt "))).toBeUndefined();
            expect(readImageFile(bytes("II*\0", littleUint32(8)))).toEqual({ format: "tiff" });
            expect(readImageFile(bytes("MM\0*", uint32(8)))).toEqual({ format: "tiff" });
            expect(readImageFile(bytes([0, 0, 1, 0], littleUint16(1)))).toEqual({ format: "ico" });
            // A cursor isn't an icon
            expect(readImageFile(bytes([0, 0, 2, 0], littleUint16(1)))).toBeUndefined();
        });

        it("recognises an AVIF file by its major brand or a compatible one, among those its ftyp box has room for", () => {
            expect(readImageFile(ftyp("avif", "mif1", "miaf"))).toEqual({ format: "avif" });
            expect(readImageFile(ftyp("mif1", "miaf", "avif"))).toEqual({ format: "avif" });
            expect(readImageFile(ftyp("msf1", "avis"))).toEqual({ format: "avif" });
            // HEIC is another format in the same kind of file
            expect(readImageFile(ftyp("heic", "mif1", "heic"))).toBeUndefined();
            // Brands past the box's end, or past the file's, aren't read
            expect(readImageFile(bytes(uint32(20), "ftyp", "mif1", uint32(0), "miaf", "avif"))).toBeUndefined();
            expect(readImageFile(bytes(uint32(28), "ftyp", "mif1", uint32(0), "miaf", "av"))).toBeUndefined();
            // Nor is a file cut short before its major brand
            expect(readImageFile(bytes(uint32(16), "ftyp", "av"))).toBeUndefined();
        });

        it("recognises nothing in an empty file, or one in another format", () => {
            expect(readImageFile(new Uint8Array())).toBeUndefined();
            expect(readImageFile(bytes([0x01, 0x02, 0x03, 0x04, 0x05]))).toBeUndefined();
            expect(readImageFile(bytes("%PDF-1.7\n"))).toBeUndefined();
        });
    });

    describe("SVG", () => {
        it("recognises an SVG file by its root element, and reads its size from its width and height", () => {
            expect(readImageFile(utf8('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect/></svg>'))).toEqual({
                format: "svg",
                width: 200,
                height: 100,
            });
            expect(sizeOf('height="20" width="40" viewBox="0 0 1 1"')).toEqual([40, 20]);
        });

        it("reads lengths in pixels, with no unit or in any of CSS's absolute units, or in ems and exes of a 16 pixel font", () => {
            const widthOf = (width: string): number => sizeOf(`width="${width}" height="1"`)![0];
            expect(widthOf("10")).toBe(10);
            expect(widthOf("10px")).toBe(10);
            expect(widthOf("12pt")).toBeCloseTo(16);
            expect(widthOf("2pc")).toBe(32);
            expect(widthOf("1in")).toBe(96);
            expect(widthOf("2.54cm")).toBeCloseTo(96);
            expect(widthOf("25.4mm")).toBeCloseTo(96);
            expect(widthOf("101.6Q")).toBeCloseTo(96);
            expect(widthOf("2em")).toBe(32);
            expect(widthOf("2ex")).toBe(16);
            // Units in any case, fractions, signs, exponents, and whitespace around them
            expect(widthOf("1IN")).toBe(96);
            expect(widthOf(".5in")).toBe(48);
            expect(widthOf("1.in")).toBe(96);
            expect(widthOf("+10")).toBe(10);
            expect(widthOf("1e2")).toBe(100);
            expect(widthOf("1E-1em")).toBeCloseTo(1.6);
            expect(widthOf(" 10px\n")).toBe(10);
        });

        it("reads a percentage, auto, a length of no pixels, or one that isn't a length, as no size", () => {
            for (const width of ["50%", "auto", "0", "-10", "10 px", "10vw", "px", "1e999", "", "1..5"]) {
                expect(sizeOf(`width="${width}" height="100"`)).toEqual([300, 100]);
            }
        });

        it("works out a missing width or height from the viewBox's proportions", () => {
            expect(sizeOf('width="200" viewBox="0 0 100 50"')).toEqual([200, 100]);
            expect(sizeOf('height="100" viewBox="0 0 100 50"')).toEqual([200, 100]);
            expect(sizeOf('width="50%" height="1in" viewBox="0 0 2 1"')).toEqual([192, 96]);
        });

        it("reads the viewBox's size when there is neither a width nor a height, its numbers apart by whitespace or commas", () => {
            expect(sizeOf('viewBox="0 0 100 50"')).toEqual([100, 50]);
            expect(sizeOf('viewBox="-10,-20,24.5,1e1"')).toEqual([24.5, 10]);
            expect(sizeOf('viewBox=" 0, 0\n\t640 , 480 "')).toEqual([640, 480]);
        });

        it("leaves out a viewBox that isn't four numbers, or that has no width or height", () => {
            for (const viewBox of ["0 0 100", "0 0 100 50 1", "0 0 a 50", "0 0 0 50", "0 0 100 -50", "0 0 1e999 50", ""]) {
                expect(sizeOf(`viewBox="${viewBox}"`)).toEqual([300, 150]);
                expect(sizeOf(`width="40" viewBox="${viewBox}"`)).toEqual([40, 150]);
            }
        });

        it("gives an SVG with a width or a height but no viewBox, or with neither, a browser's default size for the other: 300 by 150", () => {
            expect(sizeOf('width="40"')).toEqual([40, 150]);
            expect(sizeOf('height="40"')).toEqual([300, 40]);
            expect(sizeOf("")).toEqual([300, 150]);
            expect(svgSize("<svg/>")).toEqual([300, 150]);
            expect(svgSize("<svg>")).toEqual([300, 150]);
            expect(svgSize("<svg\n>")).toEqual([300, 150]);
        });

        it("reads attributes in single or double quotes, in any order, apart by whitespace and newlines, around their equals signs too", () => {
            expect(svgSize("<svg\n\twidth='30'\n\theight = \"20\"\n>")).toEqual([30, 20]);
            expect(svgSize("<svg viewBox='0 0 4 3' width\n=\n'8' xmlns='http://www.w3.org/2000/svg'/>")).toEqual([8, 6]);
        });

        it("reads only the root's own attributes: not those in another attribute's value, nor a child's", () => {
            expect(svgSize(`<svg style="width: 10px; height: 10px" data-size="width='5' height='5'" viewBox="0 0 20 10"/>`)).toEqual([
                20, 10,
            ]);
            expect(svgSize('<svg data-tag="<svg width=\'5\'>" height="10">')).toEqual([300, 10]);
            expect(svgSize('<svg viewBox="0 0 10 10"><rect width="5" height="5"/></svg>')).toEqual([10, 10]);
            // An attribute that runs into the one before it isn't read
            expect(svgSize('<svg width="10"height="10">')).toEqual([10, 150]);
            // Nor is one of no value
            expect(svgSize('<svg height width="10">')).toEqual([10, 150]);
        });

        it("reads an SVG's root in SVG's namespace by a prefix", () => {
            expect(svgSize('<svg:svg xmlns:svg="http://www.w3.org/2000/svg" width="4" height="3"/>')).toEqual([4, 3]);
            expect(svgSize('<my-svg.1:svg width="4" height="3"/>')).toEqual([4, 3]);
        });

        it("finds the root after a byte order mark, whitespace, an XML declaration, comments, processing instructions and a doctype", () => {
            const prolog = [
                "﻿",
                '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\r\n',
                "<!-- Created with an editor; <svg width='1'> isn't the root -->\n",
                '<?xml-stylesheet href="style.css" type="text/css"?>',
                '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [\n',
                '\t<!ENTITY ns_svg "http://www.w3.org/2000/svg">\n',
                "]>\n",
                "<!--é-->  \n\t",
            ].join("");
            expect(readImageFile(utf8(`${prolog}<svg width="12" height="34"/>`))).toEqual({ format: "svg", width: 12, height: 34 });
            expect(svgSize('<!DOCTYPE svg><svg width="5" height="6"/>')).toEqual([5, 6]);
        });

        it("recognises no SVG in text whose root is another element, or that has other text before its root", () => {
            expect(svgSize('<!DOCTYPE html><html><body><svg width="10" height="10"></svg></body></html>')).toBeUndefined();
            expect(svgSize('<svgx width="10"/>')).toBeUndefined();
            expect(svgSize('<SVG width="10"/>')).toBeUndefined();
            expect(svgSize('<1:svg width="10"/>')).toBeUndefined();
            expect(svgSize("<svg")).toBeUndefined();
            expect(svgSize("an image: <svg/>")).toBeUndefined();
            expect(svgSize("<!-- not closed <svg/>")).toBeUndefined();
            expect(svgSize('<?xml version="1.0"? <svg/>')).toBeUndefined();
            expect(svgSize("<!DOCTYPE svg [ <svg/>")).toBeUndefined();
            expect(svgSize("")).toBeUndefined();
        });

        it("looks for the root in the file's first 8 kilobytes only", () => {
            expect(svgSize(`<!--${"x".repeat(8000)}--><svg width="1" height="2"/>`)).toEqual([1, 2]);
            expect(svgSize(`<!--${"x".repeat(8200)}--><svg width="1" height="2"/>`)).toBeUndefined();
        });

        it("reads the attributes of a start tag cut off at the end of what it looks at, up to where it is cut", () => {
            // Cut in the viewBox's value, which isn't read
            const padding = " ".repeat(8192 - '<svg width="7" viewBox="0 0 10'.length);
            expect(svgSize(`${padding}<svg width="7" viewBox="0 0 100 50"/>`)).toEqual([7, 150]);
            expect(svgSize(`<svg width="7" viewBox="0 0 100 50"/>`)).toEqual([7, 3.5]);
        });
    });
});

describe("decodeDataUrl", () => {
    const image = png(1, 1);

    it("decodes base64 data, with its media type", () => {
        expect(decodeDataUrl(`data:image/png;base64,${base64Of(image)}`)).toEqual({ mediaType: "image/png", data: image });
        expect(decodeDataUrl("data:image/png;base64,")).toEqual({ mediaType: "image/png", data: new Uint8Array() });
    });

    it("reads the scheme, the media type and the base64 flag in any case, and lower-cases the media type", () => {
        expect(decodeDataUrl(`DATA:Image/PNG;BASE64,${base64Of(image)}`)).toEqual({ mediaType: "image/png", data: image });
        expect(decodeDataUrl(`Data:image/png;Base64,${base64Of(image)}`)?.data).toEqual(image);
    });

    it("leaves out the media type's parameters, and whitespace around it and before the base64 flag", () => {
        expect(decodeDataUrl(`data:image/svg+xml;charset=utf-8;base64,${base64Of(utf8("<svg/>"))}`)).toEqual({
            mediaType: "image/svg+xml",
            data: utf8("<svg/>"),
        });
        expect(decodeDataUrl("data: image/gif ;name=a.gif; base64,R0lGODlh")).toEqual({ mediaType: "image/gif", data: bytes("GIF89a") });
    });

    it("reads data with no media type, or one that isn't a type and a subtype, as text/plain, as the spec says", () => {
        expect(decodeDataUrl("data:,hello")).toEqual({ mediaType: "text/plain", data: utf8("hello") });
        expect(decodeDataUrl("data:;charset=utf-8,hello")).toEqual({ mediaType: "text/plain", data: utf8("hello") });
        expect(decodeDataUrl("data:;base64,aGk=")).toEqual({ mediaType: "text/plain", data: utf8("hi") });
        expect(decodeDataUrl("data:image,hello")?.mediaType).toBe("text/plain");
        expect(decodeDataUrl("data:image/png/x,hello")?.mediaType).toBe("text/plain");
        expect(decodeDataUrl("data:image/sv g,hello")?.mediaType).toBe("text/plain");
    });

    it("decodes text that isn't base64 as UTF-8, with its percent escapes decoded", () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"></svg>';
        expect(decodeDataUrl(`data:image/svg+xml;utf8,${svg}`)).toEqual({ mediaType: "image/svg+xml", data: utf8(svg) });
        expect(decodeDataUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`)?.data).toEqual(utf8(svg));
        expect(readImageFile(decodeDataUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`)!.data)).toEqual({
            format: "svg",
            width: 10,
            height: 20,
        });
        // In either case, and among characters that aren't ASCII, each escape a byte of UTF-8
        expect(decodeDataUrl("data:,%3csvg%3E")?.data).toEqual(utf8("<svg>"));
        expect(decodeDataUrl("data:,é %C3%A9%e2%82%ac")?.data).toEqual(utf8("é é€"));
        // A plus sign is itself, not a space
        expect(decodeDataUrl("data:,a+b")?.data).toEqual(utf8("a+b"));
    });

    it("leaves a percent sign that doesn't start an escape as it is", () => {
        expect(decodeDataUrl("data:,100%")?.data).toEqual(utf8("100%"));
        expect(decodeDataUrl("data:,%zz%4%%41")?.data).toEqual(utf8("%zz%4%A"));
    });

    it("keeps a # in text, as SVG written into data URLs often has unescaped colours, and tabs and newlines too", () => {
        const svg = '<svg width="1"\n\theight="1"><rect fill="#ff0000"/></svg>';
        expect(decodeDataUrl(`data:image/svg+xml,${svg}`)?.data).toEqual(utf8(svg));
    });

    it("leaves out whitespace around the URL, but keeps it at the start of text", () => {
        expect(decodeDataUrl(`  \n data:image/png;base64,${base64Of(image)} \n`)?.data).toEqual(image);
        expect(decodeDataUrl("data:, hello ")?.data).toEqual(utf8(" hello"));
    });

    it("decodes base64 with whitespace inside, without padding, in the URL's alphabet, or with escaped characters", () => {
        const data = bytes([0xfb, 0xff, 0xbf, 0x00, 0x01]);
        expect(decodeDataUrl("data:;base64,+/+/AAE=")?.data).toEqual(data);
        expect(decodeDataUrl("data:;base64,+/+/\n AA\tE\r\n")?.data).toEqual(data);
        expect(decodeDataUrl("data:;base64,-_-_AAE")?.data).toEqual(data);
        expect(decodeDataUrl("data:;base64,%2B/%2b/AAE%3D")?.data).toEqual(data);
        expect(decodeDataUrl("data:;base64,YWI=")?.data).toEqual(utf8("ab"));
        expect(decodeDataUrl("data:;base64,YQ==")?.data).toEqual(utf8("a"));
        expect(decodeDataUrl("data:;base64,YQ")?.data).toEqual(utf8("a"));
    });

    it("reads no data URL whose base64 is invalid", () => {
        for (const base64 of ["!!!!", "YQ===", "YQ==YQ==", "Y", "YWJjZ", "YW Jj Z", "YQ=%3D=", "aGk=#top", "é"]) {
            expect(decodeDataUrl(`data:image/png;base64,${base64}`)).toBeUndefined();
        }
    });

    it("reads the base64 flag only as the header's last parameter", () => {
        expect(decodeDataUrl("data:text/plain;base64;charset=utf-8,aGk=")).toEqual({ mediaType: "text/plain", data: utf8("aGk=") });
        expect(decodeDataUrl("data:text/plain;xbase64,aGk=")?.data).toEqual(utf8("aGk="));
    });

    it("reads nothing that isn't a data URL, or that has no comma", () => {
        expect(decodeDataUrl("data:image/png;base64")).toBeUndefined();
        expect(decodeDataUrl("data:")).toBeUndefined();
        expect(decodeDataUrl("https://example.com/image.png,1")).toBeUndefined();
        expect(decodeDataUrl("image/png;base64,aGk=")).toBeUndefined();
        expect(decodeDataUrl("x-data:,hello")).toBeUndefined();
        expect(decodeDataUrl("")).toBeUndefined();
    });
});

describe("toBytes", () => {
    const image = png(1, 1);

    it("gives a Uint8Array, or a Node Buffer, as it is", () => {
        expect(toBytes(image)).toBe(image);
        const buffer = Buffer.from(image);
        expect(toBytes(buffer)).toBe(buffer);
    });

    it("views an ArrayBuffer as bytes, without copying it", () => {
        const { buffer } = image.slice();
        const read = toBytes(buffer)!;
        expect(read).toEqual(image);
        expect(read.buffer).toBe(buffer);
    });

    it("decodes a string that is a data URL", () => {
        expect(toBytes(`data:image/png;base64,${base64Of(image)}`)).toEqual(image);
        expect(toBytes(' DATA:image/svg+xml,<svg width="1"/>')).toEqual(utf8('<svg width="1"/>'));
        expect(toBytes("data:image/png;base64,!!!!")).toBeUndefined();
        expect(toBytes("data:image/png;base64")).toBeUndefined();
    });

    it("decodes any other string as base64, with whitespace inside or around it", () => {
        expect(toBytes(base64Of(image))).toEqual(image);
        const wrapped = base64Of(image).replace(/.{8}/g, "$&\n");
        expect(toBytes(`\n${wrapped}  `)).toEqual(image);
        expect(toBytes("YQ")).toEqual(utf8("a"));
        expect(toBytes("-_-_")).toEqual(bytes([0xfb, 0xff, 0xbf]));
        expect(toBytes("")).toEqual(new Uint8Array());
    });

    it("gives nothing for a string that is neither a data URL nor base64", () => {
        expect(toBytes("not base64!")).toBeUndefined();
        expect(toBytes("https://example.com/image.png")).toBeUndefined();
        expect(toBytes("image.png")).toBeUndefined();
    });
});
