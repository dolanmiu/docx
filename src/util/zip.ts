/**
 * Zips and unzips packages, such as .docx files, and gives a zip file in the output types of `Packer` and
 * `patchDocument`.
 *
 * @module
 */
import { unzipSync, zipSync } from "fflate";

import { encodeUtf8 } from "./convenience-functions";
import type { OutputByType, OutputType } from "./output-type";

/** What a file in a package can be given as: text, which is written as UTF-8, or bytes */
export type ZipFileData = string | Uint8Array | ArrayBuffer;

/**
 * The bytes of a file in a package. Bytes from another realm, such as a vm context's Buffer, are read through this
 * realm's `Uint8Array`, as fflate tells a file's bytes from a folder of files by `instanceof Uint8Array`.
 */
const bytesOf = (data: ZipFileData): Uint8Array =>
    typeof data === "string"
        ? encodeUtf8(data)
        : ArrayBuffer.isView(data)
          ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
          : new Uint8Array(data);

/**
 * Zips a package's files, each compressed with DEFLATE, in the order they are given. A path given twice keeps its first
 * place and its last data, so a file can be replaced.
 */
export const zipFiles = (files: Iterable<readonly [string, ZipFileData]>): Uint8Array =>
    zipSync(Object.fromEntries([...files].map(([path, data]) => [path, bytesOf(data)])));

/** The files in a zip file by their paths, in the zip file's order. Its folders, which hold nothing, are left out. */
export const unzipFiles = (data: Uint8Array): ReadonlyMap<string, Uint8Array> =>
    new Map(Object.entries(unzipSync(data, { filter: ({ name }) => !name.endsWith("/") })));

/** A zip file as a string with a character for each byte, as JSZip, which docx used to zip with, gave it */
const binaryStringOf = (data: Uint8Array): string => {
    let text = "";
    // In pieces, as a function can only take so many arguments
    for (let start = 0; start < data.length; start += 0x8000) {
        text += String.fromCharCode(...data.subarray(start, start + 0x8000));
    }
    return text;
};

const unsupported = (type: string): Error => new Error(`${type} is not supported by this platform`);

const OUTPUTS: { readonly [Type in OutputType]: (data: Uint8Array, mimeType: string) => OutputByType[Type] } = {
    uint8array: (data) => data,
    arraybuffer: (data) => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
    array: (data) => Array.from(data),
    // eslint-disable-next-line id-denylist
    string: binaryStringOf,
    binarystring: binaryStringOf,
    base64: (data) => btoa(binaryStringOf(data)),
    blob: (data, mimeType) => {
        if (typeof Blob === "undefined") {
            throw unsupported("blob");
        }
        // fflate's bytes are in an ArrayBuffer, never a SharedArrayBuffer
        return new Blob([data as Uint8Array<ArrayBuffer>], { type: mimeType });
    },
    nodebuffer: (data) => {
        if (typeof Buffer === "undefined") {
            throw unsupported("nodebuffer");
        }
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    },
    // JSZip never gave text, as a zip file's bytes aren't
    text: () => {
        throw unsupported("text");
    },
};

/**
 * A zip file in one of the output types of `Packer` and `patchDocument`. The type's case doesn't matter, as it didn't
 * to JSZip.
 *
 * @param mimeType - The type a Blob is given
 */
export const zipOutput = <T extends OutputType>(data: Uint8Array, type: T, mimeType: string): OutputByType[T] => {
    const output = Object.prototype.hasOwnProperty.call(OUTPUTS, type.toLowerCase())
        ? OUTPUTS[type.toLowerCase() as OutputType]
        : undefined;
    if (output === undefined) {
        throw unsupported(type);
    }
    return output(data, mimeType) as OutputByType[T];
};
