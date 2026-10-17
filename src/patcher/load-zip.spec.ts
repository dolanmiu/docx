import JSZip from "jszip";
import { Readable, Stream } from "stream";
import { describe, expect, it } from "vitest";

import { Document, Packer, Paragraph } from "../index";
import type { InputDataType } from "./from-docx";
import { loadZip } from "./load-zip";

const zipBytes = (): Promise<Uint8Array> => {
    const zip = new JSZip();
    zip.file("word/document.xml", "<w:document/>");
    return zip.generateAsync({ type: "uint8array" });
};

const documentXmlOf = async (data: InputDataType): Promise<string | undefined> =>
    (await loadZip(data)).file("word/document.xml")?.async("string");

describe("loadZip", () => {
    it("returns a JSZip instance as it is", async () => {
        const zip = new JSZip();

        expect(await loadZip(zip)).toBe(zip);
    });

    it("opens a zip file from its bytes", async () => {
        expect(await documentXmlOf(await zipBytes())).toBe("<w:document/>");
    });

    it("opens a zip file from a stream that gives its bytes in chunks", async () => {
        const bytes = await zipBytes();
        const stream = Readable.from([bytes.subarray(0, 10), bytes.subarray(10, 50), bytes.subarray(50)]);

        expect(await documentXmlOf(stream)).toBe("<w:document/>");
    });

    it("opens a zip file from a stream that gives each byte as a number, as Readable.from of a Uint8Array does", async () => {
        expect(await documentXmlOf(Readable.from(await zipBytes()))).toBe("<w:document/>");
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
        const zip = loadZip(stream);
        stream.emit("error", new Error("The file could not be read"));

        await expect(zip).rejects.toThrow("The file could not be read");
    });
});
