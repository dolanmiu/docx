/**
 * Packer module for exporting documents to various output formats.
 *
 * @module
 */
import { Buffer as PlatformBuffer } from "node:buffer";
import { Stream as PlatformStream } from "node:stream";

import type { File } from "@file/file";

import type { IXmlifyedFile } from "./next-compiler";
import { EventPacker, type PackerPlatform, type PrettifyType } from "./packer-core";

export { PrettifyType } from "./packer-core";

/**
 * Exports documents to various output formats.
 *
 * The Packer class provides static methods to convert a File object into different
 * output formats such as Buffer, Blob, string, or stream. It handles the compilation
 * of the document structure into OOXML format and compression into a .docx ZIP archive.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Export to buffer (Node.js)
 * const buffer = await Packer.toBuffer(doc);
 *
 * // Export to blob (browser)
 * const blob = await Packer.toBlob(doc);
 *
 * // Export with prettified XML
 * const buffer = await Packer.toBuffer(doc, PrettifyType.WITH_2_BLANKS);
 * ```
 */
export class Packer extends EventPacker {
    protected static override readonly platform: PackerPlatform = {
        createStream: () => new PlatformStream(),
        bufferFrom: (bytes) =>
            (typeof Buffer === "undefined" ? PlatformBuffer : Buffer).from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    };

    // Bind output helpers to this public class, including when callers detach them.
    /**
     * Exports a document to a string representation.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a string
     */
    public static override toString(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<string> {
        return Packer.pack(file, "string", prettify, overrides);
    }

    /**
     * Exports a document to a Node.js Buffer.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a Buffer
     */
    public static toBuffer(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<Buffer> {
        return Packer.pack(file, "nodebuffer", prettify, overrides);
    }

    /**
     * Exports a document to a base64-encoded string.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a base64 string
     */
    public static override toBase64String(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<string> {
        return Packer.pack(file, "base64", prettify, overrides);
    }

    /**
     * Exports a document to a Blob (for browser environments).
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a Blob
     */
    public static override toBlob(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<Blob> {
        return Packer.pack(file, "blob", prettify, overrides);
    }

    /**
     * Exports a document to an ArrayBuffer.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as an ArrayBuffer
     */
    public static override toArrayBuffer(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<ArrayBuffer> {
        return Packer.pack(file, "arraybuffer", prettify, overrides);
    }
}
