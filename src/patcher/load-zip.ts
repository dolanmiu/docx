import JSZip from "jszip";
import type { Stream } from "stream";

import type { InputDataType } from "./from-docx";

type TemplateStream = NodeJS.ReadableStream | Stream;

const isStream = (data: InputDataType): data is TemplateStream =>
    typeof data === "object" && data !== null && "on" in data && typeof data.on === "function";

/**
 * Reads a stream to its end, as JSZip cannot load a zip file from a stream.
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

/** Opens the zip file of a template, from any of the forms `patchDocument` and `patchDetector` take it in */
export const loadZip = async (data: InputDataType): Promise<JSZip> => {
    if (data instanceof JSZip) {
        return data;
    }
    return JSZip.loadAsync(isStream(data) ? await readStream(data) : data);
};
