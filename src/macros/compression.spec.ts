import { describe, expect, it } from "vitest";

import { decompress } from "tests/macros";

import { compress } from "./compression";

const bytes = (text: string): Uint8Array => Uint8Array.from(text, (character) => character.charCodeAt(0));
const hex = (text: string): Uint8Array => Uint8Array.from(text.split(" "), (byte) => parseInt(byte, 16));

describe("compress", () => {
    // [MS-OVBA] 3.2 Compression/Decompression Examples
    it("should compress text with nothing repeated as [MS-OVBA]'s example does", () => {
        expect(compress(bytes("abcdefghijklmnopqrstuv."))).toEqual(
            hex("01 19 B0 00 61 62 63 64 65 66 67 68 00 69 6A 6B 6C 6D 6E 6F 70 00 71 72 73 74 75 76 2E"),
        );
    });

    it("should compress text with runs repeated as [MS-OVBA]'s example does", () => {
        expect(compress(bytes("#aaabcdefaaaaghijaaaaaklaaamnopqaaaaaaaaaaaarstuvwxyzaaa"))).toEqual(
            hex(
                "01 2F B0 00 23 61 61 61 62 63 64 65 82 66 00 70 61 67 68 69 6A 01 38 08 61 6B 6C 00 20 6D 6E 6F 70 06 71 02 70 04 00 72 73 74 75 76 10 77 78 79 7A 00 2C",
            ),
        );
    });

    it("should compress a repeated character into one copy as [MS-OVBA]'s example does", () => {
        expect(compress(bytes("a".repeat(73)))).toEqual(hex("01 03 B0 02 61 45 00"));
    });

    it("should write only the signature for nothing", () => {
        expect(compress(new Uint8Array())).toEqual(Uint8Array.from([0x01]));
    });

    it("should compress data longer than a chunk in chunks of 4096 bytes, which decompress to it", () => {
        const text = bytes(Array.from({ length: 500 }, (_, index) => `    Debug.Print "Line ${index}"\r\n`).join(""));
        const compressed = compress(text);

        expect(text.length).toBeGreaterThan(3 * 4096);
        expect(compressed.length).toBeLessThan(text.length / 2);
        expect(decompress(compressed)).toEqual(text);
    });

    it("should write a chunk that doesn't compress as it is, padding the last one to 4096 bytes", () => {
        // Bytes that don't repeat a run of 3, so each is a literal, and a chunk of them grows by its flag bytes. The last
        // chunk, of 3700, grows to more than 4096 bytes too
        let seed = 1;
        const random = Uint8Array.from({ length: 4096 + 3700 }, () => {
            seed = (seed * 1103515245 + 12345) % 2 ** 31;
            return Math.floor(seed / 65536);
        });
        const compressed = compress(random);

        // The signature, then two uncompressed chunks, each a header with the size 4095 and no compressed flag
        expect(compressed.length).toBe(1 + 2 * (2 + 4096));
        expect([compressed[1], compressed[2]]).toEqual([0xff, 0x3f]);
        expect([compressed[4099], compressed[4100]]).toEqual([0xff, 0x3f]);
        expect(decompress(compressed)).toEqual(Uint8Array.from([...random, ...new Uint8Array(4096 - 3700)]));
    });
});
