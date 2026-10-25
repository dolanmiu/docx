/**
 * Packer module for exporting documents to various output formats.
 *
 * @module
 */
import type { Stream } from "stream";

import type { File } from "@file/file";
import type { OutputByType, OutputType } from "@util/output-type";
import { zipFiles, zipOutput } from "@util/zip";

import { Compiler, type IXmlifyedFile } from "./next-compiler";

/**
 * Prettify options for formatting XML output.
 *
 * Controls the indentation style used when formatting the generated XML.
 * Prettified output is more human-readable but results in larger file sizes.
 *
 * @publicApi
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

// A document with macros is a .docm, whose type isn't a .docx's
const mimeTypeOf = (file: File): string =>
    file.Macros === undefined
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/vnd.ms-word.document.macroEnabled.12";

/**
 * Exports documents to various output formats.
 *
 * The Packer class provides static methods to convert a File object into different
 * output formats such as Blob, string, or byte arrays. It handles the compilation
 * of the document structure into OOXML format and compression into a .docx ZIP archive.
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * // Export to blob (browser)
 * const blob = await Packer.toBlob(doc);
 *
 * // Export with prettified XML
 * const blob = await Packer.toBlob(doc, PrettifyType.WITH_2_BLANKS);
 * ```
 */
export class Packer {
    /**
     * Exports a document to the specified output format.
     *
     * @param file - The document to export
     * @param type - The output format type (e.g., "uint8array", "blob", "string")
     * @param prettify - Whether to prettify the XML output (boolean or PrettifyType)
     * @param overrides - Optional array of file overrides for custom XML content
     * @returns A promise resolving to the exported document in the specified format
     */
    // eslint-disable-next-line require-await
    public static async pack<T extends Exclude<OutputType, "nodebuffer">>(
        file: File,
        type: T,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<OutputByType[T]> {
        return zipOutput(zipFiles(this.compiler.compile(file, convertPrettifyType(prettify), overrides)), type, mimeTypeOf(file));
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

    protected static readonly compiler = new Compiler();
}

/** Buffer and stream operations supplied by each platform. @internal */
export type PackerPlatform = {
    readonly createStream: () => Stream;
    readonly bufferFrom: (bytes: Uint8Array) => Buffer;
};

/** Buffer and event-stream output for Node and legacy browser bundles. @internal */
export class EventPacker extends Packer {
    declare protected static readonly platform: PackerPlatform;

    /** Exports a document in any supported format, including a Buffer. */
    public static async pack<T extends OutputType>(
        file: File,
        type: T,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Promise<OutputByType[T]> {
        if (type.toLowerCase() === "nodebuffer") {
            const bytes = await super.pack(file, "uint8array", prettify, overrides);
            return this.platform.bufferFrom(bytes) as OutputByType[T];
        }
        return super.pack(file, type as Exclude<T, "nodebuffer">, prettify, overrides);
    }

    /**
     * Emits the completed archive after callers can attach listeners. Compilation errors
     * throw synchronously; deferred generation or listener failures emit an error.
     */
    public static toStream(
        file: File,
        prettify?: boolean | (typeof PrettifyType)[keyof typeof PrettifyType],
        overrides: readonly IXmlifyedFile[] = [],
    ): Stream {
        const stream = this.platform.createStream();
        const files = this.compiler.compile(file, convertPrettifyType(prettify), overrides);
        new Promise((resolve) => setTimeout(resolve))
            .then(() => {
                const bytes = zipFiles(files);
                stream.emit("data", this.platform.bufferFrom(bytes));
                stream.emit("end");
            })
            .catch((error: unknown) => {
                stream.emit("error", error);
            });
        return stream;
    }
}
