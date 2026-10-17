import JSZip from "jszip";

import type { InputDataType } from "./from-docx";

/** A stream of the template's bytes, such as `fs.createReadStream`'s */
type ByteStream = AsyncIterable<unknown>;

const isByteStream = (data: InputDataType): data is InputDataType & ByteStream =>
    typeof data === "object" && data !== null && Symbol.asyncIterator in data;

/**
 * Reads a stream to its end, as JSZip cannot load a zip file from a stream.
 *
 * A chunk is usually a run of bytes, but a stream made with `Readable.from` of a `Uint8Array` gives each byte as a
 * number of its own.
 */
const readStream = async (stream: ByteStream): Promise<Uint8Array> => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        // Not `instanceof Uint8Array`, which is false for a Buffer or Uint8Array from another realm, such as a vm context's
        if (ArrayBuffer.isView(chunk)) {
            // eslint-disable-next-line functional/immutable-data
            chunks.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
        } else if (typeof chunk === "number") {
            // eslint-disable-next-line functional/immutable-data
            chunks.push(Uint8Array.of(chunk));
        } else {
            throw new TypeError(
                `A template stream must give bytes, but it gave a ${typeof chunk}. A stream with an encoding set gives text, so do not set one.`,
            );
        }
    }
    const bytes = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
    chunks.reduce((offset, chunk) => {
        bytes.set(chunk, offset);
        return offset + chunk.length;
    }, 0);
    return bytes;
};

/** Opens the zip file of a template, from any of the forms `patchDocument` and `patchDetector` take it in */
export const loadZip = async (data: InputDataType): Promise<JSZip> => {
    if (data instanceof JSZip) {
        return data;
    }
    return JSZip.loadAsync(isByteStream(data) ? await readStream(data) : data);
};
