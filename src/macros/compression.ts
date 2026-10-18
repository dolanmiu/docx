/**
 * The compression VBA uses for a project's module information and for each module's code, a run length encoding.
 *
 * Reference: [MS-OVBA] 2.4.1 Compression and Decompression
 *
 * @module
 */
/* eslint-disable no-bitwise -- the compressed data is made of bit fields */

// Data is compressed in chunks of this many bytes, and each chunk's compressed bytes, after its header, are at most this
// many too. A chunk that doesn't compress to fewer is written as it is
const CHUNK_SIZE = 4096;

// The bits of a chunk's header after its size: the signature, 0b011, and whether the chunk is compressed
const CHUNK_SIGNATURE = 0x3000;
const CHUNK_COMPRESSED = 0x8000;

/**
 * The bits of a copy token that hold the copy's length, the rest holding its offset. The further into its chunk a copy
 * is, the more bits its offset can need.
 *
 * Reference: [MS-OVBA] 2.4.1.3.19.1 CopyToken Help
 *
 * @param position - How far into its chunk the copy is, at least 1
 */
const lengthBitsAt = (position: number): number => 16 - Math.max(32 - Math.clz32(position - 1), 4);

/**
 * The longest earlier run of bytes in the chunk that the bytes from `current` repeat, the nearest of the longest.
 *
 * Reference: [MS-OVBA] 2.4.1.3.19.4 Matching
 *
 * @returns How far back the run starts and how long it is, or `undefined` for none of at least 3 bytes
 */
const findMatch = (
    data: Uint8Array,
    chunkStart: number,
    current: number,
    chunkEnd: number,
): { readonly offset: number; readonly length: number } | undefined => {
    let bestLength = 0;
    let bestCandidate = 0;
    for (let candidate = current - 1; candidate >= chunkStart; candidate--) {
        let length = 0;
        // A run can overlap the bytes it is copied to, as a repeated character does
        while (current + length < chunkEnd && data[current + length] === data[candidate + length]) {
            length++;
        }
        if (length > bestLength) {
            bestLength = length;
            bestCandidate = candidate;
        }
    }
    if (bestLength < 3) {
        return undefined;
    }
    const maximumLength = (1 << lengthBitsAt(current - chunkStart)) - 1 + 3;
    return { offset: current - bestCandidate, length: Math.min(bestLength, maximumLength) };
};

/**
 * Compresses a chunk: groups of up to eight tokens, each group after a byte whose bits say which of its tokens are a
 * byte as it is and which copy earlier bytes.
 *
 * Reference: [MS-OVBA] 2.4.1.3.7 Compressing a DecompressedChunk
 */
const compressChunk = (data: Uint8Array, chunkStart: number, chunkEnd: number): readonly number[] => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const tokens: number[] = [];
    let current = chunkStart;
    while (current < chunkEnd) {
        const flagIndex = tokens.length;
        // eslint-disable-next-line functional/immutable-data
        tokens.push(0);
        for (let index = 0; index < 8 && current < chunkEnd; index++) {
            const match = findMatch(data, chunkStart, current, chunkEnd);
            if (match === undefined) {
                // eslint-disable-next-line functional/immutable-data
                tokens.push(data[current]);
                current++;
            } else {
                const lengthBits = lengthBitsAt(current - chunkStart);
                const token = ((match.offset - 1) << lengthBits) | (match.length - 3);
                // eslint-disable-next-line functional/immutable-data
                tokens.push(token & 0xff, token >> 8);
                // eslint-disable-next-line functional/immutable-data
                tokens[flagIndex] |= 1 << index;
                current += match.length;
            }
        }
    }

    // The header has the chunk's size, with the header, less 3
    if (tokens.length <= CHUNK_SIZE) {
        const compressedHeader = CHUNK_COMPRESSED | CHUNK_SIGNATURE | (tokens.length + 2 - 3);
        return [compressedHeader & 0xff, compressedHeader >> 8, ...tokens];
    }

    // An uncompressed chunk is always 4096 bytes, so a short last one is padded with zeros
    const header = CHUNK_SIGNATURE | (CHUNK_SIZE + 2 - 3);
    const raw = new Uint8Array(CHUNK_SIZE);
    raw.set(data.subarray(chunkStart, chunkEnd));
    return [header & 0xff, header >> 8, ...raw];
};

/**
 * Compresses data as VBA does.
 *
 * Reference: [MS-OVBA] 2.4.1.3.6 Compression algorithm
 */
export const compress = (data: Uint8Array): Uint8Array => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const output: number[] = [0x01];
    for (let chunkStart = 0; chunkStart < data.length; chunkStart += CHUNK_SIZE) {
        // eslint-disable-next-line functional/immutable-data
        output.push(...compressChunk(data, chunkStart, Math.min(chunkStart + CHUNK_SIZE, data.length)));
    }
    return Uint8Array.from(output);
};
