/**
 * Output type definitions for document generation.
 *
 * This module defines the various output formats supported when generating
 * .docx files. These types correspond to JSZip's output formats.
 *
 * @module
 */

/* v8 ignore start */
// Simply type definitions. Can ignore testing and coverage

/**
 * Maps output type names to their corresponding TypeScript types.
 *
 * This type is used to provide type-safe document generation where the output
 * format determines the return type. Based on JSZip's output types.
 *
 * @example
 * ```typescript
 * // Generate as base64 string
 * const doc: OutputByType["base64"] = await packer.toBase64(document);
 *
 * // Generate as Buffer (Node.js)
 * const doc: OutputByType["nodebuffer"] = await packer.toBuffer(document);
 *
 * // Generate as Blob (browser)
 * const doc: OutputByType["blob"] = await packer.toBlob(document);
 * ```
 */
export type OutputByType = {
    /** Base64-encoded string representation */
    readonly base64: string;
    /** UTF-8 string representation */
    // eslint-disable-next-line id-denylist
    readonly string: string;
    /** Text string representation */
    readonly text: string;
    /** Binary string representation */
    readonly binarystring: string;
    /** Array of numbers (0-255) representing bytes */
    readonly array: readonly number[];
    /** Uint8Array (typed array) representation */
    readonly uint8array: Uint8Array;
    /** ArrayBuffer representation */
    readonly arraybuffer: ArrayBuffer;
    /** Blob representation (browser environments) */
    readonly blob: Blob;
    /** Node.js Buffer representation */
    readonly nodebuffer: Buffer;
};

/**
 * Valid output type identifiers.
 *
 * Use these string literals to specify the desired output format when
 * generating documents.
 *
 * @example
 * ```typescript
 * const outputType: OutputType = "base64";
 * const doc = await packer.generate(document, { type: outputType });
 * ```
 */
export type OutputType = keyof OutputByType;
/* v8 ignore stop */
