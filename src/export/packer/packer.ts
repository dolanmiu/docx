/**
 * Packer module for exporting documents to various output formats.
 *
 * @module
 */
import { Stream } from "stream";

import { File } from "@file/file";
import { OutputByType, OutputType } from "@util/output-type";

import { Compiler, IXmlifyedFile } from "./next-compiler";

/**
 * Prettify options for formatting XML output.
 *
 * Controls the indentation style used when formatting the generated XML.
 * Prettified output is more human-readable but results in larger file sizes.
 */
export const PrettifyType = {
    /** No prettification (smallest file size) */
    NONE: "",
    /** Indent with 2 spaces */
    WITH_2_BLANKS: "  ",
    /** Indent with 4 spaces */
    WITH_4_BLANKS: "    ",
    /** Indent with tab character */
    WITH_TAB: "\t",
} as const;

const convertPrettifyType = (
    prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
): (typeof PrettifyType)[keyof typeof PrettifyType] | undefined =>
    prettify === true ? PrettifyType.WITH_2_BLANKS : prettify === false ? undefined : prettify;

/**
 * Exports documents to various output formats.
 *
 * The Packer class provides static methods to convert a File object into different
 * output formats such as Buffer, Blob, string, or stream. It handles the compilation
 * of the document structure into OOXML format and compression into a .docx ZIP archive.
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
export class Packer {
    /**
     * Exports a document to the specified output format.
     *
     * @param file - The document to export
     * @param type - The output format type (e.g., "nodebuffer", "blob", "string")
     * @param prettify - Whether to prettify the XML output (boolean or PrettifyType)
     * @param overrides - Optional array of file overrides for custom XML content
     * @returns A promise resolving to the exported document in the specified format
     */
    // eslint-disable-next-line require-await
    public static async pack<T extends OutputType>(
        file: File,
        type: T,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<OutputByType[T]> {
        const zip = this.compiler.compile(file, convertPrettifyType(prettify), overrides);
        return zip.generateAsync({
            type,
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        });
    }

    /**
     * Exports a document to a string representation.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A promise resolving to the document as a string
     */
    public static toString(
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
    public static toBase64String(
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
    public static toBlob(
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
    public static toArrayBuffer(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<ArrayBuffer> {
        return Packer.pack(file, "arraybuffer", prettify, overrides);
    }

    /**
     * Exports a document to a Node.js Stream.
     *
     * @param file - The document to export
     * @param prettify - Whether to prettify the XML output
     * @param overrides - Optional array of file overrides
     * @returns A readable stream containing the document data
     */
    public static toStream(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Stream {
        const stream = new Stream();
        const zip = this.compiler.compile(file, convertPrettifyType(prettify), overrides);

        zip.generateAsync({
            type: "nodebuffer",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE",
        }).then((z) => {
            stream.emit("data", z);
            stream.emit("end");
        });

        return stream;
    }

    private static readonly compiler = new Compiler();
}
