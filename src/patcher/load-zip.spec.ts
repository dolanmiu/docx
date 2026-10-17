import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import type { InputDataType } from "./from-docx";
import { loadZip } from "./load-zip";

const zipBytes = (): Promise<Uint8Array> => {
    const zip = new JSZip();
    zip.file("word/document.xml", "<w:document/>");
    return zip.generateAsync({ type: "uint8array" });
};

/** A stream that gives its chunks one at a time, as a Node.js `Readable` does when read with `for await` */
const streamOf = (...chunks: readonly unknown[]): InputDataType =>
    (async function* () {
        yield* chunks;
    })() as unknown as InputDataType;

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

        expect(await documentXmlOf(streamOf(bytes.subarray(0, 10), bytes.subarray(10, 50), bytes.subarray(50)))).toBe("<w:document/>");
    });

    it("opens a zip file from a stream that gives each byte as a number, as Readable.from of a Uint8Array does", async () => {
        expect(await documentXmlOf(streamOf(...(await zipBytes())))).toBe("<w:document/>");
    });

    it("rejects a stream that gives text, naming what it gave", async () => {
        await expect(loadZip(streamOf("PK"))).rejects.toThrow("A template stream must give bytes, but it gave a string");
    });
});
