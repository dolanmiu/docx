/**
 * Font obfuscation module for embedding fonts in WordprocessingML documents.
 *
 * This module implements the OOXML font obfuscation algorithm used to embed
 * fonts in DOCX documents. Obfuscation is required by the OOXML specification
 * to prevent simple extraction of embedded font files.
 *
 * Reference: ECMA-376 Part 2, Section 11.1 (Font Embedding)
 *
 * @module
 */

/** Start offset for obfuscation in the font file */
const obfuscatedStartOffset = 0;
/** End offset for obfuscation (first 32 bytes are obfuscated) */
const obfuscatedEndOffset = 32;
/** Expected GUID size (32 hex characters without dashes) */
const guidSize = 32;

/**
 * Obfuscates a TrueType font file for embedding in OOXML documents.
 *
 * The obfuscation algorithm XORs the first 32 bytes of the font file
 * with a reversed byte sequence derived from the font's GUID key.
 * This prevents simple extraction while maintaining font functionality.
 *
 * @param buf - The original font file as a byte array
 * @param fontKey - The GUID key for the font (with or without dashes)
 * @returns The obfuscated font data
 * @throws Error if the fontKey is not a valid 32-character GUID
 *
 * @example
 * ```typescript
 * const fontData = readFileSync("font.ttf");
 * const fontKey = "00000000-0000-0000-0000-000000000000";
 * const obfuscatedData = obfuscate(fontData, fontKey);
 * ```
 *
 * @internal
 */
export const obfuscate = (buf: Uint8Array, fontKey: string): Uint8Array => {
    const guid = fontKey.replace(/-/g, "");
    if (guid.length !== guidSize) {
        throw new Error(`Error: Cannot extract GUID from font filename: ${fontKey}`);
    }

    const hexStrings = guid.replace(/(..)/g, "$1 ").trim().split(" ");
    const hexNumbers = hexStrings.map((hexString) => parseInt(hexString, 16));
    // eslint-disable-next-line functional/immutable-data
    hexNumbers.reverse();

    const bytesToObfuscate = buf.slice(obfuscatedStartOffset, obfuscatedEndOffset);
    // eslint-disable-next-line no-bitwise
    const obfuscatedBytes = bytesToObfuscate.map((byte, i) => byte ^ hexNumbers[i % hexNumbers.length]);

    const out = new Uint8Array(obfuscatedStartOffset + obfuscatedBytes.length + Math.max(0, buf.length - obfuscatedEndOffset));
    out.set(buf.slice(0, obfuscatedStartOffset));
    out.set(obfuscatedBytes, obfuscatedStartOffset);
    out.set(buf.slice(obfuscatedEndOffset), obfuscatedStartOffset + obfuscatedBytes.length);
    return out;
};
