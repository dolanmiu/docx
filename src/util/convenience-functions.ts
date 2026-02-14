/**
 * Convenience utility functions for unit conversion and unique ID generation.
 *
 * This module provides:
 * - Unit conversion functions (millimeters/inches to TWIP)
 * - Unique ID generators for various document elements
 * - Hash and UUID generation utilities
 *
 * @module
 */
import hash from "hash.js";
import { customAlphabet, nanoid } from "nanoid/non-secure";

/**
 * Converts millimeters to TWIP (twentieths of a point).
 *
 * TWIP is a common unit in Office Open XML where 1 inch = 1440 TWIP.
 *
 * @param millimeters - The measurement in millimeters to convert
 * @returns The equivalent measurement in TWIP
 *
 * @example
 * ```typescript
 * const width = convertMillimetersToTwip(25.4); // Returns 1440 (1 inch)
 * ```
 */
export const convertMillimetersToTwip = (millimeters: number): number => Math.floor((millimeters / 25.4) * 72 * 20);

/**
 * Converts inches to TWIP (twentieths of a point).
 *
 * TWIP is a common unit in Office Open XML where 1 inch = 1440 TWIP.
 *
 * @param inches - The measurement in inches to convert
 * @returns The equivalent measurement in TWIP
 *
 * @example
 * ```typescript
 * const width = convertInchesToTwip(1); // Returns 1440
 * ```
 */
export const convertInchesToTwip = (inches: number): number => Math.floor(inches * 72 * 20);

/**
 * A function that generates unique sequential numeric IDs.
 */
export type UniqueNumericIdCreator = () => number;

/**
 * Creates a unique numeric ID generator with sequential numbering.
 *
 * @param initial - The initial value to start counting from (default: 0)
 * @returns A function that returns incrementing numbers on each call
 *
 * @example
 * ```typescript
 * const idGen = uniqueNumericIdCreator(10);
 * console.log(idGen()); // 11
 * console.log(idGen()); // 12
 * console.log(idGen()); // 13
 * ```
 */
export const uniqueNumericIdCreator = (initial = 0): UniqueNumericIdCreator => {
    let currentCount = initial;

    return () => ++currentCount;
};

/**
 * Creates a unique numeric ID generator for abstract numbering definitions.
 *
 * Abstract numbering definitions define the appearance and behavior of lists.
 *
 * @returns A function that generates sequential IDs starting from 1
 *
 * @example
 * ```typescript
 * const idGen = abstractNumUniqueNumericIdGen();
 * const id = idGen(); // Returns 1
 * ```
 */
export const abstractNumUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator();

/**
 * Creates a unique numeric ID generator for concrete numbering instances.
 *
 * Concrete numbering instances reference abstract numbering definitions and are
 * used to apply numbering to paragraphs. Initial value is 1 because ID 1 is
 * reserved for "default-bullet-numbering".
 *
 * @returns A function that generates sequential IDs starting from 2
 *
 * @example
 * ```typescript
 * const idGen = concreteNumUniqueNumericIdGen();
 * const id = idGen(); // Returns 2 (1 is reserved)
 * ```
 */
export const concreteNumUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator(1);

/**
 * Creates a unique numeric ID generator for document properties.
 *
 * @returns A function that generates sequential IDs starting from 1
 *
 * @example
 * ```typescript
 * const idGen = docPropertiesUniqueNumericIdGen();
 * const id = idGen(); // Returns 1
 * ```
 */
export const docPropertiesUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator();

/**
 * Creates a unique numeric ID generator for bookmarks.
 *
 * Bookmarks are used to mark specific locations in a document for navigation
 * and cross-referencing.
 *
 * @returns A function that generates sequential IDs starting from 1
 *
 * @example
 * ```typescript
 * const idGen = bookmarkUniqueNumericIdGen();
 * const id = idGen(); // Returns 1
 * ```
 */
export const bookmarkUniqueNumericIdGen = (): UniqueNumericIdCreator => uniqueNumericIdCreator();

/**
 * Generates a unique lowercase alphanumeric ID using nanoid.
 *
 * The ID is suitable for use as a relationship ID or other unique identifier
 * within a document.
 *
 * @returns A unique lowercase string ID
 */
export const uniqueId = (): string => nanoid().toLowerCase();

/**
 * Generates a SHA-1 hash of the provided data.
 *
 * Useful for generating deterministic IDs based on content, such as for
 * image references or revision tracking.
 *
 * @param data - The data to hash (Buffer, string, Uint8Array, or ArrayBuffer)
 * @returns A hexadecimal string representation of the SHA-1 hash
 *
 * @example
 * ```typescript
 * const hash = hashedId("Hello World"); // Returns "0a4d55a8d778e5022fab701977c5d840bbc486d0"
 * ```
 */
export const hashedId = (data: Buffer | string | Uint8Array | ArrayBuffer): string =>
    hash
        .sha1()
        .update(data instanceof ArrayBuffer ? new Uint8Array(data) : data)
        .digest("hex");

/**
 * Generates a random hexadecimal string of specified length.
 *
 * @param count - The number of hexadecimal characters to generate
 * @returns A random hexadecimal string
 */
const generateUuidPart = (count: number): string => customAlphabet("1234567890abcdef", count)();

/**
 * Generates a UUID v4-style unique identifier.
 *
 * The UUID follows the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * @returns A UUID string
 *
 * @example
 * ```typescript
 * const uuid = uniqueUuid(); // Returns "a3bb189e-8bf9-3888-9912-ace4e6543002"
 * ```
 */
export const uniqueUuid = (): string =>
    `${generateUuidPart(8)}-${generateUuidPart(4)}-${generateUuidPart(4)}-${generateUuidPart(4)}-${generateUuidPart(12)}`;

/**
 * Encode a string to UTF-8 bytes.
 *
 * This is used to pre-encode XML content before passing to JSZip,
 * which avoids a bug where JSZip's string chunking can split UTF-16
 * surrogate pairs for characters above U+FFFF (like emoji).
 *
 * @see https://github.com/Stuk/jszip/pull/963
 */
export const encodeUtf8 = (str: string): Uint8Array => {
    if (typeof TextEncoder !== "undefined") {
        return new TextEncoder().encode(str);
    }
    // Fallback for environments without TextEncoder (e.g., older Node.js)
    // Buffer.from handles surrogates correctly
    return new Uint8Array(Buffer.from(str, "utf-8"));
};
