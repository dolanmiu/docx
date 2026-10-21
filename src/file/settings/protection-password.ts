/**
 * Hashes the password that stops a document's protection, as Word does.
 *
 * Reference: ISO/IEC 29500-1 17.15.1.29 (documentProtection) and the legacy password algorithm it builds on,
 * ECMA-376 Part 4 2.15.1.28
 *
 * @module
 */
/* eslint-disable no-bitwise -- the legacy key is made of 16-bit words, and the iteration numbers are hashed as bytes */
import hash from "hash.js";

/** How many times Word hashes the password again, which is what it writes in `w:cryptSpinCount` */
export const PROTECTION_PASSWORD_SPIN_COUNT = 100000;

// Word only reads the first 15 characters of the password, counted in UTF-16 code units
const MAX_PASSWORD_LENGTH = 15;

// The legacy algorithm's starting values for the key's high-order word, one for each password length
const INITIAL_CODES = [
    0xe1f0, 0x1d0f, 0xcc9c, 0x84c0, 0x110c, 0x0e10, 0xf1ce, 0x313e, 0x1872, 0xe139, 0xd40f, 0x84f9, 0x280c, 0xa96a, 0x4ec3,
];

// The legacy algorithm's encryption matrix: a row for each character position (counted back from the 15th), and a
// column for each of the character's low seven bits
const ENCRYPTION_MATRIX = [
    [0xaefc, 0x4dd9, 0x9bb2, 0x2745, 0x4e8a, 0x9d14, 0x2a09],
    [0x7b61, 0xf6c2, 0xfda5, 0xeb6b, 0xc6f7, 0x9dcf, 0x2bbf],
    [0x4563, 0x8ac6, 0x05ad, 0x0b5a, 0x16b4, 0x2d68, 0x5ad0],
    [0x0375, 0x06ea, 0x0dd4, 0x1ba8, 0x3750, 0x6ea0, 0xdd40],
    [0xd849, 0xa0b3, 0x5147, 0xa28e, 0x553d, 0xaa7a, 0x44d5],
    [0x6f45, 0xde8a, 0xad35, 0x4a4b, 0x9496, 0x390d, 0x721a],
    [0xeb23, 0xc667, 0x9cef, 0x29ff, 0x53fe, 0xa7fc, 0x5fd9],
    [0x47d3, 0x8fa6, 0x0f6d, 0x1eda, 0x3db4, 0x7b68, 0xf6d0],
    [0xb861, 0x60e3, 0xc1c6, 0x93ad, 0x377b, 0x6ef6, 0xddec],
    [0x45a0, 0x8b40, 0x06a1, 0x0d42, 0x1a84, 0x3508, 0x6a10],
    [0xaa51, 0x4483, 0x8906, 0x022d, 0x045a, 0x08b4, 0x1168],
    [0x76b4, 0xed68, 0xcaf1, 0x85c3, 0x1ba7, 0x374e, 0x6e9c],
    [0x3730, 0x6e60, 0xdcc0, 0xa9a1, 0x4363, 0x86c6, 0x1dad],
    [0x3331, 0x6662, 0xccc4, 0x89a9, 0x0373, 0x06e6, 0x0dcc],
    [0x1021, 0x2042, 0x4084, 0x8108, 0x1231, 0x2462, 0x48c4],
];

// Rotates a 15-bit value left by one bit
const rotateLeft15 = (value: number): number => ((value >> 14) & 1) | ((value << 1) & 0x7fff);

/**
 * The legacy key Word derives from a password before hashing it, as uppercase hex in reversed byte order. The
 * standard's example is "Example", whose key 0x64CEED7E is written "7EEDCE64".
 *
 * @internal
 */
export const legacyPasswordKey = (password: string): string => {
    // Each UTF-16 code unit becomes one byte: its low byte, or its high byte when the low byte is 0. Word reads code
    // units, not code points, so an emoji is two, with a byte from each half of its surrogate pair
    const bytes = password
        .slice(0, MAX_PASSWORD_LENGTH)
        .split("")
        .map((character) => {
            const code = character.charCodeAt(0);
            return (code & 0xff) !== 0 ? code & 0xff : (code >> 8) & 0xff;
        });

    const highOrderWord = bytes.reduce(
        (word, byte, index) =>
            ENCRYPTION_MATRIX[MAX_PASSWORD_LENGTH - bytes.length + index].reduce(
                (current, code, bit) => ((byte >> bit) & 1 ? current ^ code : current),
                word,
            ),
        INITIAL_CODES[bytes.length - 1],
    );
    const lowOrderWord = (rotateLeft15(bytes.reduceRight((word, byte) => rotateLeft15(word) ^ byte, 0)) ^ bytes.length ^ 0xce4b) & 0xffff;

    return [lowOrderWord & 0xff, lowOrderWord >> 8, highOrderWord & 0xff, highOrderWord >> 8]
        .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
        .join("");
};

/**
 * Hashes a password for `w:documentProtection` as Word does, with SHA-256: SHA-256 of the salt and the password's
 * legacy key (in UTF-16LE), then SHA-256 of each hash and its iteration number (32-bit little-endian), `spinCount`
 * times.
 *
 * Word itself uses SHA-512, and reads either. hash.js's SHA-512 works its 64-bit words out in 32-bit halves, so
 * 100,000 rounds of it take a second or more, where SHA-256 takes about a tenth of that.
 *
 * @param password - The password, of at least one character
 * @param salt - The salt Word reads from `w:salt`
 * @param spinCount - How many times to hash again, which Word reads from `w:cryptSpinCount`
 * @returns The hash Word reads from `w:hash`
 *
 * @internal
 */
export const hashProtectionPassword = (password: string, salt: readonly number[], spinCount: number): readonly number[] => {
    const key = [...legacyPasswordKey(password)].flatMap((character) => [character.charCodeAt(0), 0]);

    let digest: readonly number[] = hash.sha256().update(salt).update(key).digest();
    for (let iteration = 0; iteration < spinCount; iteration++) {
        digest = hash
            .sha256()
            .update(digest)
            .update([iteration & 0xff, (iteration >> 8) & 0xff, (iteration >> 16) & 0xff, (iteration >>> 24) & 0xff])
            .digest();
    }
    return digest;
};

/**
 * Random bytes for a password's salt, from the platform's secure random numbers where it has them (browsers, and
 * Node.js from 19 on). The salt is written in the document beside the hash, so it only has to differ between
 * documents, and `Math.random` does that on older Node.js.
 *
 * @internal
 */
export const randomSalt = (length: number): readonly number[] => {
    const bytes = new Uint8Array(length);
    if (typeof globalThis.crypto?.getRandomValues === "function") {
        globalThis.crypto.getRandomValues(bytes);
        return [...bytes];
    }
    return [...bytes].map(() => Math.floor(Math.random() * 256));
};
