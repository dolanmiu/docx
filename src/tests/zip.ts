/**
 * Helpers for tests that read the files in a zip file, such as a packed document, or make one, such as a template to
 * patch.
 *
 * @module
 * @internal
 */
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
