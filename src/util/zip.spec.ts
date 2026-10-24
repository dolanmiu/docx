import { afterEach, describe, expect, it, vi } from "vitest";

// cspell:words unstub

import type { OutputType } from "./output-type";
import { unzipFiles, zipFiles, zipOutput } from "./zip";
import { damaging, declaringSize } from "../tests/zip";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Bytes in the middle of a larger buffer, as a Buffer from Node's pool is
const bytesInLargerBuffer = (bytes: readonly number[]): Uint8Array => {
    const buffer = new Uint8Array(bytes.length + 8);
    buffer.set(bytes, 4);
    return buffer.subarray(4, 4 + bytes.length);
};

describe("zip", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("#zipFiles() and #unzipFiles()", () => {
        it("should zip text as UTF-8, and bytes given in any form, in the order given", () => {
            const files = unzipFiles(
                zipFiles([
                    ["[Content_Types].xml", "<Types/>"],
                    ["word/document.xml", "<w:t>Café 😀</w:t>"],
                    ["word/media/a.png", Uint8Array.of(1, 2)],
                    ["word/media/b.png", Uint8Array.of(3, 4).buffer],
                    ["word/media/c.png", bytesInLargerBuffer([5, 6])],
                ]),
            );

            expect([...files.keys()]).toEqual([
                "[Content_Types].xml",
                "word/document.xml",
                "word/media/a.png",
                "word/media/b.png",
                "word/media/c.png",
            ]);
            expect(new TextDecoder().decode(files.get("word/document.xml"))).toBe("<w:t>Café 😀</w:t>");
            expect(files.get("word/media/a.png")).toEqual(Uint8Array.of(1, 2));
            expect(files.get("word/media/b.png")).toEqual(Uint8Array.of(3, 4));
            expect(files.get("word/media/c.png")).toEqual(Uint8Array.of(5, 6));
        });

        it("should keep the first place of a path given twice, with its last data, so a file can be replaced", () => {
            const files = unzipFiles(
                zipFiles([
                    ["a.xml", "<old/>"],
                    ["b.xml", "<b/>"],
                    ["a.xml", "<new/>"],
                ]),
            );

            expect([...files.keys()]).toEqual(["a.xml", "b.xml"]);
            expect(new TextDecoder().decode(files.get("a.xml"))).toBe("<new/>");
        });

        it("should leave out a zip file's folders", () => {
            expect([
                ...unzipFiles(
                    zipFiles([
                        ["word/", new Uint8Array()],
                        ["word/document.xml", "<w:document/>"],
                    ]),
                ).keys(),
            ]).toEqual(["word/document.xml"]);
        });

        it("should leave out the files include leaves out, without inflating them", () => {
            const zip = damaging(
                zipFiles([
                    ["word/document.xml", "<w:document/>"],
                    ["word/media/image1.png", new Uint8Array(1000).fill(7)],
                ]),
                "word/media/image1.png",
            );

            expect(() => unzipFiles(zip)).toThrow();
            expect([...unzipFiles(zip, (path) => path.endsWith(".xml")).keys()]).toEqual(["word/document.xml"]);
        });

        it("should refuse a file the zip file gives a size larger than its data, as JSZip did", () => {
            const zip = zipFiles([["word/document.xml", "<w:document/>"]]);

            expect(() => unzipFiles(declaringSize(zip, "word/document.xml", 100))).toThrow(
                "Corrupted zip: word/document.xml isn't the size the zip file gives it",
            );
        });

        it("should refuse a file the zip file gives a size more than DEFLATE can give its data", () => {
            const zip = declaringSize(zipFiles([["word/document.xml", "<w:document/>"]]), "word/document.xml", 0xf0000000);

            expect(() => unzipFiles(zip)).toThrow("Corrupted zip: word/document.xml isn't the size the zip file gives it");
        });
    });

    describe("#zipOutput()", () => {
        const data = bytesInLargerBuffer([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff]);

        it("should give the bytes as they are", () => {
            expect(zipOutput(data, "uint8array", DOCX)).toBe(data);
        });

        it("should give an ArrayBuffer of only the bytes, not the buffer they are in", () => {
            const buffer = zipOutput(data, "arraybuffer", DOCX);

            expect(buffer).toBeInstanceOf(ArrayBuffer);
            expect(new Uint8Array(buffer)).toEqual(Uint8Array.of(0x50, 0x4b, 0x03, 0x04, 0x00, 0xff));
        });

        it("should give an array of the bytes", () => {
            expect(zipOutput(data, "array", DOCX)).toEqual([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff]);
        });

        it("should give a string with a character for each byte as a string or a binary string, as JSZip did", () => {
            expect(zipOutput(data, "string", DOCX)).toBe("PK\u0003\u0004\u0000ÿ");
            expect(zipOutput(data, "binarystring", DOCX)).toBe("PK\u0003\u0004\u0000ÿ");
        });

        it("should give every byte of a zip file larger than a function's arguments can hold in a string", () => {
            const large = Uint8Array.from({ length: 100000 }, (_, index) => index % 251);
            const text = zipOutput(large, "binarystring", DOCX);

            expect(text).toHaveLength(100000);
            expect(Uint8Array.from({ length: text.length }, (_, index) => text.charCodeAt(index))).toEqual(large);
        });

        it("should give the bytes in base64", () => {
            expect(zipOutput(data, "base64", DOCX)).toBe(Buffer.from(Uint8Array.of(0x50, 0x4b, 0x03, 0x04, 0x00, 0xff)).toString("base64"));
        });

        it("should give a Blob of the type it's given", async () => {
            const blob = zipOutput(data, "blob", DOCX);

            expect(blob.type).toBe(DOCX);
            expect(new Uint8Array(await blob.arrayBuffer())).toEqual(Uint8Array.of(0x50, 0x4b, 0x03, 0x04, 0x00, 0xff));
        });

        it("should give a Buffer of the bytes", () => {
            const buffer = zipOutput(data, "nodebuffer", DOCX);

            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect([...buffer]).toEqual([0x50, 0x4b, 0x03, 0x04, 0x00, 0xff]);
        });

        it("should read the type whatever its case, as JSZip did", () => {
            expect(zipOutput(data, "Base64" as OutputType, DOCX)).toBe(zipOutput(data, "base64", DOCX));
        });

        it("should throw for text, which JSZip never gave either, and for a type it doesn't know", () => {
            expect(() => zipOutput(data, "text", DOCX)).toThrow("text is not supported by this platform");
            expect(() => zipOutput(data, "toString" as OutputType, DOCX)).toThrow("toString is not supported by this platform");
        });

        it("should throw for a Blob where there's no Blob, and a Buffer where there's no Buffer, such as in a browser", () => {
            vi.stubGlobal("Blob", undefined);
            vi.stubGlobal("Buffer", undefined);

            expect(() => zipOutput(data, "blob", DOCX)).toThrow("blob is not supported by this platform");
            expect(() => zipOutput(data, "nodebuffer", DOCX)).toThrow("nodebuffer is not supported by this platform");
        });
    });
});
