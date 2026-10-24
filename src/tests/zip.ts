/**
 * Helpers for tests that read the files in a zip file, such as a packed document, or make one, such as a template to
 * patch.
 *
 * @module
 * @internal
 */
import { expect } from "vitest";

import { type ZipFileData, unzipFiles, zipFiles } from "@util/zip";

/** The files in a zip file, such as a packed document, by their paths. Folders are left out. */
export const unzip = (data: Uint8Array | ArrayBuffer): ReadonlyMap<string, Uint8Array> =>
    unzipFiles(data instanceof Uint8Array ? data : new Uint8Array(data));

/** The text of the file at a path in a zip file's files, or `undefined` when there's no file there */
export const textOf = (files: ReadonlyMap<string, Uint8Array>, path: string): string | undefined => {
    const file = files.get(path);
    return file === undefined ? undefined : new TextDecoder().decode(file);
};

/** A zip file of files given as text, which is written as UTF-8, or bytes, such as a template to patch */
export const zip = (files: Readonly<Record<string, ZipFileData>>): Uint8Array => zipFiles(Object.entries(files));

/**
 * The offset of the header of a file in a zip file: its local header (PK\x03\x04), or its entry in the central
 * directory (PK\x01\x02), whose name starts 30 or 46 bytes in
 */
const headerOf = (zipFile: Uint8Array, signature: number, nameAt: number, path: string): number => {
    const view = new DataView(zipFile.buffer, zipFile.byteOffset, zipFile.byteLength);
    const name = new TextEncoder().encode(path);
    const offset = zipFile.findIndex(
        (_, index) =>
            index + nameAt + name.length <= zipFile.length &&
            view.getUint32(index, true) === signature &&
            name.every((byte, at) => zipFile[index + nameAt + at] === byte),
    );
    expect(offset, `The zip file has no ${path}`).toBeGreaterThanOrEqual(0);
    return offset;
};

/** A copy of a zip file whose central directory gives a file another size, as a damaged or crafted zip file might */
export const declaringSize = (zipFile: Uint8Array, path: string, size: number): Uint8Array => {
    const copy = zipFile.slice();
    new DataView(copy.buffer).setUint32(headerOf(copy, 0x02014b50, 46, path) + 24, size, true);
    return copy;
};

/** A copy of a zip file whose compressed data for a file can't be inflated */
export const damaging = (zipFile: Uint8Array, path: string): Uint8Array => {
    const copy = zipFile.slice();
    const view = new DataView(copy.buffer);
    const header = headerOf(copy, 0x04034b50, 30, path);
    const start = header + 30 + view.getUint16(header + 26, true) + view.getUint16(header + 28, true);
    copy.fill(0xff, start, start + view.getUint32(header + 18, true));
    return copy;
};
