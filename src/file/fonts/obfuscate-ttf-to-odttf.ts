/**
 * ODTTF (Obfuscated Document TTF) font obfuscation for OOXML embedding.
 *
 * Office Open XML uses a simple XOR-based obfuscation when embedding fonts
 * to discourage casual extraction. This is NOT encryption—just obfuscation.
 *
 * Algorithm
 * 1. Extract 16-byte key from GUID (remove hyphens, parse hex pairs, reverse)
 * 2. XOR the first 32 bytes of the font with the key (cycling through 16 bytes)
 * 3. Leave remaining bytes unchanged
 */

const obfuscatedStartOffset = 0;
const obfuscatedEndOffset = 32;
const guidSize = 32;

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
