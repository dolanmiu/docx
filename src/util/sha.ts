/**
 * SHA-1 and SHA-256, for the names of media files and the hashes of passwords that protect a document. They are worked
 * out here because documents are written synchronously, and browsers only hash asynchronously.
 *
 * @module
 */
/* eslint-disable no-bitwise, functional/immutable-data -- the hashes are worked out on 32-bit words, in place */

/**
 * The words the bytes come to once padded as SHA-1 and SHA-256 pad them: a 1 bit, then 0 bits up to a multiple of 64
 * bytes, the last 8 of which are the length in bits. Words and the length are big-endian.
 */
const paddedWords = (data: Uint8Array): Int32Array => {
    const words = new Int32Array(Math.ceil((data.length + 9) / 64) * 16);
    for (let index = 0; index < data.length; index++) {
        words[index >> 2] |= data[index] << (24 - (index & 3) * 8);
    }
    words[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
    words[words.length - 2] = Math.floor(data.length / 0x20000000);
    words[words.length - 1] = data.length * 8;
    return words;
};

/** The bytes of the words of a hash, big-endian */
const bytesOfWords = (words: readonly number[]): Uint8Array => {
    const bytes = new Uint8Array(words.length * 4);
    for (let index = 0; index < bytes.length; index++) {
        bytes[index] = words[index >> 2] >>> (24 - (index & 3) * 8);
    }
    return bytes;
};

const rotateLeft = (word: number, bits: number): number => (word << bits) | (word >>> (32 - bits));
const rotateRight = (word: number, bits: number): number => (word >>> bits) | (word << (32 - bits));

const SHA1_INITIAL_HASH = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

// A constant for each 20 of SHA-1's rounds
const SHA1_ROUND_CONSTANTS = Int32Array.of(0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6);

// The words each block is expanded to, which are worked out again for each block. Hashing is synchronous, so one
// array does for every hash
const sha1Schedule = new Int32Array(80);

/** SHA-1 of bytes, as in FIPS 180-4 */
export const sha1 = (data: Uint8Array): Uint8Array => {
    const words = paddedWords(data);
    const schedule = sha1Schedule;
    let [h0, h1, h2, h3, h4] = SHA1_INITIAL_HASH;
    for (let block = 0; block < words.length; block += 16) {
        schedule.set(words.subarray(block, block + 16));
        for (let t = 16; t < 80; t++) {
            schedule[t] = rotateLeft(schedule[t - 3] ^ schedule[t - 8] ^ schedule[t - 14] ^ schedule[t - 16], 1);
        }
        let [a, b, c, d, e] = [h0, h1, h2, h3, h4];
        for (let t = 0; t < 80; t++) {
            const f = t < 20 ? (b & c) | (~b & d) : t >= 40 && t < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
            const next = (rotateLeft(a, 5) + f + e + SHA1_ROUND_CONSTANTS[Math.floor(t / 20)] + schedule[t]) | 0;
            e = d;
            d = c;
            c = rotateLeft(b, 30);
            b = a;
            a = next;
        }
        [h0, h1, h2, h3, h4] = [(h0 + a) | 0, (h1 + b) | 0, (h2 + c) | 0, (h3 + d) | 0, (h4 + e) | 0];
    }
    return bytesOfWords([h0, h1, h2, h3, h4]);
};

// The first 32 bits of the fractional parts of the cube roots of the first 64 primes
const SHA256_ROUND_CONSTANTS = Int32Array.of(
    0x428a2f98,
    0x71374491,
    0xb5c0fbcf,
    0xe9b5dba5,
    0x3956c25b,
    0x59f111f1,
    0x923f82a4,
    0xab1c5ed5,
    0xd807aa98,
    0x12835b01,
    0x243185be,
    0x550c7dc3,
    0x72be5d74,
    0x80deb1fe,
    0x9bdc06a7,
    0xc19bf174,
    0xe49b69c1,
    0xefbe4786,
    0x0fc19dc6,
    0x240ca1cc,
    0x2de92c6f,
    0x4a7484aa,
    0x5cb0a9dc,
    0x76f988da,
    0x983e5152,
    0xa831c66d,
    0xb00327c8,
    0xbf597fc7,
    0xc6e00bf3,
    0xd5a79147,
    0x06ca6351,
    0x14292967,
    0x27b70a85,
    0x2e1b2138,
    0x4d2c6dfc,
    0x53380d13,
    0x650a7354,
    0x766a0abb,
    0x81c2c92e,
    0x92722c85,
    0xa2bfe8a1,
    0xa81a664b,
    0xc24b8b70,
    0xc76c51a3,
    0xd192e819,
    0xd6990624,
    0xf40e3585,
    0x106aa070,
    0x19a4c116,
    0x1e376c08,
    0x2748774c,
    0x34b0bcb5,
    0x391c0cb3,
    0x4ed8aa4a,
    0x5b9cca4f,
    0x682e6ff3,
    0x748f82ee,
    0x78a5636f,
    0x84c87814,
    0x8cc70208,
    0x90befffa,
    0xa4506ceb,
    0xbef9a3f7,
    0xc67178f2,
);

// The first 32 bits of the fractional parts of the square roots of the first 8 primes
const SHA256_INITIAL_HASH = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

const sha256Schedule = new Int32Array(64);

/** SHA-256 of bytes, as in FIPS 180-4 */
export const sha256 = (data: Uint8Array): Uint8Array => {
    const words = paddedWords(data);
    const schedule = sha256Schedule;
    let [h0, h1, h2, h3, h4, h5, h6, h7] = SHA256_INITIAL_HASH;
    for (let block = 0; block < words.length; block += 16) {
        schedule.set(words.subarray(block, block + 16));
        for (let t = 16; t < 64; t++) {
            const early = schedule[t - 15];
            const late = schedule[t - 2];
            schedule[t] =
                schedule[t - 16] +
                (rotateRight(early, 7) ^ rotateRight(early, 18) ^ (early >>> 3)) +
                schedule[t - 7] +
                (rotateRight(late, 17) ^ rotateRight(late, 19) ^ (late >>> 10));
        }
        let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7];
        for (let t = 0; t < 64; t++) {
            const first =
                (h +
                    (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) +
                    ((e & f) ^ (~e & g)) +
                    SHA256_ROUND_CONSTANTS[t] +
                    schedule[t]) |
                0;
            const second = ((rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
            h = g;
            g = f;
            f = e;
            e = (d + first) | 0;
            d = c;
            c = b;
            b = a;
            a = (first + second) | 0;
        }
        [h0, h1, h2, h3, h4, h5, h6, h7] = [
            (h0 + a) | 0,
            (h1 + b) | 0,
            (h2 + c) | 0,
            (h3 + d) | 0,
            (h4 + e) | 0,
            (h5 + f) | 0,
            (h6 + g) | 0,
            (h7 + h) | 0,
        ];
    }
    return bytesOfWords([h0, h1, h2, h3, h4, h5, h6, h7]);
};
