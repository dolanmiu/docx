/**
 * Helpers for tests of docx/macros: they read the VBA projects it writes back, as Word does, from the specifications
 * rather than from docx/macros' own code.
 */
/* eslint-disable no-bitwise -- the formats are bit fields */

/**
 * Decompresses data VBA compressed.
 *
 * Reference: [MS-OVBA] 2.4.1.3.1 Decompression Algorithm
 */
export const decompress = (data: Uint8Array): Uint8Array => {
    // eslint-disable-next-line functional/prefer-readonly-type
    const output: number[] = [];
    // After the signature byte, 0x01
    let chunkStart = 1;
    while (chunkStart < data.length) {
        const header = data[chunkStart] | (data[chunkStart + 1] << 8);
        const chunkEnd = Math.min(data.length, chunkStart + (header & 0x0fff) + 3);
        const decompressedStart = output.length;
        let current = chunkStart + 2;
        if ((header & 0x8000) === 0) {
            // eslint-disable-next-line functional/immutable-data
            output.push(...data.subarray(current, current + 4096));
        } else {
            while (current < chunkEnd) {
                const flags = data[current++];
                for (let index = 0; index < 8 && current < chunkEnd; index++) {
                    if ((flags & (1 << index)) === 0) {
                        // eslint-disable-next-line functional/immutable-data
                        output.push(data[current++]);
                        continue;
                    }
                    const token = data[current] | (data[current + 1] << 8);
                    current += 2;
                    const difference = output.length - decompressedStart;
                    const bitCount = Math.max(Math.ceil(Math.log2(difference)), 4);
                    const length = (token & (0xffff >> bitCount)) + 3;
                    const offset = (token >> (16 - bitCount)) + 1;
                    for (let copied = 0; copied < length; copied++) {
                        // eslint-disable-next-line functional/immutable-data
                        output.push(output[output.length - offset]);
                    }
                }
            }
        }
        chunkStart = chunkEnd;
    }
    return Uint8Array.from(output);
};
