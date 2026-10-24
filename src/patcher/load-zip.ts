import type { Stream } from "stream";

import { unzipFiles } from "@util/zip";

import type { InputDataType } from "./from-docx";

type TemplateStream = NodeJS.ReadableStream | Stream;

/** A zip file opened with JSZip, or anything else that gives its bytes the same way. It's read, and left as it was. */
export type ZipArchive = {
    readonly generateAsync: (options: { readonly type: "uint8array" }) => Promise<Uint8Array>;
};

const isStream = (data: InputDataType): data is TemplateStream =>
    typeof data === "object" && data !== null && "on" in data && typeof data.on === "function";

const isZipArchive = (data: InputDataType): data is ZipArchive =>
    typeof data === "object" && data !== null && "generateAsync" in data && typeof data.generateAsync === "function";

// A Blob from another realm, such as a vm context's, isn't an instance of this realm's, so a Blob is told by its tag, as
// JSZip did. A File is a Blob
const isBlob = (data: InputDataType): data is Blob => ["[object Blob]", "[object File]"].includes(Object.prototype.toString.call(data));

/**
 * Reads a stream to its end, as a zip file lists its files at its end.
 *
 * It listens for the stream's events, rather than iterating it, so that a stream with no iterator also works, such
 * as `Packer.toStream`'s. A chunk is usually a run of bytes, but a stream made with `Readable.from` of a `Uint8Array`
 * gives each byte as a number of its own. Those are kept as numbers, not wrapped in an array each.
 */
const readStream = (stream: TemplateStream): Promise<Uint8Array> =>
    new Promise((resolve, reject) => {
        // eslint-disable-next-line functional/prefer-readonly-type
        const chunks: (Uint8Array | number)[] = [];
        stream.on("data", (chunk: unknown) => {
            // Not `instanceof Uint8Array`, which is false for a Buffer or Uint8Array from another realm, such as a vm context's
            if (ArrayBuffer.isView(chunk)) {
                // eslint-disable-next-line functional/immutable-data
                chunks.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
            } else if (typeof chunk === "number") {
                // eslint-disable-next-line functional/immutable-data
                chunks.push(chunk);
            } else {
                reject(
                    new TypeError(
                        `A template stream must give bytes, but it gave a ${typeof chunk}. A stream with an encoding set gives text, so do not set one.`,
                    ),
                );
            }
        });
        stream.on("error", reject);
        stream.on("end", () => {
            const bytes = new Uint8Array(
                chunks.reduce<number>((length, chunk) => length + (typeof chunk === "number" ? 1 : chunk.length), 0),
            );
            chunks.reduce<number>((offset, chunk) => {
                if (typeof chunk === "number") {
                    // eslint-disable-next-line functional/immutable-data
                    bytes[offset] = chunk;
                    return offset + 1;
                }
                bytes.set(chunk, offset);
                return offset + chunk.length;
            }, 0);
            resolve(bytes);
        });
    });

/** The bytes of a template's zip file, from any of the forms `patchDocument` and `patchDetector` take it in */
const bytesOf = async (data: InputDataType): Promise<Uint8Array> => {
    if (isZipArchive(data)) {
        return data.generateAsync({ type: "uint8array" });
    }
    if (isStream(data)) {
        return readStream(data);
    }
    if (isBlob(data)) {
        return new Uint8Array(await data.arrayBuffer());
    }
    if (typeof data === "string") {
        // A string with a character for each byte, as JSZip read it
        return Uint8Array.from({ length: data.length }, (_, index) => data.charCodeAt(index));
    }
    if (Array.isArray(data)) {
        return Uint8Array.from(data);
    }
    // Not `instanceof Uint8Array`, which is false for a Buffer or Uint8Array from another realm, such as a vm context's
    return ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
};

/**
 * The files in the zip file of a template, from any of the forms `patchDocument` and `patchDetector` take it in
 *
 * @param include - Which files to read, by their paths. The others aren't inflated.
 */
export const loadZip = async (data: InputDataType, include?: (path: string) => boolean): Promise<ReadonlyMap<string, Uint8Array>> =>
    unzipFiles(await bytesOf(data), include);
