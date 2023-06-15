const obfuscatedStartOffset = 0;
const obfuscatedEndOffset = 32;
const guidSize = 32;

export const obfuscate = (buf: Buffer, fontFilename: string): Buffer => {
    const guid = fontFilename.replace(/-/g, "").replace(/\..+$/, "");
    if (guid.length !== guidSize) {
        throw new Error(`Error: Cannot extract GUID from font filename: ${fontFilename}`);
    }

    const hexStrings = guid.replace(/(..)/g, "$1 ").trim().split(" ");
    const hexNumbers = hexStrings.map((hexString) => parseInt(hexString, 16));
    // eslint-disable-next-line functional/immutable-data
    hexNumbers.reverse();

    const bytesToObfuscate = buf.slice(obfuscatedStartOffset, obfuscatedEndOffset);
    // eslint-disable-next-line no-bitwise
    const obfuscatedBytes = bytesToObfuscate.map((byte, i) => byte ^ hexNumbers[i % hexNumbers.length]);

    const out = Buffer.concat([buf.slice(0, obfuscatedStartOffset), obfuscatedBytes, buf.slice(obfuscatedEndOffset)]);
    return out;
};
