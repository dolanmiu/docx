/* eslint-disable @typescript-eslint/naming-convention -- The keys of objects here are paths of parts in a package */
import { Readable, Stream } from "stream";
import { describe, expect, it, vi } from "vitest";

import { Document, Packer, Paragraph } from "../index";
import type { InputDataType } from "./from-docx";
import { loadZip } from "./load-zip";
import { textOf, zip } from "../tests/zip";

const zipBytes = (): Uint8Array => zip({ "word/document.xml": "<w:document/>" });

const documentXmlOf = async (data: InputDataType): Promise<string | undefined> => textOf(await loadZip(data), "word/document.xml");

describe("loadZip", () => {
    it("reads a zip file opened with JSZip through its generateAsync", async () => {
        const generateAsync = vi.fn(() => Promise.resolve(zipBytes()));

        expect(await documentXmlOf({ generateAsync })).toBe("<w:document/>");
        expect(generateAsync).toHaveBeenCalledWith({ type: "uint8array" });
    });

    it("opens a zip file from its bytes, as a Uint8Array, a Buffer, a part of a larger buffer or an ArrayBuffer", async () => {
        const bytes = zipBytes();
        const larger = new Uint8Array(bytes.length + 20);
        larger.set(bytes, 10);

        expect(await documentXmlOf(bytes)).toBe("<w:document/>");
        expect(await documentXmlOf(Buffer.from(bytes))).toBe("<w:document/>");
        expect(await documentXmlOf(larger.subarray(10, 10 + bytes.length))).toBe("<w:document/>");
        expect(await documentXmlOf(bytes.slice().buffer)).toBe("<w:document/>");
    });

    it("opens a zip file from an array of its bytes", async () => {
        expect(await documentXmlOf(Array.from(zipBytes()))).toBe("<w:document/>");
    });

    it("opens a zip file from a string with a character for each byte, as JSZip did", async () => {
        expect(await documentXmlOf(String.fromCharCode(...zipBytes()))).toBe("<w:document/>");
    });

    it("opens a zip file from a Blob", async () => {
        expect(await documentXmlOf(new Blob([zipBytes() as Uint8Array<ArrayBuffer>]))).toBe("<w:document/>");
    });

    it("leaves out the zip file's folders", async () => {
        const files = await loadZip(zip({ "word/": new Uint8Array(), "word/document.xml": "<w:document/>" }));

        expect([...files.keys()]).toEqual(["word/document.xml"]);
    });

    it("opens a zip file from a stream that gives its bytes in chunks", async () => {
        const bytes = zipBytes();
        const stream = Readable.from([bytes.subarray(0, 10), bytes.subarray(10, 50), bytes.subarray(50)]);

        expect(await documentXmlOf(stream)).toBe("<w:document/>");
    });

    it("opens a zip file from a stream that gives each byte as a number, as Readable.from of a Uint8Array does", async () => {
        expect(await documentXmlOf(Readable.from(zipBytes()))).toBe("<w:document/>");
    });

    it("opens a zip file from a stream with no iterator, such as Packer.toStream's", async () => {
        const stream = Packer.toStream(new Document({ sections: [{ children: [new Paragraph("Hello")] }] }));

        expect(Symbol.asyncIterator in stream).toBe(false);
        expect(await documentXmlOf(stream)).toContain("Hello");
    });

    it("rejects a stream that gives text, naming what it gave", async () => {
        await expect(loadZip(Readable.from(["PK"]))).rejects.toThrow("A template stream must give bytes, but it gave a string");
    });

    it("rejects with a stream's error", async () => {
        const stream = new Stream();
        const files = loadZip(stream);
        stream.emit("error", new Error("The file could not be read"));

        await expect(files).rejects.toThrow("The file could not be read");
    });
});
